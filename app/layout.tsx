// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientShell from "@/app/components/ClientShell";
import OfflineOverlay from "@/app/components/OfflineOverlay";
import ClientDownloadWrapper from "@/app/components/ClientDownloadWrapper";
import { Providers } from "@/app/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  // Use environment variables only, no server-side fetch during build
  return {
    title: process.env.NEXT_PUBLIC_APP_NAME || "PrimeStudy",
    description: "PrimeStudy ~ Learn, Code, Grow",
    manifest: "/manifest.json",
    authors: [
      { name: "VIVEK", url: "https://t.me/VS_ONHUNT" },
    ],
    creator: "PrimeStudy",
    icons: {
      icon: "/favicon.ico",
      apple: "/logo.png",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't fetch server info on the server - let client handle it
  // This avoids server-side MongoDB connection issues during initial render
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <OfflineOverlay />
          <ClientDownloadWrapper />
          <ClientShell>{children}</ClientShell>
        </Providers>
      </body>
    </html>
  );
}
