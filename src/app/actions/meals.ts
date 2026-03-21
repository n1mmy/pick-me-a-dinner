"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createMealSchema,
  createMealAndReturnSchema,
  updateMealSchema,
  idSchema,
  parseFormData,
} from "@/lib/validation";

export async function createMeal(formData: FormData) {
  const { name, notes, tags } = parseFormData(createMealSchema, formData);

  try {
    await prisma.meal.create({
      data: { name, notes, tags },
    });
  } catch {
    throw new Error("Failed to save meal. Please try again.");
  }

  revalidatePath("/meals");
}

export async function createMealAndReturn(formData: FormData) {
  const { name, notes, tags, returnDate, returnDinnerId } = parseFormData(
    createMealAndReturnSchema,
    formData
  );

  let meal;
  try {
    meal = await prisma.meal.create({
      data: { name, notes, tags },
    });
  } catch {
    throw new Error("Failed to save meal. Please try again.");
  }

  revalidatePath("/meals");
  if (returnDinnerId) {
    redirect(
      `/add?id=${returnDinnerId}&suggestedId=${meal.id}&type=HOMECOOKED`
    );
  }
  redirect(`/add?date=${returnDate}&suggestedId=${meal.id}&type=HOMECOOKED`);
}

export async function updateMeal(formData: FormData) {
  const { id, name, notes, tags } = parseFormData(updateMealSchema, formData);

  try {
    await prisma.meal.update({
      where: { id },
      data: { name, notes, tags },
    });
  } catch {
    throw new Error("Failed to update meal. Please try again.");
  }

  revalidatePath("/meals");
}

export async function deleteMeal(id: string): Promise<{ error: string } | undefined> {
  idSchema.parse(id);
  const count = await prisma.dinner.count({ where: { mealId: id } });
  if (count > 0) return { error: "Cannot delete a meal that has dinner history" };
  await prisma.meal.delete({ where: { id } });
  revalidatePath("/meals");
}

export async function hideMeal(id: string) {
  idSchema.parse(id);
  await prisma.meal.update({ where: { id }, data: { hidden: true } });
  revalidatePath("/meals");
}

export async function unhideMeal(id: string) {
  idSchema.parse(id);
  await prisma.meal.update({ where: { id }, data: { hidden: false } });
  revalidatePath("/meals");
}
