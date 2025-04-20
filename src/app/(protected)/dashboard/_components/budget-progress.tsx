"use client";

import { toast } from "sonner";
import { useState } from "react";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { UpdateBudget } from "@/actions/budget";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

type Budget = {
    amount: number;
    id: string;
    lastAlertSent: Date | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
interface BudgetProgressProps {
    initialBudget: Budget | null | undefined;
    currentExpenses: number;
}

export const BudgetProgress = ({ initialBudget, currentExpenses }: BudgetProgressProps) => {

    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newBudget, setNewBudget] = useState(initialBudget?.amount?.toString() || "");

    const percentUsed = initialBudget ? (currentExpenses / initialBudget.amount) * 100 : 0;

    const handleUpdateBudget = async () => {
        try {
            setLoading(true);
            const amount = parseFloat(newBudget);
            if (isNaN(amount) || amount <= 0) {
                toast.error("Please enter a valid amount");
                return;
            }
            const res = await UpdateBudget(amount);
            if (res?.success) {
                toast.success("Budget updated");
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to update budget");
        } finally {
            setLoading(false);
            setIsEditing(false);
        }
    }
    const handleCancel = () => {
        setNewBudget(initialBudget?.amount?.toString() || "");
        setIsEditing(false);
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1">
                    <CardTitle className="">Monthly Budget (Default Account)</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        {isEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={newBudget}
                                    onChange={(e) => setNewBudget(e.target.value)}
                                    className="w-32"
                                    disabled={loading}
                                    autoFocus
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleUpdateBudget}
                                    disabled={loading}
                                >
                                    <CheckIcon className="size-4 text-green-500" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    <XIcon className="size-4 text-red-500" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <CardDescription>
                                    {initialBudget ? `₹${currentExpenses.toFixed(2)} of ₹${initialBudget.amount.toFixed(2)} spent` : "No budget set"}
                                </CardDescription>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsEditing(true)}
                                    className="size-6"
                                >
                                    <PencilIcon className="size-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {initialBudget && (
                    <div className="space-y-2">
                        <Progress
                            value={percentUsed}
                            className={cn(
                                percentUsed >= 90
                                    ? "[&>div]:bg-red-500"
                                    : percentUsed >= 75
                                        ? "[&>div]:bg-yellow-500"
                                        : "[&>div]:bg-green-500"
                            )}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {percentUsed.toFixed(1)}% used
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
