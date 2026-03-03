import Provider from "@/components/provider/provider";
import { ColorSchemeScript } from "@mantine/core";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Electricity Bill",
    description: "A tool to help you calculate your electricity bill and track your usage.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <ColorSchemeScript defaultColorScheme="dark" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <Provider>{children}</Provider>
            </body>
        </html>
    );
}
