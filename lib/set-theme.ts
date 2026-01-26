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
    const derivedColors: Record<string, string> = {
        ...colors,
        foreground: colors.primary,
        "primary-foreground": getReadableForeground(colors.primary),
        "secondary-foreground": getReadableForeground(colors.secondary),
        "accent-foreground": getReadableForeground(colors.accent),
        "cta-foreground": getReadableForeground(colors.cta),
    };
    Object.entries(derivedColors).forEach(([key, value]) => {
        const hslValue = hexToHSL(value);
        css += `  --${key}: ${hslValue};\n`;
    });
    css += "}";
    return css;
}

function getReadableForeground(color: string) {
    const hslValue = hexToHSL(color);
    const parts = hslValue.split(" ");
    const lightness = Number.parseFloat((parts[2] || "").replace("%", ""));

    if (!Number.isFinite(lightness)) {
        return "#FFFFFF";
    }

    return lightness > 60 ? "#000000" : "#FFFFFF";
}

export function hexToHSL(hex: string) {
    const raw = hex.trim();
    if (raw.length === 0) {
        return "0 0% 0%";
    }

    if (raw.startsWith("hsl(") || raw.startsWith("hsla(")) {
        const inner = raw
            .replace(/^hsla?\(/, "")
            .replace(/\)$/, "")
            .replace(/\s*\/\s*[\d.]+%?\s*$/, "")
            .replace(/,/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        return inner || "0 0% 0%";
    }

    if (/^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/.test(raw)) {
        return raw;
    }

    let normalized = raw.startsWith("#") ? raw.slice(1) : raw;
    if (normalized.length === 8) {
        normalized = normalized.slice(0, 6);
    }

    let r = 0,
        g = 0,
        b = 0;

    if (normalized.length === 3) {
        r = parseInt(normalized[0] + normalized[0], 16);
        g = parseInt(normalized[1] + normalized[1], 16);
        b = parseInt(normalized[2] + normalized[2], 16);
    } else if (normalized.length === 6) {
        r = parseInt(normalized[0] + normalized[1], 16);
        g = parseInt(normalized[2] + normalized[3], 16);
        b = parseInt(normalized[4] + normalized[5], 16);
    } else {
        return "0 0% 0%";
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
