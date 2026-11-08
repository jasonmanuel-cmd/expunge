import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Expunge — AI Credit Dispute Automation",
  description:
    "Expunge reads your credit report, flags items worth disputing, and drafts FCRA-based dispute letters you can download and mail yourself.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  other: {
    "theme-color": "#ffffff",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
