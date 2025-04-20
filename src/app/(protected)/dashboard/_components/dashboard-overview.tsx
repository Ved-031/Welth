"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Account, Transaction } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface DashboardOverviewProps {
    accounts: Account[];
    transactions: Transaction[] | [];
}

const COLORS = [
    "#FF6868",
    "#4ECDC4",
    "#4587D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9FA8DA",
];

export const DashboardOverview = ({ accounts, transactions }: DashboardOverviewProps) => {

    const [selectedAccountId, setSelectedAccountId] = useState(accounts.find(a => a.isDefault)?.id || accounts[0]?.id);

    // Filter transactions based on selected account
    const accountTransactions = transactions.filter(t => t.accountId === selectedAccountId);
    const recentTransactions = accountTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    // Calculate expense breakdown for current month
    const currentDate = new Date();
    const currentMonthExpenses = accountTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return (
            t.type === "EXPENSE" &&
            transactionDate.getMonth() === currentDate.getMonth() &&
            transactionDate.getFullYear() === currentDate.getFullYear()
        );
    });

    // Group expenses by category
    const expenseByCategory = currentMonthExpenses.reduce((acc, t) => {
        const category = t.category;
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += parseFloat(t.amount.toString());
        return acc;
    }, {} as Record<string, number>);

    // Format data for pie chart
    const pieChartData = Object.entries(expenseByCategory).map(([category, amount]) => ({
        name: category,
        value: amount
    }));

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Transactions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-base font-normal">Recent Transactions</CardTitle>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentTransactions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No recent transactions
                            </p>
                        ) : (
                            recentTransactions.map((transaction) => (
                                <div key={transaction.id} className="flex items-center justify-between">
                                    {/* Desc and Date */}
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{transaction.description || "Untitled Transaction"}</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(transaction.date), "PP")}</p>
                                    </div>
                                    {/* Income or Expense */}
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "flex items-center",
                                            transaction.type === "EXPENSE" ? "text-red-500" : "text-green-500"
                                        )}>
                                            {transaction.type === "EXPENSE" ? (
                                                <ArrowDownRightIcon className="size-4 mr-1" />
                                            ) : (
                                                <ArrowUpRightIcon className="size-4 mr-1" />
                                            )}
                                            ₹{transaction.amount.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
            {/* Graphs */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-normal">Monthly Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-5">
                    {pieChartData.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            No expenses this month
                        </p>
                    ) : (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                        fill="#8884d8"
                                        label={({ name, value }) => `${name}: ₹${value.toFixed(2)}`}
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
