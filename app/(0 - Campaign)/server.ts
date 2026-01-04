"use server";

import { createClient } from "@/lib/supabase/server";
import { Artist, Campaign, Event, Venue } from "@/lib/types/supabase";

export async function GetArtist(
    url: string
): Promise<{ artist: Artist | null; campaign: Campaign | null }> {
    const supabase = await createClient();

    const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select()
        .eq("public_url", url)
        .maybeSingle();

    if (!artist || artistError) {
        console.log(`Error retreiving artist info: ${artistError?.message}`);
        return { artist: null, campaign: null };
    }

    if (!artist.active_campaign) {
        return { artist, campaign: null };
    }

    const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select()
        .eq("id", artist.active_campaign)
        .maybeSingle();

    if (campaignError) {
        console.log(
            `Error retrieving artist info from slug: ${campaignError.message}`
        );
        return { artist, campaign: null };
    }

    return { artist, campaign };
}

export async function GetEvents(
    campaign: number
): Promise<{ events: Event[] | null }> {
    const supabase = await createClient();

    // TODO: Remove passed dates
    const { data: events, error } = await supabase
        .from("events")
        .select()
        .eq("campaign", campaign);
    if (!events || error) {
        console.log(`Error retrieving campaign events: ${error?.message}`);
        return { events: null };
    }

    const sortedEvents = events.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return { events: sortedEvents };
}

export async function GetVenues(): Promise<{ venues: Venue[] | null }> {
    const supabase = await createClient();

    const { data: venues, error } = await supabase.from("venues").select();

    if (!venues || error) {
        console.log(`Error retrieving venues: ${error?.message}`);
        return { venues: null };
    }

    return { venues };
}
