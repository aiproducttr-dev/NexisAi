import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import MetaPixel from "@/components/analytics/MetaPixel";
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
        <MetaPixel />
        {children}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xkqs89kc67");
          `}
        </Script>
      </body>
    </html>
  );
}
