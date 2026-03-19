"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function createMeal(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  await prisma.meal.create({
    data: {
      name,
      notes: (formData.get("notes") as string)?.trim() || null,
    },
  });

  revalidatePath("/meals");
}

export async function createMealAndReturn(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const returnDate = formData.get("returnDate") as string;
  if (!name) return;

  await prisma.meal.create({
    data: { name },
  });

  revalidatePath("/meals");
  redirect(`/add?date=${returnDate}&type=HOMECOOKED`);
}

export async function deleteMeal(id: string) {
  await prisma.meal.delete({ where: { id } });
  revalidatePath("/meals");
}
