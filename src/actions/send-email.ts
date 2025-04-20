import { Resend } from "resend";

interface SendEmailProps {
    to: string;
    subject: string;
    react: React.ReactElement;
}

export const SendEmail = async ({ to, subject, react }: SendEmailProps) => {
    const resend = new Resend(process.env.RESEND_API_KEY || "");

    try {
        const data = await resend.emails.send({
            from: "Welth - Finance App <onboarding@resend.dev>",
            to,
            subject,
            react,
        });

        return { success: true, data };
    } catch (error) {
        if(error instanceof Error){
            return { success: false, error: error.message };
        }
    }
}
