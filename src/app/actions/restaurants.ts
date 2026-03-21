"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createRestaurantSchema,
  createRestaurantAndReturnSchema,
  updateRestaurantSchema,
  idSchema,
  parseFormData,
} from "@/lib/validation";

export async function createRestaurant(formData: FormData) {
  const { name, orderUrl, menuUrl, phoneNumber, notes, tags } = parseFormData(
    createRestaurantSchema,
    formData
  );

  try {
    await prisma.restaurant.create({
      data: { name, orderUrl, menuUrl, phoneNumber, notes, tags },
    });
  } catch {
    throw new Error("Failed to save restaurant. Please try again.");
  }

  revalidatePath("/restaurants");
}

export async function createRestaurantAndReturn(formData: FormData) {
  const { name, orderUrl, menuUrl, phoneNumber, tags, returnDate, returnDinnerId } =
    parseFormData(createRestaurantAndReturnSchema, formData);

  let restaurant;
  try {
    restaurant = await prisma.restaurant.create({
      data: { name, orderUrl, menuUrl, phoneNumber, tags },
    });
  } catch {
    throw new Error("Failed to save restaurant. Please try again.");
  }

  revalidatePath("/restaurants");
  if (returnDinnerId) {
    redirect(
      `/add?id=${returnDinnerId}&suggestedId=${restaurant.id}&type=RESTAURANT`
    );
  }
  redirect(
    `/add?date=${returnDate}&suggestedId=${restaurant.id}&type=RESTAURANT`
  );
}

export async function updateRestaurant(formData: FormData) {
  const { id, name, orderUrl, menuUrl, phoneNumber, notes, tags } = parseFormData(
    updateRestaurantSchema,
    formData
  );

  try {
    await prisma.restaurant.update({
      where: { id },
      data: { name, orderUrl, menuUrl, phoneNumber, notes, tags },
    });
  } catch {
    throw new Error("Failed to update restaurant. Please try again.");
  }

  revalidatePath("/restaurants");
}

export async function deleteRestaurant(id: string): Promise<{ error: string } | undefined> {
  idSchema.parse(id);
  const count = await prisma.dinner.count({ where: { restaurantId: id } });
  if (count > 0) return { error: "Cannot delete a restaurant that has dinner history" };
  await prisma.restaurant.delete({ where: { id } });
  revalidatePath("/restaurants");
}

export async function hideRestaurant(id: string) {
  idSchema.parse(id);
  await prisma.restaurant.update({ where: { id }, data: { hidden: true } });
  revalidatePath("/restaurants");
}

export async function unhideRestaurant(id: string) {
  idSchema.parse(id);
  await prisma.restaurant.update({ where: { id }, data: { hidden: false } });
  revalidatePath("/restaurants");
}
