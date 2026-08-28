import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const description = "Find and book unique places to stay, or host your own.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "fystay — book unique stays",
    template: "%s · fystay",
  },
  description,
  openGraph: {
    title: "fystay — book unique stays",
    description,
    siteName: "fystay",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "fystay — book unique stays",
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
        <Navbar />
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
