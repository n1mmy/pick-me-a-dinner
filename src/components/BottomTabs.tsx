"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Tonight", match: (p: string) => p === "/" },
  { href: "/history", label: "History", match: (p: string) => p.startsWith("/history") || p.startsWith("/calendar") },
  { href: "/restaurants", label: "Browse", match: (p: string) => p.startsWith("/restaurants") || p.startsWith("/meals") || p.startsWith("/suggestions") },
];

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sections"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-10 bg-surface border-t border-muted/30 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-center min-h-14 text-sm font-display transition-colors ${
                  active ? "text-pink" : "text-muted hover:text-fg"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
