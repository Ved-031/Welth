"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const GetCurrentBudget = async (accountId: string) => {
    try {
        const { userId } = await auth();
        if(!userId) throw new Error("User not authenticated");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user) throw new Error("User not found");

        const budget = await db.budget.findFirst({
            where: {
                userId: user.id,
            },
        });

        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const expenses = await db.transaction.aggregate({
            where: {
                userId: user.id,
                type: "EXPENSE",
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
                accountId: accountId,
            },
            _sum: {
                amount: true,
            },
        });

        return {
            budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
            currentExpenses: expenses._sum.amount ? expenses._sum.amount.toNumber() : 0,
        }
    } catch (error) {
        console.log(error);
        throw new Error("Failed to get current budget");
    }
}

export const UpdateBudget = async (amount: number) => {
    try {
        const { userId } = await auth();
        if(!userId) throw new Error("User not authenticated");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user) throw new Error("User not found");

        const budget = await db.budget.upsert({
            where: {
                userId: user.id,
            },
            update: {
                amount: amount.toString(),
            },
            create: {
                userId: user.id,
                amount: amount.toString(),
            },
        });

        revalidatePath("/dashboard");

        return {
            success: true,
            data: { ...budget, amount: budget.amount.toNumber() },
        }
    } catch (error) {
        if(error instanceof Error){
            return {
                success: false,
                error: error.message,
            }
        }
    }
}
