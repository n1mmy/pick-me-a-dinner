"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function createRestaurant(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  await prisma.restaurant.create({
    data: {
      name,
      orderUrl: (formData.get("orderUrl") as string)?.trim() || null,
      phoneNumber: (formData.get("phoneNumber") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    },
  });

  revalidatePath("/restaurants");
}

export async function createRestaurantAndReturn(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const returnDate = formData.get("returnDate") as string;
  if (!name) return;

  await prisma.restaurant.create({
    data: { name },
  });

  revalidatePath("/restaurants");
  redirect(`/add?date=${returnDate}&type=RESTAURANT`);
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
    },
  });

  revalidatePath("/restaurants");
}

export async function deleteRestaurant(id: string) {
  await prisma.restaurant.delete({ where: { id } });
  revalidatePath("/restaurants");
}
