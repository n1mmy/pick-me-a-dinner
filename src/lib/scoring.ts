export function buildEntityTags(
  restaurants: { id: string; tags: string[] }[],
  meals: { id: string; tags: string[] }[]
): Map<string, string[]> {
  const entityTags = new Map<string, string[]>();
  for (const r of restaurants) entityTags.set(r.id, r.tags);
  for (const m of meals) entityTags.set(m.id, m.tags);
  return entityTags;
}

export type ScoredOption = {
  score: number;
  tagsWithRecency: { tag: string }[];
};

/**
 * Build lastUsed and tagLastUsed maps from a list of dinners.
 * Each map stores the minimum days-since value seen for that key.
 */
export function computeLastUsed(
  dinners: { date: Date; restaurantId: string | null; mealId: string | null }[],
  entityTags: Map<string, string[]>,
  now = Date.now()
): { lastUsed: Map<string, number>; tagLastUsed: Map<string, number> } {
  const lastUsed = new Map<string, number>();
  const tagLastUsed = new Map<string, number>();

  for (const dinner of dinners) {
    const key = (dinner.restaurantId ?? dinner.mealId)!;
    const daysSince = Math.floor((now - dinner.date.getTime()) / 86_400_000);
    if (!lastUsed.has(key) || lastUsed.get(key)! > daysSince) lastUsed.set(key, daysSince);
    for (const tag of entityTags.get(key) ?? []) {
      if (!tagLastUsed.has(tag) || tagLastUsed.get(tag)! > daysSince) tagLastUsed.set(tag, daysSince);
    }
  }

  return { lastUsed, tagLastUsed };
}

/**
 * Score an entity using both entity recency and tag recency, capped at 21.
 * A random jitter of up to 3 is added for tie-breaking.
 */
export function tagAwareScore(
  id: string,
  tags: string[],
  lastUsed: Map<string, number>,
  tagLastUsed: Map<string, number>
): number {
  const entityDays = lastUsed.get(id) ?? Infinity;
  const tagMinDays =
    tags.length > 0 ? Math.min(...tags.map((t) => tagLastUsed.get(t) ?? Infinity)) : Infinity;
  return Math.min(Math.min(entityDays, tagMinDays), 21) + Math.random() * 3;
}

/**
 * Pick up to n options from a sorted list, enforcing a max of 2 options per tag.
 */
export function pickTop<T extends ScoredOption>(options: T[], n: number): T[] {
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

/**
 * Score options by days since last use (capped at 21, defaulting to 21 if never used),
 * then return one random pick from the highest-scoring tier.
 */
export function pickBest<T extends { id: string; score: number }>(options: T[]): T | null {
  if (options.length === 0) return null;
  const maxScore = Math.max(...options.map((o) => o.score));
  const best = options.filter((o) => o.score === maxScore);
  return best[Math.floor(Math.random() * best.length)];
}
