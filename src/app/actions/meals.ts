"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function parseTags(formData: FormData): string[] {
  return ((formData.get("tags") as string) ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createMeal(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  await prisma.meal.create({
    data: {
      name,
      notes: (formData.get("notes") as string)?.trim() || null,
      tags: parseTags(formData),
    },
  });

  revalidatePath("/meals");
}

export async function createMealAndReturn(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const returnDate = formData.get("returnDate") as string;
  const returnDinnerId = (formData.get("returnDinnerId") as string) || null;
  if (!name) return;

  const meal = await prisma.meal.create({
    data: {
      name,
      notes: (formData.get("notes") as string)?.trim() || null,
      tags: parseTags(formData),
    },
  });

  revalidatePath("/meals");
  if (returnDinnerId) {
    redirect(`/add?id=${returnDinnerId}&suggestedId=${meal.id}&type=HOMECOOKED`);
  }
  redirect(`/add?date=${returnDate}&suggestedId=${meal.id}&type=HOMECOOKED`);
}

export async function updateMeal(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  await prisma.meal.update({
    where: { id },
    data: {
      name,
      notes: (formData.get("notes") as string)?.trim() || null,
      tags: parseTags(formData),
    },
  });

  revalidatePath("/meals");
}

export async function deleteMeal(id: string) {
  await prisma.meal.delete({ where: { id } });
  revalidatePath("/meals");
}

export async function hideMeal(id: string) {
  await prisma.meal.update({ where: { id }, data: { hidden: true } });
  revalidatePath("/meals");
}

export async function unhideMeal(id: string) {
  await prisma.meal.update({ where: { id }, data: { hidden: false } });
  revalidatePath("/meals");
}
