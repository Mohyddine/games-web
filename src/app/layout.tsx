import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";
import { RoomProvider } from "@/context/RoomContext";
import { PwaRegistration } from "@/components/PwaRegistration";

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
    "Play real-time 1-vs-1 multiplayer games online. Choose Tic-Tac-Toe or Rock Paper Scissors and invite a friend.",
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
      "Play Tic-Tac-Toe or Rock Paper Scissors with a friend in real time.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Real-Time Multiplayer Games",
    description:
      "Play Tic-Tac-Toe or Rock Paper Scissors with a friend in real time.",
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
            <div className="flex-1 flex flex-col">{children}</div>
          </RoomProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
