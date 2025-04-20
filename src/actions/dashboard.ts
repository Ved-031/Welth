"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeAmount = (obj: any) => ({
    ...obj,
    amount: obj.amount.toNumber(),
})

export const GetDashboardData = async () => {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("User not authenticated");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user) throw new Error("User not found");

        const transactions = await db.transaction.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                date: "desc",
            },
        });

        return { success: true, data: transactions.map(t => serializeAmount(t)) };
    } catch (error) {
        console.log(error);
        return { success: true, data: [] };
    }
}
