import { headers } from "next/headers";

export async function getActiveDomain() {
    const headersList = await headers();
    const host =
        headersList.get("x-forwarded-host") || headersList.get("host") || "";

    // If it's local or Vercel preview, return your primary dev domain
    if (host.includes("localhost") || host.includes("vercel.app")) {
        return "vip.chaosandcarnage.com";
    }

    return host;
}
