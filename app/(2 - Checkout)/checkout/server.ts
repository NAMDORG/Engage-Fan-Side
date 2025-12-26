"use server";

import { CartItem } from "@/app/(1 - Event)/event/server";
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
    // console.log(session);

    return { url: session.url };
}

export async function UpdateDatabase(
    formValues: {
        name: string;
        email_address: string;
        phone_number: string;
        shipping_address: string;
        shipping_city: string;
        billing_address?: string | undefined;
        billing_city?: string | undefined;
    },
    total: number,
    cart: CartItem
) {
    const supabase = await createClient();

    // Check/create profile
    let profileId: string = "";
    const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select()
        .eq("email", formValues.email_address)
        .maybeSingle();
    if (profileError) throw profileError;
    if (!profileData) {
        // Create new profile
        const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
                email: formValues.email_address,
                display_name: formValues.name,
                phone_number: formValues.phone_number,
                is_admin: false,
                // TODO: Address info?
            })
            .select("id")
            .single();

        if (createError) throw createError;
        profileId = newProfile.id;
    } else {
        profileId = profileData.id;
    }

    const transactionData: any = {
        profile_id: profileId,
        total: total,
        status: "pending",
        shipping_street: formValues.shipping_address,
        shipping_city: formValues.shipping_city,
    };

    if (formValues.billing_address) {
        transactionData.billing_street = formValues.billing_address;
    }
    if (formValues.billing_city) {
        transactionData.billing_city = formValues.billing_city;
    }

    console.log(transactionData);

    // Create transaction
    const { data: newTransaction, error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select("id")
        .single();

    console.log("Transaction ID: ", newTransaction?.id);

    // Create line_items
    const { data: newLineItem, error: lineItemError } = await supabase
        .from("line_items")
        .insert({
            // TODO: Turn into array if allowing a 'cart'
            transaction_id: newTransaction?.id,
            event_product_id: cart.event_product_id,
            quantity: cart.quantity,
            // TODO: price at purchase
        });

    // Update tickets with line_item_id and profile_id
}
