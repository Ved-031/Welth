"use client";

import * as z from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Account, Transaction } from "@prisma/client";
import { categoryType } from "@/lib/categories";
import { transactionSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTransaction, UpdateTransaction } from "@/actions/transaction";
import { ReceiptScanner } from "./receipt-scanner";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface AddTransactionFormProps {
    accounts: Account[];
    categories: categoryType[];
    editMode: boolean,
    initialData?: Transaction
}

export const AddTransactionForm = ({ accounts, categories, editMode, initialData }: AddTransactionFormProps) => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams?.get("edit");
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof transactionSchema>>({
        resolver: zodResolver(transactionSchema),
        defaultValues: editMode && initialData ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description!,
            date: new Date(initialData.date),
            accountId: initialData.accountId,
            isRecurring: initialData.isRecurring,
            category: initialData.category,
            ...(initialData.recurringInterval && {
                recurringInterval: initialData.recurringInterval,
            }),
        } : {
            type: "EXPENSE",
            amount: "",
            description: "",
            date: new Date(),
            accountId: accounts.find(ac => ac.isDefault)?.id,
            isRecurring: false,
        }
    });

    const onSubmit = async (data: z.infer<typeof transactionSchema>) => {
        try {
            setLoading(true);
            const res = editMode ? await UpdateTransaction(editId!, data) : await CreateTransaction(data);
            if(res?.success){
                toast.success(`${editMode ? "Transaction updated" : "Transaction created"}`);
                router.push(`/account/${res.data.accountId}`);
            }
        } catch (error) {
            toast.error(`${editMode ? "Error updating transaction" : "Error creating transaction"}`);
            console.log(error);
        } finally {
            setLoading(false);
            form.reset();
        }
    }

    const handleScanComplete = async (scannedData: {
        amount: number;
        date: Date;
        description: string;
        merchantName: string;
        category: string;
    }) => {
        if(scannedData){
            form.setValue("amount", scannedData.amount.toString());
            form.setValue("date", new Date(scannedData.date));
            if(scannedData.description) {
                form.setValue("description", scannedData.description);
            }
            if(scannedData.category) {
                form.setValue("category", scannedData.category);
            }
        }
    }

    const type = form.watch("type");
    const isRecurring = form.watch("isRecurring");
    const filteredCategories = categories.filter(cat => cat.type === type);

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}
                    <FormField
                        name="type"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select defaultValue={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger disabled={loading} className="w-full">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="INCOME">Income</SelectItem>
                                        <SelectItem value="EXPENSE">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid gap-6 md:grid-cols-2 w-full ">
                        <FormField
                            name="amount"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="accountId"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account</FormLabel>
                                    <Select defaultValue={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger disabled={loading} className="w-full">
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.name} ( ₹{parseFloat(account.balance.toString()).toFixed(2)} )
                                                </SelectItem>
                                            ))}
                                            <CreateAccountDrawer>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    disabled={loading}
                                                    className="w-full select-none items-center text-sm outline-none"
                                                >
                                                    Create Account
                                                </Button>
                                            </CreateAccountDrawer>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        name="category"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select defaultValue={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger disabled={loading} className="w-full">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredCategories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="date"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                disabled={loading}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto size-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="description"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Enter description"
                                        disabled={loading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="isRecurring"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between w-full border rounded-lg p-3">
                                <div>
                                    <FormLabel>Recurring Transaction</FormLabel>
                                    <p className="text-xs text-muted-foreground mt-1">Set up a recurring schedule for this transaction.</p>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={loading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {isRecurring && (
                        <FormField
                            name="recurringInterval"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recurring Interval</FormLabel>
                                    <Select defaultValue={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger disabled={loading} className="w-full">
                                                <SelectValue placeholder="Select interval" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="DAILY">Daily</SelectItem>
                                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                                            <SelectItem value="YEARLY">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <div className="flex flex-col gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2Icon className="size-4 animate-spin" />
                                    <span>{editMode ? "Updating" : "Creating"} Transaction...</span>
                                </>
                            ) : (
                                <>
                                    {editMode ? "Update Transaction" : "Create Transaction"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
