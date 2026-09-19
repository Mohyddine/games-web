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
    default: "GameHub — Real-Time Multiplayer",
    template: "%s | GameHub",
  },
  description:
    "Challenge a friend to fast, real-time 1-vs-1 browser games. Choose XO or RPS, create a room, and play instantly.",
  applicationName: "GameHub",
  keywords: [
    "multiplayer games",
    "tic-tac-toe",
    "rock paper scissors",
    "online game",
    "browser game",
  ],
  authors: [{ name: "GameHub" }],
  creator: "GameHub",
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
    siteName: "GameHub",
    title: "GameHub — Real-Time Multiplayer Games",
    description:
      "Challenge a friend to XO or RPS in a fast, real-time browser match.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "GameHub — Real-Time Multiplayer Games",
    description:
      "Challenge a friend to XO or RPS in a fast, real-time browser match.",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f2f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d14" },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {/* Ambient background orbs */}
        <div
          className="pointer-events-none fixed inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        <PwaRegistration />
        <SessionProvider>
          <RoomProvider>
            {/* Controls pill — fixed top-right */}
            <div
              className="fixed right-4 top-4 z-50 flex items-center gap-1.5 rounded-2xl p-1.5"
              style={{
                background: "var(--glass)",
                border: "1px solid var(--glass-border)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <SoundToggle />
              <ThemeToggle />
            </div>

            <div className="relative flex-1 flex flex-col">
              {children}
            </div>
          </RoomProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
