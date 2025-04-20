"use client";

import { useMemo, useState } from "react";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";
import { Transaction } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AccountChartProps {
    transactions: Transaction[];
}

const DATE_RANGES = {
    "7D": { label: "Last 7 Days", days: 7 },
    "1M": { label: "Last 1 Month", days: 30 },
    "3M": { label: "Last 3 Months", days: 90 },
    "6M": { label: "Last 6 Months", days: 180 },
    "ALL": { label: "All Time", days: null },
};

export const AccountChart = ({ transactions }: AccountChartProps) => {

    const [dateRange, setDateRange] = useState<keyof typeof DATE_RANGES>("1M");

    const filteredData = useMemo(() => {
        const range = DATE_RANGES[dateRange];
        const now = new Date();
        const startDate = range.days ? startOfDay(subDays(now, range.days)) : startOfDay(new Date(0));
        const filtered = transactions.filter((t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now));
        const grouped = filtered.reduce((acc: Record<string, { date: string; income: number; expense: number }>, transaction) => {
            const date = format(new Date(transaction.date), "MMM dd");

            if (!acc[date]) {
                acc[date] = { date, income: 0, expense: 0 };
            }

            if (transaction.type === "INCOME") {
                acc[date].income += parseFloat(transaction.amount.toString());
            } else {
                acc[date].expense += parseFloat(transaction.amount.toString());
            }

            return acc;
        }, {});

        return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [dateRange, transactions]);

    const totals = useMemo(() => {
        return filteredData.reduce((acc, day) => ({
            income: acc.income + day.income,
            expense: acc.expense + day.expense,
        }), { income: 0, expense: 0 });
    }, [filteredData]);

    function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
        if(active) {
            return (
                <div className="bg-white py-2 px-3 rounded shadow-lg w-auto">
                    <p className="font-medium mb-1">{label}</p>
                    <p className="text-green-500">{`₹ ${payload![0].value}`}</p>
                    <p className="text-red-500">{`₹ ${payload![1].value}`}</p>
                </div>
            )
        }
        return;
    }

    return (
        <Card className="container mx-auto w-full max-w-[1450px] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <CardTitle className="text-base font-normal">Transaction Overview</CardTitle>
                <Select defaultValue={dateRange} onValueChange={(value) => setDateRange(value as keyof typeof DATE_RANGES)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(DATE_RANGES).map(([key, { label }]) => {
                            return (
                                <SelectItem value={key} key={key}>
                                    {label}
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-around mb-6 text-sm">
                    <div className="text-center">
                        <p className="text-muted-foreground">Total Income</p>
                        <p className="text-lg font-bold text-green-500">₹{totals.income.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">Total Expenses</p>
                        <p className="text-lg font-bold text-red-500">₹{totals.expense.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">Net</p>
                        <p className={cn(
                            "text-lg font-bold",
                            totals.income - totals.expense > 0 ? "text-green-500" : "text-red-500"
                        )}>₹{(totals.income - totals.expense).toFixed(2)}</p>
                    </div>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 10,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar
                                dataKey="income"
                                name="Income"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="expense"
                                name="Expense"
                                fill="#ef4444"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
