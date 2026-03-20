export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { LoadingLink } from "@/components/LoadingLink";

export default async function SuggestionsPage() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const [restaurants, meals, scoringDinners] = await Promise.all([
    prisma.restaurant.findMany({ orderBy: { name: "asc" } }),
    prisma.meal.findMany({ orderBy: { name: "asc" } }),
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
    if (!lastUsed.has(key) || lastUsed.get(key)! > daysSince) lastUsed.set(key, daysSince);
    for (const tag of entityTags.get(key) ?? []) {
      if (!tagLastUsed.has(tag) || tagLastUsed.get(tag)! > daysSince) tagLastUsed.set(tag, daysSince);
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

  function pickTop<T extends { score: number }>(options: T[], n: number) {
    return [...options].sort((a, b) => b.score - a.score).slice(0, n);
  }

  type TagWithRecency = { tag: string; daysSince: number | null };
  type Suggestion = {
    id: string; name: string; type: "RESTAURANT" | "HOMECOOKED";
    orderUrl: string | null; phoneNumber: string | null;
    daysSinceLastOrder: number | null; tagsWithRecency: TagWithRecency[]; score: number;
  };

  const restaurantSuggestions = pickTop<Suggestion>(
    restaurants.map((r) => ({
      id: r.id, name: r.name, type: "RESTAURANT" as const,
      orderUrl: r.orderUrl, phoneNumber: r.phoneNumber,
      daysSinceLastOrder: lastUsed.get(r.id) ?? null,
      tagsWithRecency: r.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })),
      score: tagAwareScore(r.id, r.tags),
    })),
    5,
  );

  const mealSuggestions = pickTop<Suggestion>(
    meals.map((m) => ({
      id: m.id, name: m.name, type: "HOMECOOKED" as const,
      orderUrl: null, phoneNumber: null,
      daysSinceLastOrder: lastUsed.get(m.id) ?? null,
      tagsWithRecency: m.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })),
      score: tagAwareScore(m.id, m.tags),
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
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <li key={s.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors">
            <LoadingLink
              href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`}
              className="flex-1 min-w-0"
            >
              <p className="font-medium text-sm">{s.name}</p>
              <p className="text-xs text-gray-400">{daysSinceLabel(s.daysSinceLastOrder, verb)}</p>
              {s.phoneNumber && (
                <p className="text-xs text-gray-400 mt-0.5">
                  <a href={`tel:${s.phoneNumber}`} className="hover:underline">{s.phoneNumber}</a>
                </p>
              )}
              {s.tagsWithRecency.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.tagsWithRecency.map(({ tag, daysSince }) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium">
                      {tag}
                      <span className="text-indigo-400 font-normal">
                        {daysSince === null ? "never" : daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince}d ago`}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </LoadingLink>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              {s.orderUrl && (
                <a href={s.orderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">
                  Order ↗
                </a>
              )}
              <LoadingLink href={`/add?date=${todayStr}&suggestedId=${s.id}&type=${s.type}`} className="text-sm text-indigo-600 font-medium">
                Choose →
              </LoadingLink>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Suggestions</h1>

      {restaurantSuggestions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Restaurants</h2>
          <SuggestionList suggestions={restaurantSuggestions} verb="ordered" />
        </section>
      )}

      {mealSuggestions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Homecooked</h2>
          <SuggestionList suggestions={mealSuggestions} verb="cooked" />
        </section>
      )}

      {restaurantSuggestions.length === 0 && mealSuggestions.length === 0 && (
        <p className="text-gray-400 text-sm">No restaurants or meals added yet.</p>
      )}
    </div>
  );
}
