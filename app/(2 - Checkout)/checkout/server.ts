"use server";

import { stripe } from "@/lib/stripe/stripe";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types/supabase";
// import Stripe from "stripe";

export async function GetProductFromCookie(productId: number) {
    const supabase = await createClient();
    const { data: product, error } = await supabase
        .from("products")
        .select()
        .eq("id", productId)
        .maybeSingle();

    if (!product || error) {
        console.log(`Error retrieving event info: ${error?.message}`);
        return { product: null };
    }

    // TODO: Verify product info

    return { product };
}

// export async function LookForCheckoutSession(amount: number) {
//     const cookieStore = cookies();
//     const piCookie = (await cookieStore).get("paymentIntent");

//     if (piCookie) {
//         console.log("Stored payment intent:", piCookie);
//     } else {
//         console.log("Creating payment intent.");

//         const clientSecret = await CreateCheckoutSession(amount);
//         if (!clientSecret) {
//             console.error("Failed to create payment intent.");
//         } else {
//             (await cookieStore).set("paymentIntent", clientSecret, {
//                 path: "/",
//                 maxAge: 60 * 15, // 15 minutes
//                 httpOnly: true,
//                 sameSite: "lax",
//             });
//             console.log(clientSecret);
//         }
//     }
// }

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function CreateCheckoutSession(
    calculateOrderAmount: number,
    product: Product,
    quantity: number,
    origin: string
) {
    // const { client_secret: clientSecret } = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: "usd",
    //     automatic_payment_methods: { enabled: true },
    //     metadata: {},
    // });

    // return clientSecret;
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: (product.price + product.service_fee) * 100,
                    product_data: {
                        name: product.name,
                        metadata: {
                            id: product.id,
                            artist: product.artist,
                        },
                    },
                },
                quantity: quantity,
            },
        ],
        metadata: {
            // TODO: Add purchase metadata
        },
        mode: "payment",
        success_url: `${origin}/success`,
    });
    console.log(session);

    return { url: session.url };
}
