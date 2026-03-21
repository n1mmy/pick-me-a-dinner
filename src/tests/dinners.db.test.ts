import { describe, it, expect, vi } from "vitest";
import "./setup.db";
import { prisma } from "@/lib/db";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { redirect } from "next/navigation";
import { createDinner, updateDinner, deleteDinner, fetchMoreSuggestions, pickAndRedirect } from "@/app/actions/dinners";

function fd(fields: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return form;
}

async function makeRestaurant(name = "Test Restaurant", tags: string[] = []) {
  return prisma.restaurant.create({ data: { name, tags } });
}

async function makeMeal(name = "Test Meal", tags: string[] = []) {
  return prisma.meal.create({ data: { name, tags } });
}

describe("createDinner", () => {
  it("creates a RESTAURANT dinner with correct date (UTC midnight)", async () => {
    const r = await makeRestaurant();
    await createDinner(fd({ date: "2026-03-20", type: "RESTAURANT", restaurantId: r.id }));
    const d = await prisma.dinner.findFirst();
    expect(d?.type).toBe("RESTAURANT");
    expect(d?.restaurantId).toBe(r.id);
    expect(d?.mealId).toBeNull();
    expect(d?.date.toISOString()).toBe("2026-03-20T00:00:00.000Z");
  });

  it("creates a HOMECOOKED dinner and nulls out restaurantId", async () => {
    const m = await makeMeal();
    await createDinner(fd({ date: "2026-03-20", type: "HOMECOOKED", mealId: m.id }));
    const d = await prisma.dinner.findFirst();
    expect(d?.type).toBe("HOMECOOKED");
    expect(d?.mealId).toBe(m.id);
    expect(d?.restaurantId).toBeNull();
  });

  it("stores notes", async () => {
    const r = await makeRestaurant();
    await createDinner(fd({ date: "2026-03-20", type: "RESTAURANT", restaurantId: r.id, notes: "delicious" }));
    const d = await prisma.dinner.findFirst();
    expect(d?.notes).toBe("delicious");
  });

  it("nulls restaurantId when type is HOMECOOKED even if restaurantId is provided", async () => {
    const r = await makeRestaurant();
    const m = await makeMeal();
    await createDinner(
      fd({ date: "2026-03-20", type: "HOMECOOKED", restaurantId: r.id, mealId: m.id })
    );
    const d = await prisma.dinner.findFirst();
    expect(d?.restaurantId).toBeNull();
    expect(d?.mealId).toBe(m.id);
  });

  it("throws on invalid date format", async () => {
    const r = await makeRestaurant();
    await expect(
      createDinner(fd({ date: "20260320", type: "RESTAURANT", restaurantId: r.id }))
    ).rejects.toThrow();
    expect(await prisma.dinner.count()).toBe(0);
  });
});

describe("updateDinner", () => {
  it("updates type and swaps restaurantId/mealId", async () => {
    const r = await makeRestaurant();
    const m = await makeMeal();
    const d = await prisma.dinner.create({
      data: { date: new Date("2026-03-20"), type: "RESTAURANT", restaurantId: r.id },
    });
    await updateDinner(fd({ id: d.id, type: "HOMECOOKED", mealId: m.id }));
    const updated = await prisma.dinner.findUnique({ where: { id: d.id } });
    expect(updated?.type).toBe("HOMECOOKED");
    expect(updated?.mealId).toBe(m.id);
    expect(updated?.restaurantId).toBeNull();
  });

  it("updates notes", async () => {
    const r = await makeRestaurant();
    const d = await prisma.dinner.create({
      data: { date: new Date("2026-03-20"), type: "RESTAURANT", restaurantId: r.id, notes: "old" },
    });
    await updateDinner(fd({ id: d.id, type: "RESTAURANT", restaurantId: r.id, notes: "new" }));
    const updated = await prisma.dinner.findUnique({ where: { id: d.id } });
    expect(updated?.notes).toBe("new");
  });
});

describe("deleteDinner", () => {
  it("removes the dinner", async () => {
    const r = await makeRestaurant();
    const d = await prisma.dinner.create({
      data: { date: new Date("2026-03-20"), type: "RESTAURANT", restaurantId: r.id },
    });
    await deleteDinner(d.id);
    expect(await prisma.dinner.findUnique({ where: { id: d.id } })).toBeNull();
  });
});

describe("fetchMoreSuggestions", () => {
  it("returns candidates excluding given IDs", async () => {
    const r1 = await makeRestaurant("R1");
    const r2 = await makeRestaurant("R2");
    const { restaurantCandidates } = await fetchMoreSuggestions([r1.id]);
    const ids = restaurantCandidates.map((c) => c.id);
    expect(ids).not.toContain(r1.id);
    expect(ids).toContain(r2.id);
  });

  it("excludes hidden restaurants and meals", async () => {
    await prisma.restaurant.create({ data: { name: "Hidden", tags: [], hidden: true } });
    await prisma.meal.create({ data: { name: "Hidden Meal", tags: [], hidden: true } });
    const { restaurantCandidates, mealCandidates } = await fetchMoreSuggestions([]);
    expect(restaurantCandidates.every((c) => c.name !== "Hidden")).toBe(true);
    expect(mealCandidates.every((c) => c.name !== "Hidden Meal")).toBe(true);
  });

  it("returns at most 8 restaurant and 5 meal candidates", async () => {
    for (let i = 0; i < 12; i++) await makeRestaurant(`Restaurant ${i}`);
    for (let i = 0; i < 8; i++) await makeMeal(`Meal ${i}`);
    const { restaurantCandidates, mealCandidates } = await fetchMoreSuggestions([]);
    expect(restaurantCandidates.length).toBeLessThanOrEqual(8);
    expect(mealCandidates.length).toBeLessThanOrEqual(5);
  });

  it("limits to 2 candidates per tag", async () => {
    // 3 restaurants all tagged "italian" — only 2 should appear
    await makeRestaurant("Italian A", ["italian"]);
    await makeRestaurant("Italian B", ["italian"]);
    await makeRestaurant("Italian C", ["italian"]);
    const { restaurantCandidates } = await fetchMoreSuggestions([]);
    const italianCount = restaurantCandidates.filter((c) =>
      c.tagsWithRecency.some(({ tag }) => tag === "italian")
    ).length;
    expect(italianCount).toBeLessThanOrEqual(2);
  });

  it("returns correct suggestion shape", async () => {
    const r = await makeRestaurant("Sushi Place", ["sushi"]);
    const { restaurantCandidates } = await fetchMoreSuggestions([]);
    const candidate = restaurantCandidates.find((c) => c.id === r.id);
    expect(candidate).toMatchObject({
      type: "RESTAURANT",
      id: r.id,
      name: "Sushi Place",
      orderUrl: null,
      phoneNumber: null,
      daysSinceLastOrder: null,
      entityNotes: null,
      lastNotes: null,
    });
    expect(candidate?.tagsWithRecency).toEqual([{ tag: "sushi", daysSince: null }]);
  });

  it("returns entityNotes from the restaurant's notes field", async () => {
    const r = await prisma.restaurant.create({ data: { name: "Noted Place", tags: [], notes: "always ask for extra sauce" } });
    const { restaurantCandidates } = await fetchMoreSuggestions([]);
    const candidate = restaurantCandidates.find((c) => c.id === r.id);
    expect(candidate?.entityNotes).toBe("always ask for extra sauce");
  });

  it("returns lastNotes from the most recent dinner's notes", async () => {
    const r = await makeRestaurant("Memo Place");
    await prisma.dinner.create({
      data: { date: new Date("2026-03-10"), type: "RESTAURANT", restaurantId: r.id, notes: "old note" },
    });
    await prisma.dinner.create({
      data: { date: new Date("2026-03-18"), type: "RESTAURANT", restaurantId: r.id, notes: "fresh note" },
    });
    const { restaurantCandidates } = await fetchMoreSuggestions([]);
    const candidate = restaurantCandidates.find((c) => c.id === r.id);
    expect(candidate?.lastNotes).toBe("fresh note");
  });

  it("returns null lastNotes when no dinner has notes", async () => {
    const r = await makeRestaurant("Quiet Place");
    await prisma.dinner.create({
      data: { date: new Date("2026-03-18"), type: "RESTAURANT", restaurantId: r.id },
    });
    const { restaurantCandidates } = await fetchMoreSuggestions([]);
    const candidate = restaurantCandidates.find((c) => c.id === r.id);
    expect(candidate?.lastNotes).toBeNull();
  });
});

describe("pickAndRedirect", () => {
  beforeEach(() => {
    vi.mocked(redirect).mockClear();
  });

  it("redirects to /add?date when no options exist", async () => {
    vi.mocked(redirect).mockImplementationOnce(() => { throw new Error("NEXT_REDIRECT"); });
    await expect(pickAndRedirect(fd({ date: "2026-03-20" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/add?date=2026-03-20");
  });

  it("redirects with the best-scoring restaurant when one exists", async () => {
    const r = await makeRestaurant("The Only Place");
    await pickAndRedirect(fd({ date: "2026-03-20" }));
    expect(redirect).toHaveBeenCalledWith(`/add?date=2026-03-20&suggestedId=${r.id}&type=RESTAURANT`);
  });

  it("redirects with a meal when that's the only option", async () => {
    const m = await makeMeal("Pasta Night");
    await pickAndRedirect(fd({ date: "2026-03-20" }));
    expect(redirect).toHaveBeenCalledWith(`/add?date=2026-03-20&suggestedId=${m.id}&type=HOMECOOKED`);
  });

  it("excludes hidden restaurants and meals", async () => {
    await prisma.restaurant.create({ data: { name: "Hidden R", tags: [], hidden: true } });
    await prisma.meal.create({ data: { name: "Hidden M", tags: [], hidden: true } });
    vi.mocked(redirect).mockImplementationOnce(() => { throw new Error("NEXT_REDIRECT"); });
    await expect(pickAndRedirect(fd({ date: "2026-03-20" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/add?date=2026-03-20");
  });

  it("prefers the option not used recently", async () => {
    const r1 = await makeRestaurant("Recent Place");
    const r2 = await makeRestaurant("Old Place");
    // r1 was used yesterday (score = 1); r2 never used (score = 21)
    await prisma.dinner.create({
      data: { date: new Date(Date.now() - 86_400_000), type: "RESTAURANT", restaurantId: r1.id },
    });
    await pickAndRedirect(fd({ date: "2026-03-20" }));
    expect(redirect).toHaveBeenCalledWith(`/add?date=2026-03-20&suggestedId=${r2.id}&type=RESTAURANT`);
  });
});
