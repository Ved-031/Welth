"use client";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { Account } from "@prisma/client";
import { UpdateDefaultAccount } from "@/actions/account";

import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountCardProps {
    account: Account;
}

export const AccountCard = ({ account }: AccountCardProps) => {

    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { name, type, balance, id, isDefault } = account;

    const handleDefaultChange = async () => {
        try {
            setLoading(true);
            if (isDefault) {
                toast.error("You need atleast one default account");
                return;
            }
            await UpdateDefaultAccount(id);
            toast.success("Default account updated");
        } catch (error) {
            console.log(error);
            toast.error("Error updating default account");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card
            onClick={() => router.push(`/account/${id}`)}
            className="shadow-none hover:shadow-sm transition-shadow group relative cursor-pointer"
        >
            <CardHeader className="flex items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium capitalize">{name}</CardTitle>
                <Switch
                    checked={isDefault}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDefaultChange();
                    }}
                    disabled={loading}
                />
            </CardHeader>
            <CardContent className="">
                <div className="text-2xl font-bold">
                    ₹{parseFloat(balance.toString()).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                    {type === "CURRENT" ? "Current Account" : "Savings Account"}
                </p>
            </CardContent>
            <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                    <ArrowUpRightIcon className="mr-1 size-4 text-green-500" />
                    Income
                </div>
                <div className="flex items-center">
                    <ArrowDownRightIcon className="mr-1 size-4 text-red-500" />
                    Expense
                </div>
            </CardFooter>
        </Card>
    )
}
