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

// export async function CreateCheckoutSession(
//     calculateOrderAmount: number,
//     product: Product,
//     quantity: number,
//     origin: string
// ) {
//     const session = await stripe.checkout.sessions.create({
//         line_items: [
//             {
//                 price_data: {
//                     currency: "usd",
//                     unit_amount: (product.price + product.service_fee) * 100,
//                     product_data: {
//                         name: product.name,
//                         metadata: {
//                             id: product.id,
//                             artist: product.artist,
//                         },
//                     },
//                 },
//                 quantity: quantity,
//             },
//         ],
//         metadata: {
//             // TODO: Add purchase metadata
//         },
//         mode: "payment",
//         success_url: `${origin}/success`,
//     });

//     return { url: session.url, session_id: session.id };
// }

function buildPaymentMetadata(
    formValues: {
        name: string;
        email_address: string;
        phone_number: string;
        shipping_address: string;
        shipping_city: string;
        billing_address?: string | undefined;
        billing_city?: string | undefined;
        item_sizes?: string[];
    },
    product: Product,
    cart: CartItem
) {
    const metadata: Record<string, string> = {
        name: formValues.name,
        email_address: formValues.email_address,
        phone_number: formValues.phone_number,
        shipping_address: formValues.shipping_address,
        shipping_city: formValues.shipping_city,
        product_id: String(product.id),
        product_name: product.name ?? "",
        event_product_id: String(cart.event_product_id),
        quantity: String(cart.quantity),
        ticket_ids: cart.ticket_ids.join(","),
    };

    if (formValues.billing_address) {
        metadata.billing_address = formValues.billing_address;
    }
    if (formValues.billing_city) {
        metadata.billing_city = formValues.billing_city;
    }
    if (formValues.item_sizes?.length) {
        metadata.item_sizes = formValues.item_sizes.join(",");
    }

    return metadata;
}

export async function CreatePaymentIntent(
    amount: number,
    product: Product,
    formValues: {
        name: string;
        email_address: string;
        phone_number: string;
        shipping_address: string;
        shipping_city: string;
        billing_address?: string | undefined;
        billing_city?: string | undefined;
        item_sizes?: string[];
    },
    cart: CartItem
) {
    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: buildPaymentMetadata(formValues, product, cart),
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
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
        item_sizes?: string[];
    },
    total: number,
    cart: CartItem,
    pi_id: string
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

    const transactionData: {
        profile_id: string;
        total: number;
        status: string;
        shipping_street: string;
        shipping_city: string;
        billing_street?: string;
        billing_city?: string;
        payment_intent_id?: string;
    } = {
        profile_id: profileId,
        total: total / 100,
        status: "pending",
        shipping_street: formValues.shipping_address,
        shipping_city: formValues.shipping_city,
        payment_intent_id: pi_id,
    };

    if (formValues.billing_address) {
        transactionData.billing_street = formValues.billing_address;
    }
    if (formValues.billing_city) {
        transactionData.billing_city = formValues.billing_city;
    }

    // Create transaction
    const { data: newTransaction, error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select("id")
        .single();

    // Create line_items
    const { data: newLineItem, error: lineItemError } = await supabase
        .from("line_items")
        .insert({
            // TODO: Turn into array if allowing a 'cart'
            transaction_id: newTransaction?.id,
            event_product_id: cart.event_product_id,
            quantity: cart.quantity,
            // TODO: price at purchase
        })
        .select("id")
        .single();

    // Update tickets with line_item and profile info
    // const ticketUpdateInfo = {
    //     line_item_id: newLineItem?.id,
    //     profile_id: profileId,
    // };

    // const { data: updatedTickets, error: ticketUpdateError } = await supabase
    //     .from("tickets")
    //     .update(ticketUpdateInfo)
    //     .in("id", cart.ticket_ids);
    const updatePromises = cart.ticket_ids.map((ticketId, index) => {
        return supabase
            .from("tickets")
            .update({
                line_item_id: newLineItem?.id,
                profile_id: profileId,
                item_size: formValues.item_sizes?.[index] || null, // Access size by index
            })
            .eq("id", ticketId);
    });

    const results = await Promise.all(updatePromises);

    // Check for errors in any of the updates
    const firstError = results.find((r) => r.error);
    if (firstError) throw firstError.error;
}
