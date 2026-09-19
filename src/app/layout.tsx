import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";
import { RoomProvider } from "@/context/RoomContext";
import { PwaRegistration } from "@/components/PwaRegistration";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SoundToggle } from "@/components/ui/SoundToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Real-Time Multiplayer Games",
    template: "%s | Real-Time Multiplayer Games",
  },
  description:
    "Challenge a friend to fast, real-time 1-vs-1 browser games. Choose Tic-Tac-Toe or Rock Paper Scissors, create a room, and play instantly.",
  applicationName: "Real-Time Multiplayer Games",
  keywords: [
    "multiplayer games",
    "tic-tac-toe",
    "rock paper scissors",
    "online game",
    "browser game",
  ],
  authors: [{ name: "Real-Time Multiplayer Games" }],
  creator: "Real-Time Multiplayer Games",
  category: "games",
  referrer: "origin-when-cross-origin",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Real-Time Multiplayer Games",
    title: "Real-Time Multiplayer Games",
    description:
      "Challenge a friend to Tic-Tac-Toe or Rock Paper Scissors in a fast, real-time browser match.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Real-Time Multiplayer Games",
    description:
      "Challenge a friend to Tic-Tac-Toe or Rock Paper Scissors in a fast, real-time browser match.",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <PwaRegistration />
        <SessionProvider>
          <RoomProvider>
            <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
              <SoundToggle />
              <ThemeToggle />
            </div>
            <div className="flex-1 flex flex-col">{children}</div>
          </RoomProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
