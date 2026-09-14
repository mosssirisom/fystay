import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lora, DM_Serif_Display } from "next/font/google";
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

// Warm serif for headings and the wordmark. Fraunces (the previous pick
// here) has enough ink-trap/ball-terminal drama at bold weights that it
// reads as quirky/editorial rather than warm once it's set as a compact
// logotype - Lora keeps the same literary, human quality (calligraphic
// roots, moderate contrast) at a much calmer, more legible register, so it
// sits comfortably next to the plain Geist sans used everywhere else.
const lora = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal"],
});

// The wordmark gets its own, separate font from every other heading on the
// site (see --font-logo's own mapping in globals.css) - DM Serif Display's
// softer, more rounded terminals read as warmer and more approachable than
// Lora at logotype scale, which is exactly the "premium travel brand, not a
// traditional hotel/estate-agent" feel the mark is going for. It only ships
// one weight (400), which keeps the mark from ever reading as heavy-handed.
const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-logo-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal"],
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
  themeColor: "#bc522f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${dmSerifDisplay.variable} h-full antialiased`}
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
