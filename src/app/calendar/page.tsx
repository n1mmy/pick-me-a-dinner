export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import Link from "next/link";
import { LoadingLink } from "@/components/LoadingLink";

function formatMonthYear(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;

  let year: number;
  let month: number; // 0-indexed

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  } else {
    const now = new Date();
    year = now.getUTCFullYear();
    month = now.getUTCMonth();
  }

  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));

  const dinners = await prisma.dinner.findMany({
    where: { date: { gte: first, lte: last } },
    include: { restaurant: true, meal: true },
  });

  const dinnerByDate = new Map(
    dinners.map((d) => [d.date.toISOString().split("T")[0], d])
  );

  const startDow = first.getUTCDay(); // 0 = Sunday
  const daysInMonth = last.getUTCDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const today = new Date().toISOString().split("T")[0];

  const prevDate = new Date(Date.UTC(year, month - 1, 1));
  const nextDate = new Date(Date.UTC(year, month + 1, 1));
  const prevMonth = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextMonth = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-fg">Calendar</h1>
          <hr className="border-0 border-b-[3px] border-dashed border-pink w-2/3 mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <LoadingLink
            href={`/calendar?month=${prevMonth}`}
            className="px-2 py-1 border border-dashed border-muted/40 rounded text-sm text-muted hover:text-pink hover:border-pink/40 transition-colors"
          >
            ←
          </LoadingLink>
          <span className="font-display text-sm text-fg min-w-[120px] text-center">
            {formatMonthYear(year, month)}
          </span>
          <LoadingLink
            href={`/calendar?month=${nextMonth}`}
            className="px-2 py-1 border border-dashed border-muted/40 rounded text-sm text-muted hover:text-pink hover:border-pink/40 transition-colors"
          >
            →
          </LoadingLink>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs text-muted pb-1 font-display">
            {d}
          </div>
        ))}

        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - startDow + 1;

          if (dayNum < 1 || dayNum > daysInMonth) {
            return <div key={i} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const dinner = dinnerByDate.get(dateStr);
          const isToday = dateStr === today;
          const entityId = dinner?.restaurantId ?? dinner?.mealId;
          const href = dinner && entityId
            ? `/add?date=${today}&suggestedId=${entityId}&type=${dinner.type}`
            : null;
          const name = dinner?.restaurant?.name ?? dinner?.meal?.name;
          const isRestaurant = dinner?.type === "RESTAURANT";
          const tags = dinner?.restaurant?.tags ?? dinner?.meal?.tags ?? [];

          const cellClass = [
            "aspect-square p-1 rounded border border-dashed flex flex-col transition-colors overflow-hidden",
            isToday
              ? "border-teal/60 bg-teal/10"
              : dinner
              ? "border-muted/30"
              : "border-muted/20",
            href ? "cursor-pointer hover:border-pink/50 hover:bg-pink/5" : "",
          ].join(" ");

          const cellContent = (
            <>
              <span
                className={[
                  "text-xs leading-none font-mono",
                  isToday
                    ? "text-teal font-bold"
                    : "text-muted",
                ].join(" ")}
              >
                {dayNum}
              </span>
              {name && (
                <span
                  className={[
                    "text-[9px] leading-tight mt-0.5 line-clamp-2 w-full",
                    isRestaurant ? "text-pink" : "text-teal",
                  ].join(" ")}
                >
                  {name}
                </span>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5 overflow-hidden">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[8px] leading-none px-1 py-0.5 rounded bg-teal/15 text-teal shrink-0">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          );

          return href ? (
            <Link key={i} href={href} className={cellClass}>
              {cellContent}
            </Link>
          ) : (
            <div key={i} className={cellClass}>
              {cellContent}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        <span className="text-pink">Pink</span> = restaurant · <span className="text-teal">Teal</span>{" "}= homecooked · click a day to add another dinner with the same option
      </p>
    </div>
  );
}
