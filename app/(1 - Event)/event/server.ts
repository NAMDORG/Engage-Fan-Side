"use server";

import { createClient } from "@/lib/supabase/server";
import { Event, Product, Venue } from "@/lib/types/supabase";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GetEvent(
    id: number
): Promise<{ event: Event | null; venue: Venue | null }> {
    const supabase = await createClient();

    const { data: event, error: eventError } = await supabase
        .from("events")
        .select()
        .eq("id", id)
        .maybeSingle();

    if (!event || eventError) {
        console.log(`Error retrieving event info: ${eventError?.message}`);
        return { event: null, venue: null };
    }

    const { data: venue, error: venueError } = await supabase
        .from("venues")
        .select()
        .eq("id", event.venue)
        .maybeSingle();

    if (!venue || venueError) {
        console.log(`Error retrieving venue info: ${venueError?.message}`);
        return { event, venue: null };
    }

    return { event, venue };
}

export async function GetProducts(event: number) {
    const supabase = await createClient();
    const { data: products, error: productsError } = await supabase
        .from("event_products")
        .select(
            `
            id,
            quantity,
            product:products!product_id (
                id, name, details, image_primary, price, service_fee
            ),
            sold_data:event_products_sold_quantity (sold_quantity)
        `
        )
        .eq("event_id", event)
        .order("product(name)");

    if (!products || productsError) {
        console.log(`Error retrieving products: ${productsError.message}`);
        return { products: null };
    }

    const productsWithRemaining = products.map((product) => {
        const soldQuantity = product.sold_data?.[0]?.sold_quantity ?? 0;
        const quantityRemaining = product.quantity - soldQuantity;
        const { sold_data, ...rest } = product;

        return { ...rest, quantity_remaining: quantityRemaining };
    });

    return { products: productsWithRemaining };
}

export type CartItem = {
    event_id: number;
    event_product_id: number;
    product_id: number;
    quantity: number;
};

export async function addItemToCart(formData: FormData) {
    const eventId = Number(formData.get("eventId"));
    const eventProductId = Number(formData.get("eventProductId"));
    const productId = Number(formData.get("productId"));
    const requestedQuantity = Number(formData.get("quantity"));

    // TODO: Better error handling for invalid product/quantity
    if (
        isNaN(eventId) ||
        isNaN(eventProductId) ||
        isNaN(productId) ||
        isNaN(requestedQuantity) ||
        requestedQuantity < 1
    ) {
        throw new Error("Invalid cart item data.");
    }

    CheckAvailableStock(eventId, eventProductId, requestedQuantity);

    const newItem: CartItem = {
        event_id: eventId,
        event_product_id: eventProductId,
        product_id: productId,
        quantity: requestedQuantity,
    };

    const newCart = [newItem];

    const cookieStore = cookies();
    (await cookieStore).set("cart", JSON.stringify(newCart), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        sameSite: "lax",
    });

    redirect("/checkout");
}

async function CheckAvailableStock(
    eventId: number,
    eventProductId: number,
    requestedQuantity: number
) {
    const supabase = await createClient();
    const { data: eventProductData, error: eventProductError } = await supabase
        .from("event_products")
        .select(
            `quantity,
            sold_data: event_products_sold_quantity (sold_quantity)`
        )
        .eq("id", eventProductId)
        .single();

    const totalStock = eventProductData?.quantity;
    const itemsSold = eventProductData?.sold_data?.[0]?.sold_quantity ?? 0;
    const quantityRemaining = totalStock - itemsSold;

    if (requestedQuantity > quantityRemaining) {
        console.log(
            `Stock check failed: Requested ${requestedQuantity}, Remainig ${quantityRemaining}`
        );
        // TODO: Show toast explaining error
        // TODO: Block checkout redirect instead of 'reloading' the page
        redirect(`/event?id=${eventId}`);
    }
}
