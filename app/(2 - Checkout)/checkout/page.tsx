import { GetArtist } from "@/app/(0 - Campaign)/server";
import { CartItem } from "@/app/(1 - Event)/event/server";
import Header from "@/components/header";
import { Artist, Campaign, Product } from "@/lib/types/supabase";
import { cookies, headers } from "next/headers";
import { GetProductFromCookie } from "./server";
import { CheckoutForm } from "./client";
import { Separator } from "@/components/ui/separator";
import SetTheme from "@/lib/set-theme";

export default async function CheckoutPage() {
    const headersList = await headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host");
    const url = host == "localhost:3001" ? "vip.chaosandcarnage.com" : host;
    if (url == null) return null;
    const { artist, campaign } = await GetArtist(url);
    const cookie = await getCartFromCookie();

    // TODO: If any info is not properly retreived on page load, send user elsewhere
    if (!artist || !campaign || !cookie || cookie.length == 0) return null;
    const themeCSS = await SetTheme(campaign);

    const cart = cookie[0];
    const { product } = await GetProductFromCookie(cart.product_id);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
            <Header />
            <PageLayout
                artist={artist}
                campaign={campaign}
                product={product}
                cart={cart}
            />
        </>
    );
}

// TODO: Gift purchase

async function PageLayout({
    artist,
    campaign,
    product,
    cart,
}: {
    artist: Artist;
    campaign: Campaign;
    product: Product;
    cart: CartItem;
}) {
    return (
        <div className={`w-full relative px-4`}>
            <Background background={campaign.background} />
            <div
                className={`absolute z-10 w-full min-h-screen p-8 flex flex-col justify-center items-center`}>
                <div
                    className={`max-w-screen-xl w-full p-4 md:p-8 bg-background border border-accent rounded-md`}>
                    <div className={`h-full flex justify-between`}>
                        <div className={``}>
                            <h1 className="text-accent font-heading text-3xl md:text-7xl font-bold uppercase">
                                Checkout
                            </h1>
                            <p className="font-thin uppercase">
                                **VIP Packages{" "}
                                <span className="font-bold">do not</span>{" "}
                                include an event ticket.**
                            </p>
                        </div>
                    </div>
                    <div className={`mt-4 flex flex-col md:flex-row`}>
                        <div className={`w-full`}>
                            <ProductColumn product={product} cart={cart} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// TODO: Refactor
function Background({ background }: { background: string | undefined }) {
    return (
        <div className={`absolute inset-0 z-0 min-h-screen h-dvh`}>
            <div
                style={{ backgroundImage: `url(${background})` }}
                className="absolute inset-0 bg-cover max-h-dvh max-w-[100vw] bg-[position:top] z-0"
            />
            <div className="absolute inset-0 bg-black/60 z-0" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 z-0 bg-gradient-to-t from-black" />
        </div>
    );
}

async function getCartFromCookie(): Promise<CartItem[]> {
    const cookieStore = cookies();
    const cartCookie = (await cookieStore).get("cart");

    if (!cartCookie) {
        return [];
    }

    try {
        return JSON.parse(cartCookie.value) as CartItem[];
    } catch (e) {
        console.error("Failed to parse cart cookie:", e);
        return [];
    }
}

// TODO: Catch missing information and redirect

function ProductColumn({
    product,
    cart,
}: {
    product: Product;
    cart: CartItem;
}) {
    return (
        <div className="w-full flex flex-col md:flex-row gap-2">
            <div className={`md:w-1/2`}>
                <div className={`w-full md:flex md:gap-2`}>
                    <div
                        className={`border border-accent w-full rounded-md p-4 md:p-6`}>
                        {product && (
                            <div className="">
                                <>
                                    <h2 className="text-2xl text-accent font-bold uppercase">
                                        VIP Package Includes
                                    </h2>
                                    <div
                                        className="list-disc px-5"
                                        dangerouslySetInnerHTML={{
                                            __html: product.details,
                                        }}
                                    />
                                </>
                                <div className={`my-4`}>
                                    <Separator className="bg-accent" />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <p>
                                        <span className="font-bold">
                                            VIP Package Price:
                                        </span>{" "}
                                        ${product.price}
                                    </p>
                                    <p>
                                        <span className="font-bold">
                                            Service Fee:
                                        </span>{" "}
                                        ${product.service_fee}
                                    </p>
                                    <p>
                                        <span className="font-bold">
                                            Quantity:
                                        </span>{" "}
                                        {cart.quantity}
                                    </p>
                                </div>
                                <div
                                    className={`w-full flex justify-between items-center mt-4`}>
                                    <div className="flex flex-col">
                                        <p className="text-2xl text-accent font-bold uppercase">
                                            Total cost
                                        </p>
                                        <p className="text-2xl">
                                            {`$${
                                                (product.price +
                                                    product.service_fee) *
                                                cart.quantity
                                            }`}
                                        </p>{" "}
                                        {/* TODO: Make sure product is defined */}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className={`md:w-1/2 flex flex-col gap-2`}>
                <div
                    className={`w-full border border-accent rounded-md p-4 md:p-6`}>
                    <CheckoutForm product={product} cart={cart} />
                </div>
            </div>
        </div>
    );
}
