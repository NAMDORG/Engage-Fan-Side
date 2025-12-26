import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "./stripe";

export async function POST(request: Request) {
    const { amount } = await request.json();
    const cookieStore = await cookies();

    // 1. Check for existing PI
    const piCookie = cookieStore.get("paymentIntent");

    if (piCookie) {
        return NextResponse.json({ clientSecret: piCookie.value });
    }

    // 2. Create new PI and set cookie (allowed in Route Handler)
    try {
        const clientSecret = await CreateCheckoutSession(amount);

        if (!clientSecret) {
            return null;
        }

        // Setting the cookie here is fine
        cookieStore.set("paymentIntent", clientSecret, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: "lax",
        });

        return NextResponse.json({ clientSecret });
    } catch (error) {
        console.error("Failed to create checkout session:", error);
        return NextResponse.json(
            { error: "Failed to start checkout." },
            { status: 500 }
        );
    }
}

async function CreateCheckoutSession(amount: number) {
    const { client_secret: clientSecret } = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
    });

    return clientSecret;
}
