"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DinnerType } from "@/generated/prisma/enums";

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
