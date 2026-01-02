import { GetArtist } from "@/app/(0 - Campaign)/server";
import Header from "@/components/header";
import SetTheme from "@/lib/set-theme";
import { Artist, Campaign } from "@/lib/types/supabase";
import { headers } from "next/headers";

export default async function SuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const headersList = await headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host");

    const params = await searchParams;
    const paymentIntent = params.payment_intent as string;

    const url = host == "localhost:3000" ? "vip.signsoftheswarm.com" : host;

    // TODO: catch this error. url returning null will break the whole site
    if (url == null) return null;

    const { artist, campaign } = await GetArtist(url);

    // TODO: Catch this error
    if (!artist || !campaign) return null;
    // TODO: Refactor them setting
    const themeCSS = await SetTheme(campaign);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
            <Header />
            <PageLayout campaign={campaign} paymentIntent={paymentIntent} />
        </>
    );
}

async function PageLayout({
    campaign,
    paymentIntent,
}: {
    campaign: Campaign;
    paymentIntent: string;
}) {
    return (
        <div className={`w-full relative px-4`}>
            <Background background={campaign.background} />
            <div
                className={`absolute z-10 w-full min-h-screen p-8 flex flex-col justify-center items-center`}>
                <div
                    className={`max-w-screen-sm w-full p-4 md:p-8 bg-background border border-accent rounded-md text-center`}>
                    <div>
                        <>
                            <h1 className="text-accent font-heading text-3xl md:text-7xl font-bold uppercase">
                                Success!
                            </h1>
                            <h3 className="text-md font-bold uppercase">
                                You should be receiving an email with your
                                purchase confirmation.
                            </h3>
                            <br />
                            <h3 className="text-md font-bold uppercase">
                                Check your spam folder and whitelist
                                engagetix.com to guarantee our future emails can
                                reach you.
                            </h3>
                            <br />
                            <p>
                                Reach out to{" "}
                                <a
                                    className="text-accent"
                                    href="mailto:support@engagetix.com">
                                    support@engagetix.com
                                </a>{" "}
                                with any issues.
                            </p>
                            <p>Purchase ID: {paymentIntent}</p>
                        </>
                    </div>
                </div>
            </div>
        </div>
    );
}

// TODO: Catch missing background
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
