import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "SureScan Pro — Détection de surebets & arbitrage | Gabon · Afrique",
  description:
    "Scanner professionnel d'arbitrage sportif : détection de surebets en temps réel sur 1xBet, Melbet, BetWinner, 22Bet, Premier Bet et autres bookmakers d'Afrique. Matchs réels & virtuels, calculatrice de répartition des mises.",
  applicationName: "SureScan Pro",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SureScan Pro",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#f8fafc" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${spaceGrotesk.variable} ${jetbrains.variable} bg-stage min-h-screen antialiased`}
      >
        <div className="bg-grid pointer-events-none fixed inset-0" aria-hidden />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
