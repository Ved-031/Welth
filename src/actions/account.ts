"use server";
import * as z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { accountSchema } from "@/lib/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeTransaction = (obj: any) => {
    const serialized = { ...obj };
    if(obj.balance) {
        serialized.balance = obj.balance.toNumber();
    }
    if(obj.amount){
        serialized.amount = obj.amount.toNumber();
    }
    return serialized;
}

export const CreateAccount = async (data: z.infer<typeof accountSchema>) => {
    try {
        const { userId } = await auth();
        if(!userId) throw new Error("User not authenticated");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user) throw new Error("User not found");

        const balanceFloat = parseFloat(data.balance);
        if(isNaN(balanceFloat)) throw new Error("Invalid balance amount");

        const existingAccounts = await db.account.findMany({
            where: {
                userId: user.id,
            },
        });

        const isDefaultAccount = existingAccounts.length === 0 ? true : data.isDefault;
        if(isDefaultAccount){
            await db.account.updateMany({
                where: {
                    userId: user.id,
                    isDefault: true,
                },
                data: {
                    isDefault: false,
                },
            })
        }

        const account = await db.account.create({
            data: {
                ...data,
                balance: balanceFloat,
                userId: user.id,
                isDefault: isDefaultAccount,
            }
        })

        revalidatePath("/dashboard");

        return { success: true, data: serializeTransaction(account) };
    } catch (error) {
        throw new Error(`Error creating account: ${error}`);
    }
}

export const GetUserAccounts = async () => {
    try {
        const { userId } = await auth();
        if(!userId) throw new Error("User not authenticated");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user) throw new Error("User not found");

        const accounts = await db.account.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                _count: {
                    select: {
                        transactions: true,
                    },
                },
            },
        });

        const serializedAccount = accounts.map((account) => serializeTransaction(account));

        return { success: true, data: serializedAccount };
    } catch (error) {
        throw new Error(`Error getting user accounts: ${error}`);
    }
}

export const UpdateDefaultAccount = async (accountId: string) => {
    try {
        const { userId } = await auth();
        if(!userId) throw new Error("User not authenticated");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user) throw new Error("User not found");

        await db.account.updateMany({
            where: {
                userId: user.id,
                isDefault: true,
            },
            data: {
                isDefault: false,
            },
        });

        const updatedAccount = await db.account.update({
            where: {
                id: accountId,
                userId: user.id,
            },
            data: {
                isDefault: true,
            },
        });

        revalidatePath('/dashboard');

        return { success: true, data: serializeTransaction(updatedAccount) };
    } catch (error) {
        throw new Error(`Error updating default account: ${error}`);
    }
}

export const GetAccountWithTransactions = async (accountId: string) => {
    try {
        const { userId } = await auth();
        if(!userId) throw new Error("User not authenticated");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user) throw new Error("User not found");

        const account = await db.account.findUnique({
            where: {
                id: accountId,
                userId: user.id,
            },
            include: {
                transactions: {
                    orderBy: { date: "desc" }
                },
                _count: {
                    select: { transactions: true }
                },
            },
        });
        if(!account) {
            throw new Error("Account not found");
        }

        return { success: true, data: {
            ...serializeTransaction(account),
            transactions: account.transactions.map(serializeTransaction)
        } };
    } catch (error) {
        throw new Error(`Error getting account with transactions: ${error}`);
    }
}
