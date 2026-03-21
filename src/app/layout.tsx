import type { Metadata } from "next";
import { Geist, Unica_One } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const unica = Unica_One({ weight: "400", subsets: ["latin"], variable: "--font-unica" });

export const metadata: Metadata = {
  title: "Pick Me a Dinner",
  description: "Family dinner picker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${unica.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-fg font-sans tracking-wide">
        <nav className="fixed bottom-0 left-0 right-0 z-10 bg-surface shadow-[0_-2px_6px_rgba(0,0,0,0.2)] px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/" className="font-[family-name:var(--font-unica)] text-lg text-fg hover:text-pink transition-colors">
              /PickMeADinner/
            </Link>
            <div className="flex gap-1 text-sm">
              <Link href="/history" className="px-2.5 py-1 text-muted hover:text-pink transition-colors">History</Link>
              <Link href="/restaurants" className="px-2.5 py-1 text-muted hover:text-pink transition-colors">Restaurants</Link>
              <Link href="/meals" className="px-2.5 py-1 text-muted hover:text-pink transition-colors">Meals</Link>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 mb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
