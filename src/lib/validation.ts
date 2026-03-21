import { z } from "zod";

// Reusable fields
const requiredString = z.string().trim().min(1);
const optionalString = z
  .string()
  .transform((v) => v.trim() || null)
  .nullable()
  .optional();
const optionalUrl = z
  .string()
  .transform((v) => {
    const trimmed = v.trim();
    if (!trimmed) return null;
    // Validate as URL only when non-empty
    new URL(trimmed);
    return trimmed;
  })
  .nullable()
  .optional();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const tagsString = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  );

// Restaurant
export const createRestaurantSchema = z.object({
  name: requiredString,
  orderUrl: optionalUrl,
  menuUrl: optionalUrl,
  phoneNumber: optionalString,
  notes: optionalString,
  tags: tagsString,
});

export const createRestaurantAndReturnSchema = createRestaurantSchema.extend({
  returnDate: dateString,
  returnDinnerId: optionalString,
});

export const updateRestaurantSchema = createRestaurantSchema.extend({
  id: requiredString,
});

// Meal
export const createMealSchema = z.object({
  name: requiredString,
  notes: optionalString,
  tags: tagsString,
});

export const createMealAndReturnSchema = createMealSchema.extend({
  returnDate: dateString,
  returnDinnerId: optionalString,
});

export const updateMealSchema = createMealSchema.extend({
  id: requiredString,
});

// Dinner
const dinnerType = z.enum(["RESTAURANT", "HOMECOOKED"]);

export const createDinnerSchema = z.object({
  date: dateString,
  type: dinnerType,
  restaurantId: optionalString,
  mealId: optionalString,
  notes: optionalString,
});

export const updateDinnerSchema = createDinnerSchema.extend({
  id: requiredString,
});

export const pickAndRedirectSchema = z.object({
  date: dateString,
});

// Shared
export const idSchema = requiredString;

/**
 * Extract fields from FormData matching a schema's keys, then parse.
 * Missing keys are treated as empty string so optional fields clear to null
 * on update (rather than being skipped by Prisma as undefined).
 */
export function parseFormData<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  formData: FormData
): z.output<T> {
  const raw: Record<string, unknown> = {};
  for (const key of Object.keys(schema.shape)) {
    raw[key] = formData.get(key) ?? "";
  }
  return schema.parse(raw);
}
