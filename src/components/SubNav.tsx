import Link from "next/link";

export function SubNav({
  items,
  activeHref,
}: {
  items: { href: string; label: string }[];
  activeHref: string;
}) {
  return (
    <nav aria-label="Section" className="sm:hidden -mt-2 mb-4">
      <ul className="flex gap-1 border-b border-muted/30 overflow-x-auto">
        {items.map((it) => {
          const active = it.href === activeHref;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center px-3 text-sm font-display border-b-2 transition-colors ${
                  active
                    ? "border-pink text-fg"
                    : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const BROWSE_ITEMS = [
  { href: "/restaurants", label: "Restaurants" },
  { href: "/meals", label: "Meals" },
  { href: "/suggestions", label: "Suggestions" },
];

export const HISTORY_ITEMS = [
  { href: "/history", label: "History" },
  { href: "/calendar", label: "Calendar" },
];
