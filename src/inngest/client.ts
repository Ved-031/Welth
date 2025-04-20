import { Inngest } from "inngest";

interface RetryFunctionResult {
    delay: number;
    maxAttempts: number;
}

export const inngest = new Inngest({
    id: "welth",
    name: "Welth",
    retryFunction: async (attempt: number): Promise<RetryFunctionResult> => ({
        delay: Math.pow(2, attempt) * 1000,
        maxAttempts: 2,
    })
});
