import { Suspense } from "react";
import { PlusIcon } from "lucide-react";

import { GetUserAccounts } from "@/actions/account";
import { GetCurrentBudget } from "@/actions/budget";
import { GetDashboardData } from "@/actions/dashboard";

import { Skeleton } from "@/components/ui/skeleton";
import { AccountCard } from "./_components/account-card";
import { Card, CardContent } from "@/components/ui/card";
import { BudgetProgress } from "./_components/budget-progress";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { DashboardOverview } from "./_components/dashboard-overview";

const DashboardPage = async () => {

    const accounts = await GetUserAccounts();
    const defaultAccount = accounts.data.find((account) => account.isDefault);

    let budgetData = null;
    if (defaultAccount) {
        budgetData = await GetCurrentBudget(defaultAccount.id);
    }

    const transactions = await GetDashboardData();

    return (
        <div className="space-y-8">
            {/* Budget Progress */}
            <div>
                <Suspense fallback={<Skeleton className="h-72 w-full conatiner mx-auto max-w-[1450px]" />}>
                    {defaultAccount && <BudgetProgress
                        initialBudget={budgetData?.budget}
                        currentExpenses={budgetData?.currentExpenses || 0}
                    />}
                </Suspense>
            </div>

            {/* Overview */}
            <div>
                <Suspense fallback={<Skeleton className="h-72 w-full conatiner mx-auto max-w-[1450px]" />}>
                    <DashboardOverview
                        accounts={accounts.data}
                        transactions={transactions.data || []}
                    />
                </Suspense>
            </div>

            {/* Accounts grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <CreateAccountDrawer>
                    <Card className="shadow-none transition-shadow cursor-pointer border-2 bg-gray-50/50 hover:bg-gray-50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center h-full">
                            <PlusIcon className="size-10 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">Add New Account</p>
                        </CardContent>
                    </Card>
                </CreateAccountDrawer>
                <Suspense fallback={<AccountCardSkeleton />}>
                    {
                        accounts.data.length > 0 && accounts.data.map((account, index) => (
                            <AccountCard key={index} account={account} />
                        ))
                    }
                </Suspense>
            </div>
        </div>
    )
}

function AccountCardSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-72 w-full conatiner mx-auto" />
            <Skeleton className="h-72 w-full conatiner mx-auto" />
        </div>
    )
}

export default DashboardPage;
