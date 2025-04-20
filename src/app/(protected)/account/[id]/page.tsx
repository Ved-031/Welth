import { Suspense } from "react";
import { notFound } from "next/navigation";

import { GetAccountWithTransactions } from "@/actions/account";

import { Skeleton } from "@/components/ui/skeleton";
import { AccountChart } from "../_components/account-chart";
import { TransactionTable } from "../_components/transaction-table";

interface AccountIdPageProps {
    params: Promise<{ id: string }>
}

const AccountIdPage = async ({ params }: AccountIdPageProps) => {
    const { id } = await params;

    const accountData = await GetAccountWithTransactions(id);
    if (!accountData) notFound();

    const { transactions, ...account } = accountData.data;

    return (
        <div className="space-y-8 px-5">
            {/* Header */}
            <div className="flex gap-4 items-end justify-between">
                <div>
                    <h1 className="text-5xl sm:text-6xl font-bold gradient-title capitalize">{account.name}</h1>
                    <p className="text-muted-foreground">{account.type === "CURRENT" ? "Current Account" : "Savings Account"}</p>
                </div>
                <div className="text-right pb-2">
                    <div className="text-xl sm:text-2xl font-bold">₹{parseFloat(account.balance.toString()).toFixed(2)}</div>
                    <p className="text-muted-foreground text-sm">{account._count.transactions} Transactions</p>
                </div>
            </div>

            {/* Chart section */}
            <div>
                <Suspense fallback={<Skeleton className="h-72 w-full conatiner mx-auto max-w-[1450px]" />}>
                    <AccountChart transactions={transactions} />
                </Suspense>
            </div>

            {/* Transactions table */}
            <Suspense fallback={<Skeleton className="h-72 w-full conatiner mx-auto max-w-[1450px]" />}>
                <TransactionTable transactions={transactions} />
            </Suspense>
        </div>
    )
}

export default AccountIdPage;
