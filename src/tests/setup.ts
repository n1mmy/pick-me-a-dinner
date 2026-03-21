import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";

beforeEach(async () => {
  await prisma.dinner.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.meal.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
