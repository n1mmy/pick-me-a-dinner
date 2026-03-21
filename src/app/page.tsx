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

  const now = Date.now();
  const lastUsed = new Map<string, number>();
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
    return base + Math.random() * 3;
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

  const dinnersByDate: Record<string, typeof recentDinners> = {};
  for (const d of recentDinners) {
    const key = toDateStr(d.date);
    (dinnersByDate[key] ??= []).push(d);
  }
  const todayDinners = dinnersByDate[todayStr] ?? [];

  const pastDays = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (i + 1));
    return d;
  });

  return (
    <div className="space-y-8">
      {/* Tonight */}
      <section>
        <h2 className="font-[family-name:var(--font-unica)] text-3xl text-fg mb-1">Tonight</h2>
        <hr className="border-0 border-b-[3px] border-dashed border-pink w-1/3 mb-6" />

        {todayDinners.length > 0 ? (
          <div className="space-y-4">
            {todayDinners.map((dinner) => (
              <div key={dinner.id} className="flex items-start justify-between border-b border-dashed border-muted/40 pb-4">
                <div>
                  <p className="font-[family-name:var(--font-unica)] text-xl text-fg">
                    {dinner.restaurant?.name ?? dinner.meal?.name}
                  </p>
                  <p className="text-sm text-muted">
                    {dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}
                  </p>
                  {(dinner.restaurant?.notes ?? dinner.meal?.notes) && (
                    <p className="text-sm text-muted mt-1 italic">{dinner.restaurant?.notes ?? dinner.meal?.notes}</p>
                  )}
                  {dinner.notes && (
                    <p className="text-sm text-fg/70 mt-1">{dinner.notes}</p>
                  )}
                  <Tags tags={dinner.restaurant?.tags ?? dinner.meal?.tags ?? []} className="mt-2" />
                </div>
                <div className="flex gap-3 items-center shrink-0 ml-4 text-sm">
                  {dinner.restaurant?.phoneNumber && (
                    <a href={`tel:${dinner.restaurant.phoneNumber}`} className="text-muted hover:text-pink transition-colors">Call</a>
                  )}
                  {dinner.restaurant?.orderUrl && (
                    <a href={dinner.restaurant.orderUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:text-fg transition-colors">Order ↗</a>
                  )}
                  <LoadingLink href={`/add?id=${dinner.id}`} className="text-teal hover:text-fg transition-colors">
                    Edit
                  </LoadingLink>
                  <form action={async () => { "use server"; await deleteDinner(dinner.id); }}>
                    <SubmitButton className="text-pink/60 hover:text-pink transition-colors">Delete</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
            <LoadingLink href={`/add?date=${todayStr}`} className="inline-block text-sm text-teal hover:text-fg transition-colors">
              + Add another
            </LoadingLink>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {restaurantCandidates.length === 0 && mealCandidates.length === 0 ? (
              <p className="text-muted">No dinner set for tonight yet.</p>
            ) : (
              <SuggestionsList
                restaurantCandidates={restaurantCandidates}
                mealCandidates={mealCandidates}
                todayStr={todayStr}
              />
            )}
            <LoadingLink href={`/add?date=${todayStr}`} className="text-sm text-muted hover:text-pink transition-colors">
              Choose myself →
            </LoadingLink>
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <h2 className="font-[family-name:var(--font-unica)] text-xl text-muted mb-4">Last {days} nights</h2>
        <div className="space-y-0">
          {pastDays.map((day) => {
            const dateStr = toDateStr(day);
            const dinners = dinnersByDate[dateStr] ?? [];
            return (
              <div key={dateStr} className="border-b border-dashed border-muted/30 py-3">
                <div className="flex justify-between items-baseline">
                  <p className="font-[family-name:var(--font-unica)] text-sm text-muted">{formatDate(day)}</p>
                  <LoadingLink href={`/add?date=${dateStr}`} className="text-xs text-teal hover:text-pink transition-colors">
                    + Add
                  </LoadingLink>
                </div>
                {dinners.length === 0 ? (
                  <p className="text-sm text-muted/40 mt-1">No dinner recorded</p>
                ) : (
                  dinners.map((dinner) => (
                    <div key={dinner.id} className="flex justify-between items-start mt-1">
                      <div>
                        <p className="text-sm text-fg">{dinner.restaurant?.name ?? dinner.meal?.name}</p>
                        <p className="text-xs text-muted">{dinner.type === "RESTAURANT" ? "Restaurant" : "Homecooked"}</p>
                        {(dinner.restaurant?.notes ?? dinner.meal?.notes) && (
                          <p className="text-xs text-muted mt-0.5 italic">{dinner.restaurant?.notes ?? dinner.meal?.notes}</p>
                        )}
                        {dinner.notes && (
                          <p className="text-xs text-fg/60 mt-0.5">{dinner.notes}</p>
                        )}
                        <Tags tags={dinner.restaurant?.tags ?? dinner.meal?.tags ?? []} className="mt-1" />
                      </div>
                      <LoadingLink href={`/add?id=${dinner.id}`} className="text-xs text-muted hover:text-pink shrink-0 ml-4 transition-colors">
                        Edit
                      </LoadingLink>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
        <div className="pt-4 text-center">
          <LoadingLink href={`/?days=${days + 14}`} scroll={false} className="text-sm text-muted hover:text-pink transition-colors">
            Load more
          </LoadingLink>
        </div>
      </section>
    </div>
  );
}
