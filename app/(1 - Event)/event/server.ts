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
            sold_data:event_products_sold_quantity (sold_quantity, reserved_quantity)
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
        const reservedQuantity = product.sold_data?.[0]?.reserved_quantity ?? 0;
        const quantityRemaining =
            product.quantity - (soldQuantity + reservedQuantity);

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
    ticket_ids: string[];
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

    const stock = await CheckAvailableStock(
        eventId,
        eventProductId,
        requestedQuantity
    );

    if (!stock || !stock.allowed) {
        throw new Error("Product is no longer available");
    }

    const reservedTickets = await CreateTickets(
        eventId,
        eventProductId,
        requestedQuantity
    );

    const ticketIds = reservedTickets.map((t) => t.id);

    const newItem: CartItem = {
        event_id: eventId,
        event_product_id: eventProductId,
        product_id: productId,
        quantity: requestedQuantity,
        ticket_ids: ticketIds,
    };

    const newCart = [newItem]; // TODO: This is where to replace code if we want to allow a real 'cart' functionality

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

    const { data: eventProduct, error } = await supabase
        .from("event_products")
        .select(
            `
            quantity,
            sold_data: event_products_sold_quantity (
                sold_quantity,
                reserved_quantity
            )
        `
        )
        .eq("id", eventProductId)
        .single();

    if (error || !eventProduct) {
        console.error("Error fetching stock:", error);
        return false;
    }

    const totalCapacity = eventProduct.quantity;

    const soldCount = eventProduct.sold_data?.sold_quantity ?? 0;
    const reservedCount = eventProduct.sold_data?.reserved_quantity ?? 0;

    // Remaining = Total - (Sold + Reserved)
    const quantityRemaining = totalCapacity - (soldCount + reservedCount);

    if (requestedQuantity > quantityRemaining) {
        console.log(
            `Stock check failed: Requested ${requestedQuantity}, Remaining ${quantityRemaining}`
        );

        // Instead of redirecting immediately, return false so the
        // UI can handle the toast message.
        return {
            allowed: false,
            remaining: quantityRemaining,
        };
    }

    return { allowed: true };
}

async function CreateTickets(
    eventId: number,
    eventProductId: number,
    requestedQuantity: number
) {
    const supabase = await createClient();

    // 1. Create an array of objects based on the quantity
    const ticketsToInsert = Array.from({ length: requestedQuantity }).map(
        () => ({
            event_product_id: eventProductId,
            status: "reserved",
            // reservation_expires_at: new Date(Date.now() + 15 * 60000).toISOString()
        })
    );

    // 2. Perform the bulk insert
    const { data, error } = await supabase
        .from("tickets")
        .insert(ticketsToInsert)
        .select();

    if (error) {
        console.error("Error creating tickets:", error.message);
        throw new Error("Could not reserve tickets.");
    }

    return data;
}

async function CreateTransactionAndTickets(tickets: CartItem) {
    // const supabase = await createClient();
    // // Get product info
    // const { data: productData, error: productError } = await supabase
    //     .from("products")
    //     .select()
    //     .eq("id", tickets.product_id)
    //     .maybeSingle();
    // if (!productData || productError) {
    //     // Throw error
    //     console.log(
    //         "Error retrieving product information to create transaction."
    //     );
    // }
    // const total = (productData.price + productData.service_fee) * tickets.quantity;
    // // Create transaction as pending
    // const { error: transactionError } = await supabase.from("transactions").insert({
    //     total: total
    // })
    // // Create line items
    // // Create tickets
    // // const {error} = await supabase.from("tickets").insert([
    // //     {}
    // // ]);
}
