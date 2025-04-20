import * as z from 'zod';
import { AccountType } from '@prisma/client';

export const accountSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }).trim(),
    type: z.enum([AccountType.CURRENT, AccountType.SAVINGS]),
    balance: z.string().min(1, { message: "Initial balance is required" }).trim(),
    isDefault: z.boolean().default(false),
});

export const transactionSchema = z.object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.string().min(1, "Amount is required!"),
    description: z.string().optional(),
    date: z.date({ required_error: "Date is required!" }),
    accountId: z.string().min(1, "Account is required!"),
    category: z.string().min(1, "Category is required!"),
    isRecurring: z.boolean().default(false),
    recurringInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
}).superRefine((data, ctx) => {
    if(data.isRecurring && !data.recurringInterval) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Recurring interval is required for recurring transactions!",
            path: ["recurringInterval"],
        })
    }
});
