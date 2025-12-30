import { stripe } from "@/lib/stripe/stripe";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, {
            status: 400,
        });
    }

    const supabase = await createClient();

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await supabase
            .from("transactions")
            .update({ status: "completed" })
            .eq("checkout_session_id", paymentIntent.id);

        // Add any additional logic here (e.g., sending confirmation emails)
    }

    return new NextResponse(null, { status: 200 });
}
