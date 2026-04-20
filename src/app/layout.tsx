import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BottomTabs } from "@/components/BottomTabs";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-fraunces" });
const instrumentSans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-instrument" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Pick Me a Dinner",
  description: "Family dinner picker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${fraunces.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-fg font-sans tracking-wide">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-20 focus:px-3 focus:py-2 focus:bg-pink focus:text-white focus:rounded focus:text-sm focus:font-display focus:min-h-11 focus:inline-flex focus:items-center"
        >
          Skip to main content
        </a>
        <nav aria-label="Primary" className="fixed top-0 left-0 right-0 z-10 bg-surface shadow-[0_2px_6px_rgba(0,0,0,0.2)] px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
            <Link href="/" className="font-display text-lg text-fg hover:text-pink transition-colors inline-flex items-center min-h-11 py-1">
              /PickMeADinner/
            </Link>
            <div className="hidden sm:flex gap-1 text-sm">
              <Link href="/history" className="px-2.5 min-h-11 inline-flex items-center text-muted hover:text-pink transition-colors">History</Link>
              <Link href="/calendar" className="px-2.5 min-h-11 inline-flex items-center text-muted hover:text-pink transition-colors">Calendar</Link>
              <Link href="/restaurants" className="px-2.5 min-h-11 inline-flex items-center text-muted hover:text-pink transition-colors">Restaurants</Link>
              <Link href="/meals" className="px-2.5 min-h-11 inline-flex items-center text-muted hover:text-pink transition-colors">Meals</Link>
              <Link href="/suggestions" className="px-2.5 min-h-11 inline-flex items-center text-muted hover:text-pink transition-colors">Suggestions</Link>
            </div>
            {/* Mobile: secondary pages reached via Browse tab + in-page links */}
          </div>
        </nav>
        <main id="main" className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 mt-16 pb-24 sm:pb-6">
          {children}
        </main>
        <BottomTabs />
      </body>
    </html>
  );
}
