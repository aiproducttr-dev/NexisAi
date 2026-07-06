import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_URL } from "@/lib/constants/urls";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  title: "NexisAI — Yapay Zeka Reklam Platformu",
  description:
    "İşletmenizi yapay zeka arama motorlarında tavsiye edilen seçenekler arasına taşıyan tam otomatik GEO reklam ve veri platformu.",
  keywords: [
    "Nexisai",
    "nexısai",
    "nexisai",
    "NEXIS AI",
    "yapay zeka otomasyonu",
    "AIO",
    "GEO",
    "yapay zeka görünürlük",
    "yapay zeka reklam",
    "ChatGPT görünürlük",
    "işletme tanıtımı",
    "dijital pazarlama",
  ],
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: APP_URL,
    siteName: "Nexisai",
    title: "NexisAI — Yapay Zeka Reklam Platformu",
    description:
      "İşletmenizi yapay zeka arama motorlarında tavsiye edilen seçenekler arasına taşıyan tam otomatik GEO reklam ve veri platformu.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Nexisai" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
