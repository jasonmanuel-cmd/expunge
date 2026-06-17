import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expunge — AI Credit Dispute Automation",
  description:
    "Expunge analyzes your credit report, applies 30 years of FCRA case law, drafts legally precise dispute letters, and dispatches them to all three bureaus — automatically.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  other: {
    "theme-color": "#F5F5F7",
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
