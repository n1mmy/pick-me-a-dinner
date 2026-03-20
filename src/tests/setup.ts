import { vi, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(async () => {
  await prisma.dinner.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.meal.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
