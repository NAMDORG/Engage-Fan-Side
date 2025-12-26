import { GetArtist } from "@/app/(0 - Campaign)/server";
import Header from "@/components/header";
import { Artist, Campaign, Event, Product, Venue } from "@/lib/types/supabase";
import { headers } from "next/headers";
import Image from "next/image";
import { GetEvent, GetProducts } from "./server";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddToCart } from "./client";
import SetTheme from "@/lib/set-theme";

export default async function EventPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const headersList = await headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host");
    const url = host == "localhost:3000" ? "vip.signsoftheswarm.com" : host;

    const param = await searchParams;
    const eventId = await param?.id;

    if (url == null) return null;

    const { artist, campaign } = await GetArtist(url);
    if (!artist || !campaign) return null;

    const themeCSS = await SetTheme(campaign);

    if (!eventId) return null;
    const { event, venue } = await GetEvent(Number(eventId));

    if (!event) return null;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
            <main className="min-h-screen flex flex-col items-center overflow-x-hidden">
                <Header />
                <PageLayout
                    artist={artist}
                    campaign={campaign}
                    event={event}
                    venue={venue}
                />
            </main>
        </>
    );
}

async function PageLayout({
    artist,
    campaign,
    event,
    venue,
}: {
    artist: Artist;
    campaign: Campaign;
    event: Event;
    venue: Venue | null;
}) {
    return (
        <div className="w-full relative px-4">
            <Background background={campaign.background} />
            <div className={`w-full flex flex-col items-center`}>
                <div
                    className={`absolute z-10 w-full max-w-screen-xl flex flex-col items-center`}>
                    <CampaignHeader artist={artist} campaign={campaign} />
                    <Separator className="bg-accent" />
                    <EventInfo
                        artist={artist}
                        campaign={campaign}
                        event={event}
                        venue={venue}
                    />
                </div>
            </div>
        </div>
    );
}

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

function CampaignHeader({
    artist,
    campaign,
}: {
    artist: Artist;
    campaign: Campaign;
}) {
    return (
        <div className={`w-full flex flex-col`}>
            <div
                className={`h-[40vh] w-full relative flex flex-col items-center`}>
                {artist.logo && (
                    <Image
                        src={artist.logo}
                        alt="Artist Logo"
                        fill
                        style={{ objectFit: "contain" }}
                    />
                )}
            </div>
            <div
                className={`h-[40vh] w-full relative flex flex-col items-center`}>
                {campaign.support && (
                    <Image
                        src={campaign.support}
                        alt="Artist Logo"
                        fill
                        style={{ objectFit: "contain" }}
                    />
                )}
            </div>
            <div className={`h-[15vh] flex flex-col justify-end`}>
                <div className={`w-full my-2`}>
                    <h1 className="font-heading text-3xl md:text-4xl uppercase">
                        {artist.name} {campaign.name}
                    </h1>
                    <p className="w-full text-xs uppercase pt-1">
                        * Vip upgrades do not include a show ticket
                    </p>
                </div>
            </div>
        </div>
    );
}

export type ProductWidget = {
    id: number;
    quantity: number;
    product: Product;
    quantity_remaining: number;
};

async function EventInfo({
    artist,
    campaign,
    event,
    venue,
}: {
    artist: Artist;
    campaign: Campaign;
    event: Event;
    venue: Venue | null;
}) {
    type ProductsResponse = {
        products: ProductWidget[];
    };

    const response = (await GetProducts(
        event.id
    )) as unknown as ProductsResponse;

    const products = response.products;

    if (!products) return null;

    console.log(products[0].quantity_remaining);

    // TODO: See if we should have a '# Remaining' somewhere on the page to push sales

    return (
        <div className={`w-full mt-2`}>
            <div className={`text-white`}>
                <h2 className="font-heading text-3xl">
                    {venue
                        ? `${venue.name} | ${venue.city_state}`
                        : "Venue Error"}
                </h2>
                <h3 className="font-heading font-light text-2xl">
                    {`${event.date} @ ${event.time}`}
                </h3>
                <h3 className="font-heading text-2xl">
                    VIP Access @ {event.vip_time}
                </h3>
            </div>
            <div className={`w-full flex gap-4`}>
                <div className={`w-1/2`}>
                    {products &&
                        products.map((product: ProductWidget) => (
                            <ProductWidget
                                key={product.id}
                                eventId={event.id}
                                product={product}
                            />
                        ))}
                </div>
                <div
                    className={`md:w-1/2 h-full flex flex-col gap-2 sticky top-2`}>
                    <RightColumn
                        artist={artist}
                        campaign={campaign}
                        event={event}
                    />
                </div>
            </div>
        </div>
    );
}

function ProductWidget({
    eventId,
    product,
}: {
    eventId: number;
    product: ProductWidget;
}) {
    return (
        <div
            className={`border border-accent bg-background/80 mb-4 rounded-md`}>
            <div className={`p-4`}>
                <h1 className="text-2xl tracking-wider">
                    {product.product.name}
                </h1>
                <div className={`mt-4 md:w-2/3`}>
                    <h2 className="text-xl tracking-wide">Includes</h2>
                    {product.product.details && (
                        <div
                            className={`list-disc px-4`}
                            dangerouslySetInnerHTML={{
                                __html: product.product.details,
                            }}
                        />
                    )}
                </div>
            </div>
            <AddToCart
                eventId={eventId}
                product={product}
                // eventProductId={product.id}
                // productId={product.product.id}
            />
        </div>
    );
}

// type AddToCartProps = {
//     artist: Artist;
//     campaign: Campaign;
//     event: Event;
//     product: Product;
// };

// // function AddToCart({artist, campaign, event, product}: AddToCartProps) {
// function AddToCart() {
//     const [quantity, setQuantity] = useState<number>(1);

//     return (
//         <div
//             className={`bg-accent w-full h-12 flex justify-center items-center`}>
//             <div className={`flex w-full px-2`}>
//                 <div className={`rounded bg-white flex flex-between`}>
//                     <div className={`flex gap-2`}>
//                         <Button
//                             variant="ghost"
//                             className="text-black/50 hover:bg-transparent hover:text-black  text-2xl">
//                             -
//                         </Button>
//                         <Input
//                             type="number"
//                             placeholder="1"
//                             className="w-full text-xl font-heading text-black text-center border-none shadow-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"></Input>
//                         <Button
//                             variant="ghost"
//                             className="text-black/50 hover:bg-transparent hover:text-black  text-2xl">
//                             +
//                         </Button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

function RightColumn({
    artist,
    campaign,
    event,
}: {
    artist: Artist;
    campaign: Campaign;
    event: Event;
}) {
    return (
        <div className="flex flex-col gap-4">
            {event.public_url && (
                <Link href={event.public_url}>
                    <Button
                        variant="outline"
                        className="w-full h-16 text-4xl font-heading uppercase">
                        Purchase a Ticket
                    </Button>
                </Link>
            )}
            <Link href="https://support.engagetix.com/">
                <Button
                    variant="outline"
                    className="w-full h-16 text-4xl font-heading uppercase">
                    Frequently Asked Questions
                </Button>
            </Link>
            <Link href="https://www.engagetix.com/contact">
                <Button
                    variant="outline"
                    className="w-full h-16 text-4xl font-heading uppercase">
                    Contact Us
                </Button>
            </Link>
            <p>
                The {artist.name} {campaign.name} VIP upgrades are TICKETLESS
                VIP upgrades. VIP upgrades DO NOT include a ticket to the
                concert. We recommend you{" "}
                <a
                    href={event.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-accent uppercase">
                    purchase a ticket
                </a>{" "}
                before buying a VIP upgrade. If you purchase a ticketless VIP
                upgrade before purchasing a concert ticket, you assume all risks
                of being unable to attend the event if the event sells out.
                <br />
                <br />
                All sales are final unless the event is canceled. For questions
                and support, please get in touch with support@engagetix.com.
                <br />
                <br />
                By purchasing an upgrade from ENGAGE and
                {artist.name}, you agree to opt into email marketing from both
                parties.
            </p>
        </div>
    );
}
