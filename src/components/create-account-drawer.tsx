"use client";

import * as z from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { AccountType } from "@prisma/client";
import { accountSchema } from "@/lib/schema";
import { CreateAccount } from "@/actions/account";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



export const CreateAccountDrawer = ({ children }: Readonly<{ children: React.ReactNode }>) => {

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof accountSchema>>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: "",
            type: AccountType.CURRENT,
            balance: "",
            isDefault: false,
        }
    });

    const onSubmit = async (data: z.infer<typeof accountSchema>) => {
        try {
            setLoading(true);
            const res = await CreateAccount(data);
            toast.success("Account created");
            console.log(res);
        } catch (error) {
            console.log(error);
            toast.error("Failed to create account!");
        } finally {
            form.reset();
            setOpen(false);
            setLoading(false);
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{children}</DrawerTrigger>
            <DrawerContent className="">
                <DrawerHeader>
                    <DrawerTitle>Create New Account</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
                            <FormField
                                name="name"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="text"
                                                placeholder="e.g. Main Checking"
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="type"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger disabled={loading} className="w-full">
                                                    <SelectValue placeholder="Select Account Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={AccountType.CURRENT}>Current</SelectItem>
                                                <SelectItem value={AccountType.SAVINGS}>Savings</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="balance"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Balance</FormLabel>
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
                                name="isDefault"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between w-full border rounded-lg p-3">
                                        <div>
                                            <FormLabel>Set as Default</FormLabel>
                                            <p className="text-xs text-muted-foreground mt-1">This account will be selected by default for transactions.</p>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                disabled={loading}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-4 pt-4">
                                <DrawerClose asChild>
                                    <Button
                                        type="button"
                                        disabled={loading}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </DrawerClose>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin" />
                                            <p>Creating...</p>
                                        </div>
                                    ) : "Create Account"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
