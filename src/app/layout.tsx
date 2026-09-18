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
    default: "Play Tic-Tac-Toe Online",
    template: "%s | Tic-Tac-Toe",
  },
  description:
    "Play real-time 1-vs-1 Tic-Tac-Toe online. Create a room, invite a friend, and play instantly.",
  applicationName: "Tic-Tac-Toe",
  keywords: ["tic-tac-toe", "online game", "multiplayer game", "browser game"],
  authors: [{ name: "Tic-Tac-Toe" }],
  creator: "Tic-Tac-Toe",
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
    siteName: "Tic-Tac-Toe",
    title: "Play Tic-Tac-Toe Online",
    description:
      "Play real-time 1-vs-1 Tic-Tac-Toe online with a friend in your browser.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Play Tic-Tac-Toe Online",
    description:
      "Play real-time 1-vs-1 Tic-Tac-Toe online with a friend in your browser.",
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
