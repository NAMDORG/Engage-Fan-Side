import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_SECRET_KEY!);

export default async function SuccessPage() {
    return null;
}

resend.emails.send({
    from: "onboarding@resend.dev",
    to: "jacob@jacobgrodman.com",
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
});
