export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { AddDinnerForm } from "./AddDinnerForm";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; type?: string; suggestedId?: string }>;
}) {
  const { date, type, suggestedId } = await searchParams;

  const todayStr = new Date().toISOString().split("T")[0];
  const resolvedDate = date ?? todayStr;

  const [restaurants, meals, existing] = await Promise.all([
    prisma.restaurant.findMany({ orderBy: { name: "asc" } }),
    prisma.meal.findMany({ orderBy: { name: "asc" } }),
    prisma.dinner.findFirst({
      where: { date: new Date(resolvedDate + "T00:00:00.000Z") },
      include: { restaurant: true, meal: true },
    }),
  ]);

  const initialType =
    (type as "RESTAURANT" | "HOMECOOKED") ??
    existing?.type ??
    "RESTAURANT";

  const initialSelectedId =
    suggestedId ??
    existing?.restaurantId ??
    existing?.mealId ??
    null;

  return (
    <AddDinnerForm
      date={resolvedDate}
      restaurants={restaurants}
      meals={meals}
      initialType={initialType}
      initialSelectedId={initialSelectedId}
      existingNotes={existing?.notes ?? null}
    />
  );
}
