import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Pick Me a Dinner",
  description: "Family dinner picker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <nav className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg text-indigo-600 hover:text-indigo-800">
              🍽 Pick Me a Dinner
            </Link>
            <div className="flex gap-4 text-sm text-gray-600">
              <Link href="/history" className="hover:text-gray-900">History</Link>
              <Link href="/restaurants" className="hover:text-gray-900">Restaurants</Link>
              <Link href="/meals" className="hover:text-gray-900">Meals</Link>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
