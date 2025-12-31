import type { Metadata } from "next";
import { Bebas_Neue, Figtree } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "sonner";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: "Engage Tix",
    description: "Empowering Artists, Delighting Fans",
};

const bebasNeue = Bebas_Neue({
    subsets: ["latin"],
    variable: "--font-bebas-neue",
    display: "swap",
    weight: "400",
});

const figtree = Figtree({
    subsets: ["latin"],
    // Specify the weights you want to load to optimize performance
    weight: ["300", "400", "600", "700", "900"],
    variable: "--font-figtree", // Define a CSS variable name
    display: "swap",
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${figtree.className} ${figtree.variable} ${bebasNeue.variable} antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange>
                    {children}
                    <Toaster richColors position="bottom-center" />
                </ThemeProvider>
            </body>
        </html>
    );
}
