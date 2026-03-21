export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { computeLastUsed, tagAwareScore, pickTop } from "@/lib/scoring";
import type { Suggestion } from "@/app/actions/dinners";
import { LoadingLink } from "@/components/LoadingLink";

export default async function SuggestionsPage() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const [restaurants, meals, scoringDinners] = await Promise.all([
    prisma.restaurant.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
    prisma.meal.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
    prisma.dinner.findMany({ orderBy: { date: "desc" } }),
  ]);

  const entityTags = new Map<string, string[]>();
  for (const r of restaurants) entityTags.set(r.id, r.tags);
  for (const m of meals) entityTags.set(m.id, m.tags);

  const { lastUsed, tagLastUsed } = computeLastUsed(scoringDinners, entityTags);

  const restaurantSuggestions = pickTop<Suggestion>(
    restaurants.map((r) => ({
      id: r.id, name: r.name, type: "RESTAURANT" as const,
      orderUrl: r.orderUrl, phoneNumber: r.phoneNumber,
      daysSinceLastOrder: lastUsed.get(r.id) ?? null,
      tagsWithRecency: r.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })),
      score: tagAwareScore(r.id, r.tags, lastUsed, tagLastUsed),
    })),
    5,
  );

  const mealSuggestions = pickTop<Suggestion>(
    meals.map((m) => ({
      id: m.id, name: m.name, type: "HOMECOOKED" as const,
      orderUrl: null, phoneNumber: null,
      daysSinceLastOrder: lastUsed.get(m.id) ?? null,
      tagsWithRecency: m.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })),
      score: tagAwareScore(m.id, m.tags, lastUsed, tagLastUsed),
    })),
    3,
  );

  function daysSinceLabel(n: number | null, verb: "ordered" | "cooked") {
    if (n === null) return `never ${verb}`;
    if (n === 0) return `last ${verb} today`;
    if (n === 1) return `last ${verb} yesterday`;
    return `last ${verb} ${n} days ago`;
  }

  function SuggestionList({ suggestions, verb }: { suggestions: Suggestion[]; verb: "ordered" | "cooked" }) {
    return (
      <ul>
        {suggestions.map((s) => (
          <li key={s.id} className="border-b border-dashed border-muted/30 py-3 flex items-center justify-between group hover:bg-surface/50 -mx-2 px-2 rounded transition-colors duration-150">
            <LoadingLink
              href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
              className="flex-1 min-w-0"
            >
              <p className="text-sm text-fg">{s.name}</p>
              <p className="text-xs text-muted">{daysSinceLabel(s.daysSinceLastOrder, verb)}</p>
              {s.tagsWithRecency.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {s.tagsWithRecency.map(({ tag, daysSince }) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal/15 text-teal rounded text-xs">
                      #{tag}
                      <span className="text-muted text-[10px]">
                        {daysSince === null ? "never" : daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince}d`}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </LoadingLink>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              {s.phoneNumber && (
                <a href={`tel:${s.phoneNumber}`} className="text-xs text-muted hover:text-pink transition-colors">Call</a>
              )}
              {s.orderUrl && (
                <a href={s.orderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal hover:text-fg transition-colors">
                  Order ↗
                </a>
              )}
              <LoadingLink href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`} className="text-sm text-pink hover:text-fg font-[family-name:var(--font-unica)] transition-colors">
                Pick →
              </LoadingLink>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-unica)] text-2xl text-fg">Suggestions</h1>
        <hr className="border-0 border-b-[3px] border-dashed border-pink w-1/4 mt-1" />
      </div>

      {restaurantSuggestions.length > 0 && (
        <section className="space-y-1">
          <p className="font-[family-name:var(--font-unica)] text-sm text-muted">Restaurants</p>
          <SuggestionList suggestions={restaurantSuggestions} verb="ordered" />
        </section>
      )}

      {mealSuggestions.length > 0 && (
        <section className="space-y-1">
          <p className="font-[family-name:var(--font-unica)] text-sm text-muted">Homecooked</p>
          <SuggestionList suggestions={mealSuggestions} verb="cooked" />
        </section>
      )}

      {restaurantSuggestions.length === 0 && mealSuggestions.length === 0 && (
        <p className="text-muted text-sm">No restaurants or meals added yet.</p>
      )}
    </div>
  );
}
