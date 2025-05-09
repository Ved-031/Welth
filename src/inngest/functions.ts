import { db } from "@/lib/prisma";
import { SendEmail } from "@/actions/send-email";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecurringInterval, Transaction } from "@prisma/client";

import { inngest } from "./client";
import EmailTemplate from "../../emails/template";


export const calculateNextRecurringDate = (
  startDate: Date,
  interval: RecurringInterval
) => {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
};

export const checkBudgetAlert = inngest.createFunction(
    { id: "check-budget-alerts", name: "Check Budget Alerts" },
    { cron: "0 */6 * * *" },
    async ({ step }) => {
        const budgets = await step.run("fetch-budget", async () => {
            return await db.budget.findMany({
                include: {
                    user: {
                        include: {
                            accounts: {
                                where: {
                                    isDefault: true,
                                },
                            },
                        },
                    },
                },
            });
        });

        for(const budget of budgets) {
            const defaultAccount = budget.user.accounts[0];
            if(!defaultAccount) continue;

            await step.run(`check-budget-${budget.id}`, async () => {
                const currentDate = new Date();
                const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

                const expenses = await db.transaction.aggregate({
                    where: {
                        userId: budget.userId,
                        accountId: defaultAccount.id,
                        type: "EXPENSE",
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth,
                        },
                    },
                    _sum: {
                        amount: true,
                    },
                });

                const totalExpenses = expenses._sum.amount?.toNumber() || 0;
                const budgetAmount = budget.amount;
                const percentageUsed = (totalExpenses / parseFloat(budgetAmount)) * 100;

                if(percentageUsed >= 80 && (!budget.lastAlertSent || isNewMonth(new Date(budget.lastAlertSent), new Date()))) {
                    // Send email
                    await SendEmail({
                        to: budget.user.email,
                        subject: `Budget Alert for ${defaultAccount.name}`,
                        react: EmailTemplate({
                            username: budget.user.name!,
                            type: "budget-alert",
                            data: {
                                percentageUsed,
                                budgetAmount: parseInt(budgetAmount).toFixed(1),
                                totalExpenses: parseInt(totalExpenses.toString()).toFixed(1),
                                accountName: defaultAccount.name,
                            }
                        })!,
                    })

                    // Update last alert sent in db
                    await db.budget.update({
                        where: {
                            id: budget.id,
                        },
                        data: {
                            lastAlertSent: new Date(),
                        },
                    });
                }
            })
        }
    }
);

export const generateMonthlyReport = inngest.createFunction(
    { id: "generate-monthly-report", name: "Generate Monthly Report" },
    { cron: "0 0 1 * *" },
    async ({ step }) => {
        const users = await step.run("fetch-users", async () => {
            return await db.user.findMany({
                include: {
                    accounts: true,
                },
            });
        });

        for(const user of users) {
            await step.run(`generate-report-${user.id}`, async () => {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);

                const stats = await getMonthlyStats(user.id, lastMonth);
                const monthName = lastMonth.toLocaleString("default", { month: "long" });

                // Generate AI Insights
                const insights = await generateFinancialInsights(stats, monthName);

                await SendEmail({
                    to: user.email,
                    subject: `Your Monthly Financial Report - ${monthName}`,
                    react: EmailTemplate({
                        username: user.name!,
                        type: "monthly-report",
                        data: {
                            stats,
                            month: monthName,
                            insights,
                        }
                    })!,
                });
            });
        }

        return { processed: users.length };
    }
);

export const triggerRecurringTransactions = inngest.createFunction(
    { id: "trigger-recurring-transactions", name: "Trigger Recurring Transactions" },
    { cron: "0 0 * * *" },
    async ({ step }) => {
        // 1. Fetch all due recurring transactions of all users
        const recurringTransactions = await step.run("fetch-recurring-transactions", async () => {
            return await db.transaction.findMany({
                where: {
                    isRecurring: true,
                    status: "COMPLETED",
                    OR: [
                        { lastProcessed: null }, // Never processed
                        { nextRecurringDate: { lte: new Date() } }, // Due date passed (lte: less than or equal to)
                    ]
                },
            });
        });

        // 2. Create event for each transaction
        if(recurringTransactions.length > 0) {
            const events = recurringTransactions.map((transaction) => ({
                name: "transaction.recurring.process",
                data: { transactionId: transaction.id, userId: transaction.userId },
            }));

            // 3. Send events to be processed
            await inngest.send(events);
        }

        return { triggered: recurringTransactions.length };
    }
);

export const processRecurringTransactions = inngest.createFunction(
    {
        id: "process-recurring-transactions",
        name: "Process Recurring Transactions",
        throttle: {
            limit: 10, // Only process 10 transactions at a time
            period: "1m", // per minute
            key: "event.data.userId" // per user
        },
    },
    {
        event: "transaction.recurring.process",
    },
    async ({ event, step }) => {
        // Validate event data
        if(!event?.data?.transactionId || !event?.data?.userId) {
            console.error("Invalid event data", event);
            return { error: "Missing required event data" };
        }

        // Process recurring transaction
        await step.run("process-transaction", async () => {
            const transaction = await db.transaction.findUnique({
                where: {
                    id: event.data.transactionId,
                    userId: event.data.userId,
                },
                include: {
                    account: true,
                },
            });

            if(!transaction || !isTransactionDue(transaction)) return;

            await db.$transaction(async (tx) => {
                // Create new transaction
                await tx.transaction.create({
                    data: {
                        type: transaction.type,
                        amount: transaction.amount,
                        description: `${transaction.description} (Recurring)`,
                        date: new Date(),
                        category: transaction.category,
                        userId: transaction.userId,
                        accountId: transaction.accountId,
                        isRecurring: false,
                    },
                });

                // Update account balance
                const balanceChange = transaction.type === "EXPENSE" ? Number(-transaction.amount) : Number(transaction.amount);
                await tx.account.update({
                    where: {
                        id: transaction.accountId,
                        userId: transaction.userId,
                    },
                    data: {
                        balance: {
                            increment: balanceChange
                        },
                    },
                });

                // Update last processed date and next recurring date
                await tx.transaction.update({
                    where: {
                        id: transaction.id,
                    },
                    data: {
                        lastProcessed: new Date(),
                        nextRecurringDate: calculateNextRecurringDate(new Date(), transaction.recurringInterval!),
                    },
                });
            });
        });
    }
);

function isNewMonth(lastAlertDate: Date, currentDate: Date) {
    return (
        lastAlertDate.getMonth() !== currentDate.getMonth() ||
        lastAlertDate.getFullYear() !== currentDate.getFullYear()
    )
}

function isTransactionDue(transaction: Transaction) {
    // If no lastProcessed date, it's due
    if(!transaction.lastProcessed) return true;

    const today = new Date();
    const nextDue = new Date(transaction.nextRecurringDate!);

    // Compare with next due date
    return nextDue <= today;
}

type Stats = {
    totalExpenses: number;
    totalIncome: number;
    byCategory: Record<string, number>;
    transactionCount: number;
}

async function getMonthlyStats(userId: string, month: Date): Promise<Stats> {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const transactions = await db.transaction.findMany({
        where: {
            userId,
            date: {
                gte: startDate,
                lte: endDate
            },
        },
    });

    return transactions.reduce(
        (stats, t) => {
            const amount = t.amount.toNumber();
            if(t.type === "EXPENSE") {
                stats.totalExpenses += amount;
                stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
            } else {
                stats.totalIncome += amount;
            }
            return stats;
        },
        {
            totalExpenses: 0,
            totalIncome: 0,
            byCategory: {} as Record<string, number>,
            transactionCount: transactions.length,
        }
    )
}

async function generateFinancialInsights(stats: Stats, month: string) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const promt =  `Analyze this financial data and provide 3 consice, actionable insights.
        Focus on spending patterns and practical advice.
        Keep it freindly and conversational.

        Financial Data for ${month}:
        - Total Income: ₹${stats.totalIncome}
        - Total Expenses: ₹${stats.totalExpenses}
        - Net Income: ₹${stats.totalIncome - stats.totalExpenses}
        - Expenses Categories: ${Object.entries(stats.byCategory).map(([category, amount]) => `${category}: ₹${amount}`).join(", ")}

        Format the response as a JSON array of strings, like this:
        ["insight 1", "insight 2", "insight 3"]
    `;

    try {
        const result = await model.generateContent(promt);
        const res = await result.response;
        const text = res.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error generating insights: ", error);
        return [
            "Your highest expense category this month might need attention",
            "Consider setting up a budget for better financial management.",
            "Track your recurring expenses to identify potential savings.",
        ];
    }
}
