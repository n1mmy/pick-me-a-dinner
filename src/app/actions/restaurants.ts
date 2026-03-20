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

export async function createRestaurant(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  await prisma.restaurant.create({
    data: {
      name,
      orderUrl: (formData.get("orderUrl") as string)?.trim() || null,
      phoneNumber: (formData.get("phoneNumber") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
      tags: parseTags(formData),
    },
  });

  revalidatePath("/restaurants");
}

export async function createRestaurantAndReturn(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const returnDate = formData.get("returnDate") as string;
  const returnDinnerId = (formData.get("returnDinnerId") as string) || null;
  if (!name) return;

  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      orderUrl: (formData.get("orderUrl") as string)?.trim() || null,
      phoneNumber: (formData.get("phoneNumber") as string)?.trim() || null,
      tags: parseTags(formData),
    },
  });

  revalidatePath("/restaurants");
  if (returnDinnerId) {
    redirect(`/add?id=${returnDinnerId}&suggestedId=${restaurant.id}&type=RESTAURANT`);
  }
  redirect(`/add?date=${returnDate}&suggestedId=${restaurant.id}&type=RESTAURANT`);
}

export async function updateRestaurant(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  await prisma.restaurant.update({
    where: { id },
    data: {
      name,
      orderUrl: (formData.get("orderUrl") as string)?.trim() || null,
      phoneNumber: (formData.get("phoneNumber") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
      tags: parseTags(formData),
    },
  });

  revalidatePath("/restaurants");
}

export async function deleteRestaurant(id: string) {
  await prisma.restaurant.delete({ where: { id } });
  revalidatePath("/restaurants");
}

export async function hideRestaurant(id: string) {
  await prisma.restaurant.update({ where: { id }, data: { hidden: true } });
  revalidatePath("/restaurants");
}

export async function unhideRestaurant(id: string) {
  await prisma.restaurant.update({ where: { id }, data: { hidden: false } });
  revalidatePath("/restaurants");
}
