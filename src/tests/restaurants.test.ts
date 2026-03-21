import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  hideRestaurant,
  unhideRestaurant,
} from "@/app/actions/restaurants";

function fd(fields: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return form;
}

describe("createRestaurant", () => {
  it("creates a restaurant with the given name", async () => {
    await createRestaurant(fd({ name: "Noma" }));
    const r = await prisma.restaurant.findFirst({ where: { name: "Noma" } });
    expect(r).not.toBeNull();
  });

  it("trims whitespace from name", async () => {
    await createRestaurant(fd({ name: "  Noma  " }));
    const r = await prisma.restaurant.findFirst();
    expect(r?.name).toBe("Noma");
  });

  it("throws if name is empty", async () => {
    await expect(createRestaurant(fd({ name: "   " }))).rejects.toThrow();
    expect(await prisma.restaurant.count()).toBe(0);
  });

  it("throws on invalid orderUrl", async () => {
    await expect(
      createRestaurant(fd({ name: "Noma", orderUrl: "not-a-url" }))
    ).rejects.toThrow();
    expect(await prisma.restaurant.count()).toBe(0);
  });

  it("stores optional fields", async () => {
    await createRestaurant(
      fd({
        name: "Noma",
        orderUrl: "https://order.me",
        menuUrl: "https://menu.me",
        phoneNumber: "555-1234",
        notes: "great",
      })
    );
    const r = await prisma.restaurant.findFirst();
    expect(r?.orderUrl).toBe("https://order.me");
    expect(r?.menuUrl).toBe("https://menu.me");
    expect(r?.phoneNumber).toBe("555-1234");
    expect(r?.notes).toBe("great");
  });

  it("throws on invalid menuUrl", async () => {
    await expect(
      createRestaurant(fd({ name: "Noma", menuUrl: "not-a-url" }))
    ).rejects.toThrow();
    expect(await prisma.restaurant.count()).toBe(0);
  });

  it("stores parsed tags", async () => {
    await createRestaurant(fd({ name: "Noma", tags: "nordic, fine dining" }));
    const r = await prisma.restaurant.findFirst();
    expect(r?.tags).toEqual(["nordic", "fine dining"]);
  });

  it("sets hidden to false by default", async () => {
    await createRestaurant(fd({ name: "Noma" }));
    const r = await prisma.restaurant.findFirst();
    expect(r?.hidden).toBe(false);
  });
});

describe("updateRestaurant", () => {
  it("updates the name and fields", async () => {
    const r = await prisma.restaurant.create({ data: { name: "Old Name", tags: [] } });
    await updateRestaurant(fd({ id: r.id, name: "New Name", notes: "updated" }));
    const updated = await prisma.restaurant.findUnique({ where: { id: r.id } });
    expect(updated?.name).toBe("New Name");
    expect(updated?.notes).toBe("updated");
  });

  it("throws if name is empty", async () => {
    const r = await prisma.restaurant.create({ data: { name: "Keep Me", tags: [] } });
    await expect(updateRestaurant(fd({ id: r.id, name: "" }))).rejects.toThrow();
    const unchanged = await prisma.restaurant.findUnique({ where: { id: r.id } });
    expect(unchanged?.name).toBe("Keep Me");
  });

  it("throws on invalid orderUrl", async () => {
    const r = await prisma.restaurant.create({ data: { name: "Place", tags: [] } });
    await expect(
      updateRestaurant(fd({ id: r.id, name: "Place", orderUrl: "bad-url" }))
    ).rejects.toThrow();
  });

  it("throws on invalid menuUrl", async () => {
    const r = await prisma.restaurant.create({ data: { name: "Place", tags: [] } });
    await expect(
      updateRestaurant(fd({ id: r.id, name: "Place", menuUrl: "bad-url" }))
    ).rejects.toThrow();
  });

  it("stores and updates menuUrl", async () => {
    const r = await prisma.restaurant.create({ data: { name: "Place", tags: [] } });
    await updateRestaurant(fd({ id: r.id, name: "Place", menuUrl: "https://menu.example.com" }));
    const updated = await prisma.restaurant.findUnique({ where: { id: r.id } });
    expect(updated?.menuUrl).toBe("https://menu.example.com");
  });

  it("clears optional fields when omitted", async () => {
    const r = await prisma.restaurant.create({
      data: { name: "Place", orderUrl: "https://x.com", menuUrl: "https://menu.x.com", phoneNumber: "555", tags: [] },
    });
    await updateRestaurant(fd({ id: r.id, name: "Place" }));
    const updated = await prisma.restaurant.findUnique({ where: { id: r.id } });
    expect(updated?.orderUrl).toBeNull();
    expect(updated?.menuUrl).toBeNull();
    expect(updated?.phoneNumber).toBeNull();
  });

  it("updates tags", async () => {
    const r = await prisma.restaurant.create({ data: { name: "Place", tags: ["old"] } });
    await updateRestaurant(fd({ id: r.id, name: "Place", tags: "new,tags" }));
    const updated = await prisma.restaurant.findUnique({ where: { id: r.id } });
    expect(updated?.tags).toEqual(["new", "tags"]);
  });
});

describe("deleteRestaurant", () => {
  it("removes the restaurant", async () => {
    const r = await prisma.restaurant.create({ data: { name: "Gone", tags: [] } });
    await deleteRestaurant(r.id);
    const found = await prisma.restaurant.findUnique({ where: { id: r.id } });
    expect(found).toBeNull();
  });
});

describe("hideRestaurant / unhideRestaurant", () => {
  it("sets hidden to true then false", async () => {
    const r = await prisma.restaurant.create({ data: { name: "Place", tags: [] } });
    await hideRestaurant(r.id);
    expect((await prisma.restaurant.findUnique({ where: { id: r.id } }))?.hidden).toBe(true);
    await unhideRestaurant(r.id);
    expect((await prisma.restaurant.findUnique({ where: { id: r.id } }))?.hidden).toBe(false);
  });
});
