export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { deleteDinner, type Suggestion } from "@/app/actions/dinners";
import { SubmitButton } from "@/components/SubmitButton";
import { LoadingLink } from "@/components/LoadingLink";
import { Tags } from "@/components/Tags";
import { SuggestionsList } from "@/app/SuggestionsList";

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

  const [recentDinners, restaurants, meals, scoringDinners] = await Promise.all([
    prisma.dinner.findMany({
      where: { date: { gte: since } },
      include: { restaurant: true, meal: true },
      orderBy: { date: "desc" },
    }),
    prisma.restaurant.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
    prisma.meal.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
    prisma.dinner.findMany({ orderBy: { date: "desc" } }),
  ]);

  // Score options by days since last use (capped at 21), pick top 3
  const now = Date.now();
  const lastUsed = new Map<string, number>();
  // Build id→tags and tag→days-since-last-order maps
  const entityTags = new Map<string, string[]>();
  for (const r of restaurants) entityTags.set(r.id, r.tags);
  for (const m of meals) entityTags.set(m.id, m.tags);

  const tagLastUsed = new Map<string, number>();
  for (const dinner of scoringDinners) {
    const key = (dinner.restaurantId ?? dinner.mealId)!;
    const daysSince = Math.floor((now - dinner.date.getTime()) / 86_400_000);
    if (!lastUsed.has(key) || lastUsed.get(key)! > daysSince) {
      lastUsed.set(key, daysSince);
    }
    for (const tag of entityTags.get(key) ?? []) {
      if (!tagLastUsed.has(tag) || tagLastUsed.get(tag)! > daysSince) {
        tagLastUsed.set(tag, daysSince);
      }
    }
  }

  function tagAwareScore(id: string, tags: string[]): number {
    const entityDays = lastUsed.get(id) ?? Infinity;
    const tagMinDays = tags.length > 0
      ? Math.min(...tags.map((tag) => tagLastUsed.get(tag) ?? Infinity))
      : Infinity;
    const base = Math.min(Math.min(entityDays, tagMinDays), 21);
    return base + Math.random() * 3; // noise keeps similar scores randomised
  }

  function pickTop<T extends { score: number; tagsWithRecency: { tag: string }[] }>(options: T[], n: number): T[] {
    const sorted = [...options].sort((a, b) => b.score - a.score);
    const tagCount = new Map<string, number>();
    const result: T[] = [];
    for (const option of sorted) {
      if (result.length >= n) break;
      if (option.tagsWithRecency.some(({ tag }) => (tagCount.get(tag) ?? 0) >= 2)) continue;
      result.push(option);
      for (const { tag } of option.tagsWithRecency) tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    }
    return result;
  }
  const restaurantCandidates = pickTop(
    restaurants.map((r) => ({ type: "RESTAURANT" as const, id: r.id, name: r.name, tagsWithRecency: r.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })), orderUrl: r.orderUrl, phoneNumber: r.phoneNumber, daysSinceLastOrder: lastUsed.get(r.id) ?? null, score: tagAwareScore(r.id, r.tags) })),
    8,
  );
  const mealCandidates = pickTop(
    meals.map((m) => ({ type: "HOMECOOKED" as const, id: m.id, name: m.name, tagsWithRecency: m.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })), orderUrl: null, phoneNumber: null, daysSinceLastOrder: lastUsed.get(m.id) ?? null, score: tagAwareScore(m.id, m.tags) })),
    5,
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
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-950 border-b border-indigo-100 dark:border-indigo-900 px-5 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-indigo-400 dark:text-indigo-300">Tonight</h2>
        </div>
        <div className="p-5">
        {todayDinners.length > 0 ? (
          <div className="space-y-3">
            {todayDinners.map((dinner) => (
              <div key={dinner.id} className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-semibold">
                    {dinner.restaurant?.name ?? dinner.meal?.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
                  </p>
                  {(dinner.restaurant?.notes ?? dinner.meal?.notes) && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{dinner.restaurant?.notes ?? dinner.meal?.notes}</p>
                  )}
                  {dinner.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dinner.notes}</p>
                  )}
                  <Tags tags={dinner.restaurant?.tags ?? dinner.meal?.tags ?? []} className="mt-1" />
                </div>
                <div className="flex gap-3 items-center shrink-0 ml-4">
                  {dinner.restaurant?.phoneNumber && (
                    <a href={`tel:${dinner.restaurant.phoneNumber}`} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Call</a>
                  )}
                  {dinner.restaurant?.orderUrl && (
                    <a href={dinner.restaurant.orderUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline">Order ↗</a>
                  )}
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
            <div className="flex gap-3 pt-1 border-t border-gray-100 dark:border-gray-700">
              <LoadingLink
                href={`/add?date=${todayStr}`}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Add another
              </LoadingLink>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {restaurantCandidates.length === 0 && mealCandidates.length === 0 ? (
              <p className="text-gray-500">No dinner set for tonight yet.</p>
            ) : (
              <SuggestionsList
                restaurantCandidates={restaurantCandidates}
                mealCandidates={mealCandidates}
                todayStr={todayStr}
              />
            )}
            <div className="flex gap-3">
              <LoadingLink
                href={`/add?date=${todayStr}`}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Choose myself →
              </LoadingLink>
            </div>
          </div>
        )}
        </div>
      </section>

      {/* Recent */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">Last {days} nights</h2>
        <ul className="space-y-2">
          {pastDays.map((day) => {
            const dateStr = toDateStr(day);
            const dinners = dinnersByDate[dateStr] ?? [];
            return (
              <li
                key={dateStr}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-3 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{formatDate(day)}</p>
                  <LoadingLink
                    href={`/add?date=${dateStr}`}
                    className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    + Add
                  </LoadingLink>
                </div>
                {dinners.length === 0 ? (
                  <p className="text-sm text-gray-300 dark:text-gray-600">No dinner recorded</p>
                ) : (
                  dinners.map((dinner) => (
                    <div key={dinner.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {dinner.restaurant?.name ?? dinner.meal?.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
                        </p>
                        {(dinner.restaurant?.notes ?? dinner.meal?.notes) && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{dinner.restaurant?.notes ?? dinner.meal?.notes}</p>
                        )}
                        {dinner.notes && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{dinner.notes}</p>
                        )}
                        <Tags tags={dinner.restaurant?.tags ?? dinner.meal?.tags ?? []} className="mt-1" />
                      </div>
                      <LoadingLink
                        href={`/add?id=${dinner.id}`}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 ml-4"
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
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Load more
          </LoadingLink>
        </div>
      </section>
    </div>
  );
}
