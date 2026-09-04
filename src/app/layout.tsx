import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { SupportWidget } from "@/components/SupportWidget";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["600"],
});

// This default only ever renders on a page that hasn't set its own title
// (see the "%s · FYStay" template below for every other page) - kept
// reasonably specific rather than a bare brand name, since a route added
// later without its own metadata would otherwise fall back to a title with
// no useful information in it.
const defaultTitle = `${SITE_NAME} — Local Accommodation on the Fylde Coast`;
const description =
  "Book independent apartments, cottages and guest houses across Blackpool and the Fylde Coast - real local hosts, genuine reviews, secure booking.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s · ${SITE_NAME}`,
  },
  description,
  openGraph: {
    title: defaultTitle,
    description,
    siteName: SITE_NAME,
    url: SITE_URL,
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-brand-700 focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:shadow-lg"
        >
          Skip to main content
        </a>
        <CurrencyProvider>
          <CookieConsentBanner />
          <Navbar />
          <main id="main-content" className="flex flex-1 flex-col">
            {children}
          </main>
          <Footer />
          <SupportWidget />
          <Toaster position="top-center" richColors closeButton />
        </CurrencyProvider>
      </body>
    </html>
  );
}
