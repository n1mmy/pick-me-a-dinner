export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { deleteDinner } from "@/app/actions/dinners";
import type { Suggestion } from "@/app/actions/dinners";
import { buildEntityTags, computeLastUsed, tagAwareScore, pickTop } from "@/lib/scoring";
import { toDateStr, localTodayUTC, formatDate } from "@/lib/dates";
import { DeleteButton } from "@/components/DeleteButton";
import { LoadingLink } from "@/components/LoadingLink";
import { Tags } from "@/components/Tags";
import { SuggestionsList } from "@/app/SuggestionsList";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; tag?: string }>;
}) {
  const { days: daysParam, tag: tagParam } = await searchParams;
  const days = Math.max(14, parseInt(daysParam ?? "14", 10));
  const activeTag = tagParam?.trim() || null;

  // today is midnight UTC for the local date (TZ env var controls the timezone).
  const today = localTodayUTC();
  const todayStr = toDateStr(today);

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
    prisma.dinner.findMany({
      where: { date: { gte: new Date(today.getTime() - 90 * 86_400_000) } },
      orderBy: { date: "desc" },
    }),
  ]);

  const entityTags = buildEntityTags(restaurants, meals);
  const { lastUsed, tagLastUsed } = computeLastUsed(scoringDinners, entityTags);

  const lastNotesMap = new Map<string, string>();
  for (const d of scoringDinners) {
    const entityId = d.restaurantId ?? d.mealId;
    if (entityId && !lastNotesMap.has(entityId) && d.notes) {
      lastNotesMap.set(entityId, d.notes);
    }
  }

  const restaurantCandidates = pickTop<Suggestion>(
    restaurants.map((r) => ({
      type: "RESTAURANT" as const,
      id: r.id,
      name: r.name,
      tagsWithRecency: r.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })),
      orderUrl: r.orderUrl,
      phoneNumber: r.phoneNumber,
      daysSinceLastOrder: lastUsed.get(r.id) ?? null,
      score: tagAwareScore(r.id, r.tags, lastUsed, tagLastUsed),
      entityNotes: r.notes ?? null,
      lastNotes: lastNotesMap.get(r.id) ?? null,
    })),
    8,
  );
  const mealCandidates = pickTop<Suggestion>(
    meals.map((m) => ({
      type: "HOMECOOKED" as const,
      id: m.id,
      name: m.name,
      tagsWithRecency: m.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })),
      orderUrl: null,
      phoneNumber: null,
      daysSinceLastOrder: lastUsed.get(m.id) ?? null,
      score: tagAwareScore(m.id, m.tags, lastUsed, tagLastUsed),
      entityNotes: m.notes ?? null,
      lastNotes: lastNotesMap.get(m.id) ?? null,
    })),
    5,
  );

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
        <h2 className="font-display text-3xl text-fg mb-1">Tonight</h2>
        <hr className="border-0 border-b-[3px] border-dashed border-pink w-1/3 mb-6" />

        {todayDinners.length > 0 ? (
          <div className="space-y-4">
            {todayDinners.map((dinner) => (
              <div key={dinner.id} className="flex items-start justify-between border-b border-dashed border-muted/40 pb-4">
                <div>
                  <p className="font-display text-xl text-fg">
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
                <div className="flex gap-1 items-center shrink-0 ml-3 text-sm">
                  {dinner.restaurant?.phoneNumber && (
                    <a
                      href={`tel:${dinner.restaurant.phoneNumber}`}
                      aria-label={`Call ${dinner.restaurant.name}`}
                      className="min-h-11 inline-flex items-center px-2 text-muted hover:text-pink transition-colors"
                    >
                      Call
                    </a>
                  )}
                  {dinner.restaurant?.orderUrl && (
                    <a
                      href={dinner.restaurant.orderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Order from ${dinner.restaurant.name} (opens in new tab)`}
                      className="min-h-11 inline-flex items-center px-2 text-teal hover:text-fg transition-colors"
                    >
                      Order ↗
                    </a>
                  )}
                  <LoadingLink
                    href={`/add?id=${dinner.id}`}
                    aria-label="Edit tonight's dinner"
                    className="min-h-11 inline-flex items-center px-2 text-teal hover:text-fg transition-colors"
                  >
                    Edit
                  </LoadingLink>
                  <DeleteButton
                    action={async () => {
                      "use server";
                      await deleteDinner(dinner.id);
                      return undefined;
                    }}
                    className="min-h-11 inline-flex items-center px-2 text-pink/70 hover:text-pink transition-colors cursor-pointer"
                    armedClassName="min-h-11 inline-flex items-center px-2 text-white bg-pink rounded transition-colors cursor-pointer animate-pulse"
                    confirmLabel="Tap to undo"
                  >
                    Delete
                  </DeleteButton>
                </div>
              </div>
            ))}
            <LoadingLink
              href={`/add?date=${todayStr}`}
              className="min-h-11 inline-flex items-center text-sm text-teal hover:text-fg transition-colors"
            >
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
                activeTag={activeTag}
              />
            )}
            <LoadingLink
              href={`/add?date=${todayStr}`}
              className="self-start min-h-11 inline-flex items-center px-3 py-1 border border-pink text-pink rounded text-sm font-display hover:bg-pink hover:text-bg transition-colors"
            >
              Choose myself →
            </LoadingLink>
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <h2 className="font-display text-xl text-muted mb-4">Last {days} nights</h2>
        <div className="space-y-0">
          {pastDays.map((day) => {
            const dateStr = toDateStr(day);
            const dinners = dinnersByDate[dateStr] ?? [];
            const isEmpty = dinners.length === 0;
            return (
              <div key={dateStr} className="border-b border-dashed border-muted/30">
                {isEmpty ? (
                  <LoadingLink
                    href={`/add?date=${dateStr}`}
                    aria-label={`Add dinner for ${formatDate(day)}`}
                    className="flex justify-between items-center py-3 group hover:bg-surface-raised -mx-2 px-2 rounded transition-colors min-h-11"
                  >
                    <p className="font-mono text-sm text-muted">{formatDate(day)}</p>
                    <span className="text-xs text-muted/60 group-hover:text-teal transition-colors">
                      + Add
                    </span>
                  </LoadingLink>
                ) : (
                  <div className="py-3">
                    <div className="flex justify-between items-baseline">
                      <p className="font-mono text-sm text-muted">{formatDate(day)}</p>
                      <LoadingLink
                        href={`/add?date=${dateStr}`}
                        aria-label={`Add another dinner for ${formatDate(day)}`}
                        className="min-h-11 inline-flex items-center px-2 text-xs text-teal hover:text-pink transition-colors"
                      >
                        + Add
                      </LoadingLink>
                    </div>
                    {dinners.map((dinner) => (
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
                        <LoadingLink
                          href={`/add?id=${dinner.id}`}
                          aria-label={`Edit ${dinner.restaurant?.name ?? dinner.meal?.name} on ${formatDate(day)}`}
                          className="min-h-11 inline-flex items-center px-2 text-xs text-muted hover:text-pink shrink-0 ml-3 transition-colors"
                        >
                          Edit
                        </LoadingLink>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="pt-4 text-center">
          <LoadingLink
            href={`/?days=${days + 14}`}
            scroll={false}
            className="min-h-11 inline-flex items-center px-4 text-sm text-muted hover:text-pink transition-colors"
          >
            Load more
          </LoadingLink>
        </div>
      </section>
    </div>
  );
}
