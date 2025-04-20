import { seedTransactions } from "@/actions/seed";

export const GET = async () => {
    const res = await seedTransactions();
    return Response.json(res);
}
