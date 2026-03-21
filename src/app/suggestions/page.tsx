export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { computeLastUsed, tagAwareScore, pickTop } from "@/lib/scoring";
import type { Suggestion } from "@/app/actions/dinners";
import { SuggestionsContent } from "./SuggestionsContent";

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
    8,
  );

  const mealSuggestions = pickTop<Suggestion>(
    meals.map((m) => ({
      id: m.id, name: m.name, type: "HOMECOOKED" as const,
      orderUrl: null, phoneNumber: null,
      daysSinceLastOrder: lastUsed.get(m.id) ?? null,
      tagsWithRecency: m.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })),
      score: tagAwareScore(m.id, m.tags, lastUsed, tagLastUsed),
    })),
    5,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-unica)] text-2xl text-fg">Suggestions</h1>
        <hr className="border-0 border-b-[3px] border-dashed border-pink w-1/4 mt-1" />
      </div>

      <SuggestionsContent
        restaurantCandidates={restaurantSuggestions}
        mealCandidates={mealSuggestions}
        todayStr={todayStr}
      />
    </div>
  );
}
