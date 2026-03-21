import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/db";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { createMeal, updateMeal, deleteMeal, hideMeal, unhideMeal } from "@/app/actions/meals";

function fd(fields: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return form;
}

describe("createMeal", () => {
  it("creates a meal with the given name", async () => {
    await createMeal(fd({ name: "Pasta" }));
    const m = await prisma.meal.findFirst({ where: { name: "Pasta" } });
    expect(m).not.toBeNull();
  });

  it("trims whitespace from name", async () => {
    await createMeal(fd({ name: "  Pasta  " }));
    const m = await prisma.meal.findFirst();
    expect(m?.name).toBe("Pasta");
  });

  it("throws if name is empty", async () => {
    await expect(createMeal(fd({ name: "" }))).rejects.toThrow();
    expect(await prisma.meal.count()).toBe(0);
  });

  it("stores notes and tags", async () => {
    await createMeal(fd({ name: "Pasta", notes: "family fave", tags: "italian, quick" }));
    const m = await prisma.meal.findFirst();
    expect(m?.notes).toBe("family fave");
    expect(m?.tags).toEqual(["italian", "quick"]);
  });
});

describe("updateMeal", () => {
  it("updates name and notes", async () => {
    const m = await prisma.meal.create({ data: { name: "Old", tags: [] } });
    await updateMeal(fd({ id: m.id, name: "New", notes: "updated" }));
    const updated = await prisma.meal.findUnique({ where: { id: m.id } });
    expect(updated?.name).toBe("New");
    expect(updated?.notes).toBe("updated");
  });

  it("throws if name is empty", async () => {
    const m = await prisma.meal.create({ data: { name: "Keep Me", tags: [] } });
    await expect(updateMeal(fd({ id: m.id, name: "" }))).rejects.toThrow();
    const unchanged = await prisma.meal.findUnique({ where: { id: m.id } });
    expect(unchanged?.name).toBe("Keep Me");
  });

  it("clears notes when omitted", async () => {
    const m = await prisma.meal.create({ data: { name: "Meal", notes: "old notes", tags: [] } });
    await updateMeal(fd({ id: m.id, name: "Meal" }));
    const updated = await prisma.meal.findUnique({ where: { id: m.id } });
    expect(updated?.notes).toBeNull();
  });
});

describe("deleteMeal", () => {
  it("removes the meal", async () => {
    const m = await prisma.meal.create({ data: { name: "Gone", tags: [] } });
    await deleteMeal(m.id);
    expect(await prisma.meal.findUnique({ where: { id: m.id } })).toBeNull();
  });
});

describe("hideMeal / unhideMeal", () => {
  it("sets hidden to true then false", async () => {
    const m = await prisma.meal.create({ data: { name: "Meal", tags: [] } });
    await hideMeal(m.id);
    expect((await prisma.meal.findUnique({ where: { id: m.id } }))?.hidden).toBe(true);
    await unhideMeal(m.id);
    expect((await prisma.meal.findUnique({ where: { id: m.id } }))?.hidden).toBe(false);
  });
});
