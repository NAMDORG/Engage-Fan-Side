import { Campaign } from "./types/supabase";

export default async function SetTheme(campaign: Campaign) {
    const colors = {
        primary: campaign.color_text_primary || "#FFFFFF",
        secondary: campaign.color_text_secondary || "#CCCCCC",
        background: campaign.color_background || "#000000",
        accent: campaign.color_accent || "#FF0000",
        cta: campaign.color_cta || "#00FF00",
    };
    const themeCSS = await setThemeColors(colors);
    return themeCSS;
}

export async function setThemeColors(colors: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
    cta: string;
}): Promise<string> {
    let css = ":root {\n";
    Object.entries(colors).forEach(([key, value]) => {
        const hslValue = hexToHSL(value);
        css += `  --${key}: ${hslValue};\n`;
    });
    css += "}";
    return css;
}

export function hexToHSL(hex: string) {
    let r = 0,
        g = 0,
        b = 0;

    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }

    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h = 0,
        s = 0,
        l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
        l * 100
    )}%`;
}
