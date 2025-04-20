import { GetUserAccounts } from "@/actions/account";
import { defaultCategories } from "@/lib/categories";
import { GetTransaction } from "@/actions/transaction";
import { AddTransactionForm } from "../_components/transaction-form";


const CreateTransactionPage = async ({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) => {

    const accounts = await GetUserAccounts();

    const editId = (await searchParams)?.edit;

    let initialData = null;
    if(editId) {
        const res = await GetTransaction(editId as string);
        if(res.success){
            initialData = res.data;
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-5">
            <h1 className="text-5xl gradient-title mb-8">{!!editId ? "Update" : "Add New"} Transaction</h1>
            <AddTransactionForm
                accounts={accounts.data}
                categories={defaultCategories}
                editMode={!!editId}
                initialData={initialData}
            />
        </div>
    )
}

export default CreateTransactionPage;
