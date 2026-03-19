export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { pickAndRedirect, deleteDinner } from "@/app/actions/dinners";
import { SubmitButton } from "@/components/SubmitButton";
import { LoadingLink } from "@/components/LoadingLink";
import { Tags } from "@/components/Tags";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = Math.max(14, parseInt(daysParam ?? "14", 10));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - days);

  const scoringSince = new Date(today);
  scoringSince.setUTCDate(scoringSince.getUTCDate() - 21);

  const [recentDinners, restaurants, meals, scoringDinners] = await Promise.all([
    prisma.dinner.findMany({
      where: { date: { gte: since } },
      include: { restaurant: true, meal: true },
      orderBy: { date: "desc" },
    }),
    prisma.restaurant.findMany({ orderBy: { name: "asc" } }),
    prisma.meal.findMany({ orderBy: { name: "asc" } }),
    prisma.dinner.findMany({
      where: { date: { gte: scoringSince } },
      orderBy: { date: "desc" },
    }),
  ]);

  // Score options by days since last use (capped at 21), pick top 3
  const now = Date.now();
  const lastUsed = new Map<string, number>();
  for (const dinner of scoringDinners) {
    const key = (dinner.restaurantId ?? dinner.mealId)!;
    const daysSince = Math.floor((now - dinner.date.getTime()) / 86_400_000);
    if (!lastUsed.has(key) || lastUsed.get(key)! > daysSince) {
      lastUsed.set(key, daysSince);
    }
  }
  type Suggestion = { type: "RESTAURANT" | "HOMECOOKED"; id: string; name: string; tags: string[]; orderUrl: string | null; phoneNumber: string | null; daysSinceLastOrder: number | null; score: number; rand: number };
  function pickTop<T extends { score: number; rand: number }>(options: T[], n: number) {
    return [...options].sort((a, b) => b.score - a.score || a.rand - b.rand).slice(0, n);
  }
  const restaurantSuggestions = pickTop(
    restaurants.map((r) => ({ type: "RESTAURANT" as const, id: r.id, name: r.name, tags: r.tags, orderUrl: r.orderUrl, phoneNumber: r.phoneNumber, daysSinceLastOrder: lastUsed.get(r.id) ?? null, score: lastUsed.get(r.id) ?? 21, rand: Math.random() })),
    3,
  );
  const mealSuggestions = pickTop(
    meals.map((m) => ({ type: "HOMECOOKED" as const, id: m.id, name: m.name, tags: m.tags, orderUrl: null, phoneNumber: null, daysSinceLastOrder: lastUsed.get(m.id) ?? null, score: lastUsed.get(m.id) ?? 21, rand: Math.random() })),
    2,
  );

  const todayStr = toDateStr(today);

  // Group dinners by date
  const dinnersByDate: Record<string, typeof recentDinners> = {};
  for (const d of recentDinners) {
    const key = toDateStr(d.date);
    (dinnersByDate[key] ??= []).push(d);
  }
  const todayDinners = dinnersByDate[todayStr] ?? [];

  // Build past days (excluding today), most recent first
  const pastDays = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (i + 1));
    return d;
  });

  return (
    <div className="space-y-6">
      {/* Tonight */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Tonight</h2>
        {todayDinners.length > 0 ? (
          <div className="space-y-3">
            {todayDinners.map((dinner) => (
              <div key={dinner.id} className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-semibold">
                    {dinner.restaurant?.name ?? dinner.meal?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
                  </p>
                  {(dinner.restaurant?.notes ?? dinner.meal?.notes) && (
                    <p className="text-sm text-gray-400 mt-1">{dinner.restaurant?.notes ?? dinner.meal?.notes}</p>
                  )}
                  {dinner.notes && (
                    <p className="text-sm text-gray-500 mt-1">{dinner.notes}</p>
                  )}
                  <Tags tags={dinner.restaurant?.tags ?? dinner.meal?.tags ?? []} className="mt-1" />
                </div>
                <div className="flex gap-3 items-center shrink-0 ml-4">
                  <LoadingLink
                    href={`/add?id=${dinner.id}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Edit
                  </LoadingLink>
                  <form action={async () => { "use server"; await deleteDinner(dinner.id); }}>
                    <SubmitButton className="text-sm text-red-400 hover:text-red-600">Delete</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-1 border-t border-gray-100">
              <form action={pickAndRedirect}>
                <input type="hidden" name="date" value={todayStr} />
                <SubmitButton className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                  Pick another
                </SubmitButton>
              </form>
              <LoadingLink
                href={`/add?date=${todayStr}`}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Add another
              </LoadingLink>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {restaurantSuggestions.length === 0 && mealSuggestions.length === 0 ? (
              <p className="text-gray-500">No dinner set for tonight yet.</p>
            ) : (
              <div className="space-y-4">
                {restaurantSuggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Restaurants</p>
                    <ul className="space-y-2">
                      {restaurantSuggestions.map((s) => (
                        <li key={s.id}>
                          <LoadingLink
                            href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-sm">{s.name}</p>
                              <p className="text-xs text-gray-400">
                                {s.daysSinceLastOrder === null
                                  ? "never ordered"
                                  : s.daysSinceLastOrder === 0
                                  ? "last ordered today"
                                  : s.daysSinceLastOrder === 1
                                  ? "last ordered yesterday"
                                  : `last ordered ${s.daysSinceLastOrder} days ago`}
                              </p>
                              {s.orderUrl && (
                                <p className="text-xs text-indigo-500 mt-0.5">{s.orderUrl}</p>
                              )}
                              {s.phoneNumber && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  <a href={`tel:${s.phoneNumber}`} className="hover:underline">{s.phoneNumber}</a>
                                </p>
                              )}
                              <Tags tags={s.tags} className="mt-1" />
                            </div>
                            <span className="text-sm text-indigo-600 font-medium shrink-0 ml-4">Choose →</span>
                          </LoadingLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {mealSuggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Homecooked</p>
                    <ul className="space-y-2">
                      {mealSuggestions.map((s) => (
                        <li key={s.id}>
                          <LoadingLink
                            href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-sm">{s.name}</p>
                              <p className="text-xs text-gray-400">
                                {s.daysSinceLastOrder === null
                                  ? "never cooked"
                                  : s.daysSinceLastOrder === 0
                                  ? "last cooked today"
                                  : s.daysSinceLastOrder === 1
                                  ? "last cooked yesterday"
                                  : `last cooked ${s.daysSinceLastOrder} days ago`}
                              </p>
                              <Tags tags={s.tags} className="mt-1" />
                            </div>
                            <span className="text-sm text-indigo-600 font-medium shrink-0 ml-4">Choose →</span>
                          </LoadingLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <LoadingLink
                href={`/add?date=${todayStr}`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Choose myself →
              </LoadingLink>
            </div>
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Last {days} nights</h2>
        <ul className="space-y-2">
          {pastDays.map((day) => {
            const dateStr = toDateStr(day);
            const dinners = dinnersByDate[dateStr] ?? [];
            return (
              <li
                key={dateStr}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400 font-medium">{formatDate(day)}</p>
                  <LoadingLink
                    href={`/add?date=${dateStr}`}
                    className="text-xs text-indigo-500 hover:text-indigo-700"
                  >
                    + Add
                  </LoadingLink>
                </div>
                {dinners.length === 0 ? (
                  <p className="text-sm text-gray-300">No dinner recorded</p>
                ) : (
                  dinners.map((dinner) => (
                    <div key={dinner.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {dinner.restaurant?.name ?? dinner.meal?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
                        </p>
                        {(dinner.restaurant?.notes ?? dinner.meal?.notes) && (
                          <p className="text-xs text-gray-400 mt-0.5">{dinner.restaurant?.notes ?? dinner.meal?.notes}</p>
                        )}
                        {dinner.notes && (
                          <p className="text-xs text-gray-400 mt-0.5">{dinner.notes}</p>
                        )}
                        <Tags tags={dinner.restaurant?.tags ?? dinner.meal?.tags ?? []} className="mt-1" />
                      </div>
                      <LoadingLink
                        href={`/add?id=${dinner.id}`}
                        className="text-xs text-gray-400 hover:text-indigo-600 shrink-0 ml-4"
                      >
                        Edit
                      </LoadingLink>
                    </div>
                  ))
                )}
              </li>
            );
          })}
        </ul>
        <div className="pt-3 text-center">
          <LoadingLink
            href={`/?days=${days + 14}`}
            scroll={false}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Load more
          </LoadingLink>
        </div>
      </section>
    </div>
  );
}
