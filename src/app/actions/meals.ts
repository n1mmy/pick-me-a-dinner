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

  await prisma.meal.create({
    data: { name, notes, tags },
  });

  revalidatePath("/meals");
}

export async function createMealAndReturn(formData: FormData) {
  const { name, notes, tags, returnDate, returnDinnerId } = parseFormData(
    createMealAndReturnSchema,
    formData
  );

  const meal = await prisma.meal.create({
    data: { name, notes, tags },
  });

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

  await prisma.meal.update({
    where: { id },
    data: { name, notes, tags },
  });

  revalidatePath("/meals");
}

export async function deleteMeal(id: string) {
  idSchema.parse(id);
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
