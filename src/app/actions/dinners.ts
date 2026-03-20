"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DinnerType } from "@/generated/prisma/enums";
import { computeLastUsed, tagAwareScore, pickTop, pickBest } from "@/lib/scoring";

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

  const entityTags = new Map<string, string[]>();
  for (const r of restaurants) entityTags.set(r.id, r.tags);
  for (const m of meals) entityTags.set(m.id, m.tags);

  const { lastUsed, tagLastUsed } = computeLastUsed(scoringDinners, entityTags);

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
        score: tagAwareScore(r.id, r.tags, lastUsed, tagLastUsed),
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
        score: tagAwareScore(m.id, m.tags, lastUsed, tagLastUsed),
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

  const entityTags = new Map<string, string[]>();
  for (const r of restaurants) entityTags.set(r.id, r.tags);
  for (const m of meals) entityTags.set(m.id, m.tags);
  const { lastUsed } = computeLastUsed(recentDinners, entityTags);

  type Option = { type: DinnerType; id: string; score: number };
  const options: Option[] = [
    ...restaurants.map((r) => ({
      type: "RESTAURANT" as DinnerType,
      id: r.id,
      score: Math.min(lastUsed.get(r.id) ?? 21, 21),
    })),
    ...meals.map((m) => ({
      type: "HOMECOOKED" as DinnerType,
      id: m.id,
      score: Math.min(lastUsed.get(m.id) ?? 21, 21),
    })),
  ];

  const pick = pickBest(options);
  if (!pick) {
    redirect(`/add?date=${date}`);
  }

  redirect(`/add?date=${date}&suggestedId=${pick.id}&type=${pick.type}`);
}
