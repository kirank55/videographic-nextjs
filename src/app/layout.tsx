import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Videographic - AI Text-to-Video Generator",
  description: "Create stunning videos from text prompts using AI. No video editing skills required.",
  keywords: ["video generator", "AI video", "text to video", "video editor"],
  authors: [{ name: "Videographic" }],
  openGraph: {
    title: "Videographic - AI Text-to-Video Generator",
    description: "Create stunning videos from text prompts using AI",
    type: "website",
  },
};

export const runtime = "nodejs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
