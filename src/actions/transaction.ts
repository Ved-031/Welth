"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { transactionSchema } from "@/lib/schema";
import { RecurringInterval } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const calculateNextRecurringDate = (
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeAmount = (obj: any) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

export const BulkDeleteTransactions = async (ids: string[]) => {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
    });
    if (transactions.length === 0) throw new Error("No transactions found");

    const accountBalanceChanges = transactions.reduce(
      (acc: Record<string, number>, transaction) => {
        const change =
          transaction.type === "INCOME"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();
        const accountId = transaction.accountId;
        acc[accountId] = (acc[accountId] || 0) + change;
        return acc;
      },
      {}
    );

    // Delete transactions and update account balances
    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: { in: ids },
          userId: user.id,
        },
      });
      for (const [accountId, balanceChanges] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: {
            id: accountId,
          },
          data: {
            balance: {
              increment: balanceChanges,
            },
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return { success: true, message: "Transactions deleted" };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting transactions:", error.message);
      return { success: false, message: error.message };
    }
    return {
      success: false,
      message: "Failed to delete transactions. Please try again.",
    };
  }
};

export const CreateTransaction = async (data: z.infer<typeof transactionSchema>) => {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });
    if (!account) throw new Error("Account not found");

    const balanceChange =
      data.type === "EXPENSE" ? Number(-data.amount) : Number(data.amount);
    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          amount: Number(data.amount),
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });
      await tx.account.update({
        where: {
          id: data.accountId,
        },
        data: {
          balance: newBalance,
        },
      });
      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return {
      success: true,
      data: serializeAmount(transaction),
    };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      throw new Error(error.message);
    }
  }
};

export const scanReceipt = async (file: File) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Convert array buffer to base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )

      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const res = await result.response;
    const text = res.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
        const data = JSON.parse(cleanedText);
        return {
            amount: parseFloat(data.amount),
            date: new Date(data.date),
            description: data.description,
            category: data.category,
            merchantName: data.merchantName,
        }
    } catch (parseError) {
        console.log("Error parsing JSON response:", parseError);
        throw new Error("Invalid response format from gemini.");
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to scan receipt!");
  }
};

export const GetTransaction = async (transactionId: string) => {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("User not authenticated");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if (!user) throw new Error("User not found");

        const transaction = await db.transaction.findUnique({
            where: {
                id: transactionId,
                userId: user.id,
            },
        });

        if(!transaction){
            throw new Error("Transaction not found");
        }

        return { success: true, data: serializeAmount(transaction) };
    } catch (error) {
        console.log(error);
        throw new Error("Failed to get transaction!");
    }
}

export const UpdateTransaction = async (transactionId: string, data: z.infer<typeof transactionSchema>) => {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("User not authenticated");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if (!user) throw new Error("User not found");

        const originalTransaction = await db.transaction.findUnique({
            where: {
                id: transactionId,
                userId: user.id,
            },
            include: {
                account: true,
            },
        });
        if(!originalTransaction) throw new Error("Transaction not found");

        // Calculate balance changes
        const oldBalanceChange = originalTransaction.type === "EXPENSE" ? Number(-originalTransaction.amount) : Number(originalTransaction.amount);
        const newBalanceChange = data.type === "EXPENSE" ? Number(-data.amount) : Number(data.amount);
        const netBalanceChange = newBalanceChange - oldBalanceChange;

        const transaction = await db.$transaction(async (tx) => {
            const updatedTransaction = await tx.transaction.update({
                where: {
                    id: transactionId,
                    userId: user.id,
                },
                data: {
                    ...data,
                    nextRecurringDate: data.isRecurring && data.recurringInterval ? calculateNextRecurringDate(new Date(), data.recurringInterval) : null,
                },
            });

            await tx.account.update({
                where: {
                    id: originalTransaction.accountId,
                    userId: user.id,
                },
                data: {
                    balance: {
                        increment: netBalanceChange
                    }
                },
            });

            return updatedTransaction;
        });

        revalidatePath('/dashboard');
        revalidatePath(`/account/${data.accountId}`);
        return { success: true, data: serializeAmount(transaction) };
    } catch (error) {
        console.log(error);
        throw new Error("Failed to update transaction!");
    }
}
