import Header from "@/components/header";
import { GetArtist, GetEvents, GetVenues } from "./server";
import { Artist, Campaign, Event, Venue } from "@/lib/types/supabase";
import Image from "next/image";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { setThemeColors } from "@/lib/set-theme";
import { GetProducts } from "../(1 - Event)/event/server";
import { ProductsResponse } from "../(1 - Event)/event/page";
import { getActiveDomain } from "@/lib/get-domain";

export default async function Home() {
    const url = await getActiveDomain();
    const { artist, campaign } = await GetArtist(url);

    if (!artist || !campaign) return null;

    const colors = {
        primary: campaign.color_text_primary || "#FFFFFF",
        secondary: campaign.color_text_secondary || "#CCCCCC",
        background: campaign.color_background || "#000000",
        accent: campaign.color_accent || "#FF0000",
        cta: campaign.color_cta || "#00FF00",
    };
    const themeCSS = await setThemeColors(colors);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
            <main className="min-h-screen flex flex-col items-center overflow-x-hidden">
                <Header />
                <PageLayout artist={artist} campaign={campaign} />
            </main>
        </>
    );
}

async function PageLayout({
    artist,
    campaign,
}: {
    artist: Artist;
    campaign: Campaign;
}) {
    return (
        <div className="w-full relative px-4">
            <Background background={campaign.background} />
            <div className={`w-full flex flex-col items-center`}>
                <div
                    className={`absolute z-10 w-full max-w-screen-xl flex flex-col items-center`}>
                    <CampaignHeader artist={artist} campaign={campaign} />
                    <EventList campaign={campaign.id} />
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
                {campaign.logo && (
                    <Image
                        src={campaign.logo}
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
            <div className={`h-[15vh] px-2 md:px-0 flex flex-col justify-end`}>
                <div className={`w-full my-2`}>
                    <h1 className="font-heading text-3xl md:text-4xl uppercase">
                        {artist.name} {campaign.name}
                    </h1>
                    <p className="w-full text-xs uppercase pt-1">
                        * VIP upgrades do not include a show ticket
                    </p>
                </div>
            </div>
        </div>
    );
}

async function EventList({ campaign }: { campaign: number }) {
    if (!campaign) return null;

    const { events } = await GetEvents(campaign);
    const { venues } = await GetVenues();

    if (!events) return null;

    return (
        <div className={`w-full`}>
            <Table className="hidden md:table">
                <TableBody>
                    {events &&
                        events.map((event, index) => {
                            const venue = venues?.find(
                                (venue: Venue) => venue.id === event.venue,
                            );

                            return (
                                <EventRow
                                    key={index}
                                    event={event}
                                    venue={venue}
                                />
                            );
                        })}
                </TableBody>
            </Table>
            <div className={`md:hidden w-full p-2 flex flex-col gap-2`}>
                {events &&
                    events.map((event, index) => {
                        const venue = venues?.find(
                            (venue: Venue) => venue.id === event.venue,
                        );
                        return (
                            <div
                                key={index}
                                className={`w-full border border-primary rounded-md p-2`}>
                                <div
                                    className={`font-heading text-3xl text-accent`}>
                                    {venue?.city_state}
                                </div>
                                <div className={`font-heading text-2xl`}>
                                    {venue?.name}
                                </div>
                                <div className={``}>
                                    {event.date} @ {event.time} -{" "}
                                    <span className="font-bold">
                                        {event.age
                                            ? `${event.age}+`
                                            : `All Ages`}
                                    </span>
                                </div>
                                <div className={`flex gap-2 pt-2`}>
                                    <Button
                                        variant="outline"
                                        className="w-1/2 max-w-64"
                                        asChild>
                                        <a href={event.public_url}>
                                            Get Tickets
                                        </a>
                                    </Button>

                                    <Button className="w-1/2 max-w-64" asChild>
                                        <a href={`/event?id=${event.id}`}>
                                            Get VIP
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

async function EventRow({
    event,
    venue,
}: {
    event: Event;
    venue: Venue | undefined;
}) {
    const response = (await GetProducts(
        event.id,
    )) as unknown as ProductsResponse;
    const products = response.products;
    const availablePackages = products.reduce(
        (total, product) => total + product.quantity_remaining,
        0,
    );

    return (
        <TableRow className="odd:bg-[hsl(0_0%_14.9%/0.5)] border-none h-16 w-full text-secondary-foreground">
            <TableCell className="w-1/7 px-4">{event.date}</TableCell>
            <TableCell className="w-1/7 px-4">{venue?.name}</TableCell>
            <TableCell className="w-1/7 px-4">{venue?.city_state}</TableCell>
            <TableCell className="w-1/7 px-4">Doors @ {event.time}</TableCell>
            <TableCell className="w-1/7 px-4">
                {event.vip_time ? `VIP Access @ ${event.vip_time}` : ""}
            </TableCell>
            <TableCell className="w-1/7 px-4">
                {event.age ? `${event.age}+` : "All Ages"}
            </TableCell>
            <TableCell className="h-16 w-1/7 px-4 flex items-center justify-end gap-1">
                {event.public_url && (
                    <Link href={event.public_url}>
                        <Button variant="outline">Get Tickets</Button>
                    </Link>
                )}
                {/* TODO: Count available VIP and hide conditionally */}
                {availablePackages > 0 ? (
                    <Link href={`/event?id=${event.id}`}>
                        <Button className="w-24" variant="default">
                            Get VIP
                        </Button>
                    </Link>
                ) : (
                    <Button className="w-24" disabled>
                        VIP Sold Out
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}
