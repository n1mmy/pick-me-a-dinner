"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DinnerType } from "@/generated/prisma/enums";

export type TagWithRecency = { tag: string; daysSince: number | null };
export type Suggestion = {
  type: "RESTAURANT" | "HOMECOOKED";
  id: string;
  name: string;
  tagsWithRecency: TagWithRecency[];
  orderUrl: string | null;
  phoneNumber: string | null;
  daysSinceLastOrder: number | null;
  score: number;
};

export async function fetchMoreSuggestions(
  excludedIds: string[]
): Promise<{ restaurantCandidates: Suggestion[]; mealCandidates: Suggestion[] }> {
  const [scoringDinners, restaurants, meals] = await Promise.all([
    prisma.dinner.findMany({ orderBy: { date: "desc" } }),
    prisma.restaurant.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
    prisma.meal.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
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
    const tagMinDays = tags.length > 0 ? Math.min(...tags.map((t) => tagLastUsed.get(t) ?? Infinity)) : Infinity;
    return Math.min(Math.min(entityDays, tagMinDays), 21) + Math.random() * 3;
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
    restaurants
      .filter((r) => !excludedIds.includes(r.id))
      .map((r) => ({
        type: "RESTAURANT" as const,
        id: r.id,
        name: r.name,
        tagsWithRecency: r.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })),
        orderUrl: r.orderUrl,
        phoneNumber: r.phoneNumber,
        daysSinceLastOrder: lastUsed.get(r.id) ?? null,
        score: tagAwareScore(r.id, r.tags),
      })),
    8,
  );

  const mealCandidates = pickTop(
    meals
      .filter((m) => !excludedIds.includes(m.id))
      .map((m) => ({
        type: "HOMECOOKED" as const,
        id: m.id,
        name: m.name,
        tagsWithRecency: m.tags.map((tag) => ({ tag, daysSince: tagLastUsed.get(tag) ?? null })),
        orderUrl: null,
        phoneNumber: null,
        daysSinceLastOrder: lastUsed.get(m.id) ?? null,
        score: tagAwareScore(m.id, m.tags),
      })),
    5,
  );

  return { restaurantCandidates, mealCandidates };
}

export async function createDinner(formData: FormData) {
  const date = formData.get("date") as string;
  const type = formData.get("type") as DinnerType;
  const restaurantId = (formData.get("restaurantId") as string) || null;
  const mealId = (formData.get("mealId") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  await prisma.dinner.create({
    data: {
      date: new Date(date + "T00:00:00.000Z"),
      type,
      restaurantId: type === "RESTAURANT" ? restaurantId : null,
      mealId: type === "HOMECOOKED" ? mealId : null,
      notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/history");
  redirect("/");
}

export async function updateDinner(formData: FormData) {
  const id = formData.get("id") as string;
  const type = formData.get("type") as DinnerType;
  const restaurantId = (formData.get("restaurantId") as string) || null;
  const mealId = (formData.get("mealId") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  await prisma.dinner.update({
    where: { id },
    data: {
      type,
      restaurantId: type === "RESTAURANT" ? restaurantId : null,
      mealId: type === "HOMECOOKED" ? mealId : null,
      notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/history");
  redirect("/");
}

export async function deleteDinner(id: string) {
  await prisma.dinner.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function pickAndRedirect(formData: FormData) {
  const date = formData.get("date") as string;

  const since = new Date();
  since.setDate(since.getDate() - 21);

  const [recentDinners, restaurants, meals] = await Promise.all([
    prisma.dinner.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "desc" },
    }),
    prisma.restaurant.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
    prisma.meal.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
  ]);

  const now = Date.now();
  const lastUsed = new Map<string, number>();
  for (const dinner of recentDinners) {
    const key = (dinner.restaurantId ?? dinner.mealId)!;
    const daysSince = Math.floor((now - dinner.date.getTime()) / 86_400_000);
    if (!lastUsed.has(key) || lastUsed.get(key)! > daysSince) {
      lastUsed.set(key, daysSince);
    }
  }

  type Option = { type: DinnerType; id: string; score: number };
  const options: Option[] = [
    ...restaurants.map((r) => ({
      type: "RESTAURANT" as DinnerType,
      id: r.id,
      score: lastUsed.get(r.id) ?? 21,
    })),
    ...meals.map((m) => ({
      type: "HOMECOOKED" as DinnerType,
      id: m.id,
      score: lastUsed.get(m.id) ?? 21,
    })),
  ];

  if (options.length === 0) {
    redirect(`/add?date=${date}`);
  }

  const maxScore = Math.max(...options.map((o) => o.score));
  const best = options.filter((o) => o.score === maxScore);
  const pick = best[Math.floor(Math.random() * best.length)];

  redirect(`/add?date=${date}&suggestedId=${pick.id}&type=${pick.type}`);
}
