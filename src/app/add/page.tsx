export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { AddDinnerForm } from "./AddDinnerForm";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; date?: string; type?: string; suggestedId?: string }>;
}) {
  const { id, date, type, suggestedId } = await searchParams;

  const todayStr = new Date().toISOString().split("T")[0];

  const [restaurants, meals] = await Promise.all([
    prisma.restaurant.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
    prisma.meal.findMany({ where: { hidden: false }, orderBy: { name: "asc" } }),
  ]);

  // Edit mode: existing dinner by id
  if (id) {
    const dinner = await prisma.dinner.findUnique({ where: { id } });
    const resolvedDate = dinner ? dinner.date.toISOString().split("T")[0] : todayStr;
    const initialType = (type as "RESTAURANT" | "HOMECOOKED") ?? dinner?.type ?? "RESTAURANT";
    const initialSelectedId = suggestedId ?? dinner?.restaurantId ?? dinner?.mealId ?? null;

    return (
      <AddDinnerForm
        date={resolvedDate}
        dinnerId={id}
        restaurants={restaurants}
        meals={meals}
        initialType={initialType}
        initialSelectedId={initialSelectedId}
        existingNotes={dinner?.notes ?? null}
      />
    );
  }

  // Create mode: new dinner for a date
  const resolvedDate = date ?? todayStr;

  return (
    <AddDinnerForm
      date={resolvedDate}
      dinnerId={null}
      restaurants={restaurants}
      meals={meals}
      initialType={(type as "RESTAURANT" | "HOMECOOKED") ?? "RESTAURANT"}
      initialSelectedId={suggestedId ?? null}
      existingNotes={null}
    />
  );
}
