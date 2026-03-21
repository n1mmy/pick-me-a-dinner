import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://dinner:dinner@localhost:5432/pick-me-a-dinner?schema=public",
});
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  // Clear existing data
  await prisma.dinner.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.meal.deleteMany();

  // --- Restaurants ---
  const restaurants = await Promise.all(
    [
      {
        name: "Sakura Ramen",
        orderUrl: "https://sakuraramen.com/order",
        menuUrl: "https://sakuraramen.com/menu",
        phoneNumber: "(503) 555-0101",
        notes: "Get the spicy miso — it's incredible",
        tags: ["japanese", "ramen", "noodles"],
      },
      {
        name: "Little Italy Trattoria",
        orderUrl: "https://littleitalytrattoria.com",
        menuUrl: "https://littleitalytrattoria.com/menu",
        phoneNumber: "(503) 555-0102",
        notes: "Ask for the off-menu burrata appetizer",
        tags: ["italian", "pasta", "wine"],
      },
      {
        name: "El Camino Taqueria",
        menuUrl: "https://elcaminotaqueria.com/menu",
        phoneNumber: "(503) 555-0103",
        notes: "Cash only! The al pastor is legendary",
        tags: ["mexican", "tacos", "casual"],
      },
      {
        name: "Golden Palace",
        orderUrl: "https://goldenpalacedelivery.com",
        menuUrl: "https://goldenpalacedelivery.com/menu",
        phoneNumber: "(503) 555-0104",
        tags: ["chinese", "dim sum", "family style"],
      },
      {
        name: "The Burger Joint",
        orderUrl: "https://theburgerjoint.com/order",
        menuUrl: "https://theburgerjoint.com/menu",
        notes: "Smash burgers and milkshakes",
        tags: ["american", "burgers", "casual"],
      },
      {
        name: "Pho 88",
        phoneNumber: "(503) 555-0106",
        notes: "Large pho is enormous — small is plenty",
        tags: ["vietnamese", "pho", "soup"],
      },
      {
        name: "Tandoori Nights",
        orderUrl: "https://tandoorinights.com/menu",
        menuUrl: "https://tandoorinights.com/menu",
        phoneNumber: "(503) 555-0107",
        notes: "Butter chicken and garlic naan combo is the move",
        tags: ["indian", "curry", "tandoori"],
      },
      {
        name: "Olive & Thyme",
        orderUrl: "https://oliveandthyme.com",
        menuUrl: "https://oliveandthyme.com/menu",
        notes: "Great for date night — reserve ahead on weekends",
        tags: ["mediterranean", "healthy", "date night"],
      },
      {
        name: "Sushi Kawa",
        menuUrl: "https://sushikawa.com/menu",
        phoneNumber: "(503) 555-0109",
        notes: "Omakase is worth it if you're feeling fancy",
        tags: ["japanese", "sushi", "seafood"],
      },
      {
        name: "Casa Mexicana",
        orderUrl: "https://casamexicana.com/order",
        menuUrl: "https://casamexicana.com/menu",
        phoneNumber: "(503) 555-0110",
        tags: ["mexican", "family style", "margaritas"],
      },
      {
        name: "Bangkok Street Kitchen",
        orderUrl: "https://bangkokstreetkitchen.com",
        menuUrl: "https://bangkokstreetkitchen.com/menu",
        notes: "Pad see ew and mango sticky rice — always",
        tags: ["thai", "street food", "spicy"],
      },
      {
        name: "Nonna's Pizza",
        menuUrl: "https://nonnaspizza.com/menu",
        phoneNumber: "(503) 555-0112",
        notes: "Neapolitan style, wood-fired. No delivery.",
        tags: ["italian", "pizza", "wood-fired"],
      },
      {
        name: "The Greek Spot",
        orderUrl: "https://thegreekspot.com/order",
        menuUrl: "https://thegreekspot.com/menu",
        tags: ["greek", "gyros", "healthy"],
      },
      {
        name: "Cedar & Vine",
        menuUrl: "https://cedarandvine.com/menu",
        notes: "Upscale Lebanese — try the lamb shawarma plate",
        tags: ["lebanese", "mediterranean", "date night"],
        hidden: true,
      },
      {
        name: "Blue Fin Poke",
        orderUrl: "https://bluefinpoke.com",
        menuUrl: "https://bluefinpoke.com/menu",
        tags: ["hawaiian", "poke", "healthy"],
        hidden: true,
      },
    ].map((r) => prisma.restaurant.create({ data: r }))
  );

  // --- Meals ---
  const meals = await Promise.all(
    [
      {
        name: "Spaghetti Bolognese",
        notes: "Use the slow-cook recipe — worth the wait",
        tags: ["italian", "pasta", "comfort food"],
      },
      {
        name: "Chicken Stir Fry",
        notes: "Works great with whatever veggies are in the fridge",
        tags: ["asian", "quick", "weeknight"],
      },
      {
        name: "Taco Night",
        notes: "Don't forget the lime and cilantro",
        tags: ["mexican", "fun", "family"],
      },
      {
        name: "Homemade Pizza",
        notes: "Make dough in the morning, bake at night",
        tags: ["italian", "pizza", "weekend"],
      },
      {
        name: "Salmon & Roasted Veggies",
        notes: "375°F, 20 min. Season with lemon and dill.",
        tags: ["healthy", "seafood", "sheet pan"],
      },
      {
        name: "Mac & Cheese",
        notes: "Sharp cheddar + gruyère, breadcrumb topping",
        tags: ["american", "comfort food", "kids love it"],
      },
      {
        name: "Beef Stew",
        notes: "Dutch oven, low and slow. Great with crusty bread.",
        tags: ["hearty", "winter", "slow cook"],
      },
      {
        name: "Pad Thai",
        notes: "Tamarind paste makes all the difference",
        tags: ["thai", "noodles", "weeknight"],
      },
      {
        name: "Grilled Chicken Caesar",
        notes: "Homemade dressing: anchovy, garlic, lemon, parm",
        tags: ["healthy", "salad", "quick"],
      },
      {
        name: "Mushroom Risotto",
        notes: "Use dried porcini for extra depth",
        tags: ["italian", "vegetarian", "date night"],
      },
    ].map((m) => prisma.meal.create({ data: m }))
  );

  // --- Dinners over the last ~60 days (skip some days for realism) ---
  // Today is 2026-03-20. We'll seed from Jan 20 to Mar 19.
  const activeRestaurants = restaurants.filter((r) => !r.hidden);

  const dinnerEntries: {
    date: Date;
    type: "RESTAURANT" | "HOMECOOKED";
    restaurantId?: string;
    mealId?: string;
    notes?: string;
  }[] = [];

  // Deterministic "random" using a simple seed
  let seed = 42;
  function rand() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  const startDate = new Date("2026-01-20");
  const endDate = new Date("2026-03-19"); // leave today empty

  const dinnerNotes = [
    null,
    null,
    null,
    null,
    null, // most dinners have no notes
    "Ordered extra garlic bread",
    "Kids loved it",
    "A bit too salty, adjust next time",
    "Perfect for a cold evening",
    "Had leftovers for lunch the next day",
    "Tried the new special — really good",
    "Quick weeknight meal, on the table in 20 min",
  ];

  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setDate(d.getDate() + 1)
  ) {
    // Skip ~25% of days randomly (no dinner recorded)
    if (rand() < 0.25) continue;

    const isRestaurant = rand() < 0.6;
    const note = dinnerNotes[Math.floor(rand() * dinnerNotes.length)] ?? undefined;

    if (isRestaurant) {
      const restaurant =
        activeRestaurants[Math.floor(rand() * activeRestaurants.length)];
      dinnerEntries.push({
        date: new Date(d.toISOString().split("T")[0]),
        type: "RESTAURANT",
        restaurantId: restaurant.id,
        notes: note,
      });
    } else {
      const meal = meals[Math.floor(rand() * meals.length)];
      dinnerEntries.push({
        date: new Date(d.toISOString().split("T")[0]),
        type: "HOMECOOKED",
        mealId: meal.id,
        notes: note,
      });
    }
  }

  await Promise.all(
    dinnerEntries.map((entry) => prisma.dinner.create({ data: entry }))
  );

  console.log(
    `Seeded: ${restaurants.length} restaurants, ${meals.length} meals, ${dinnerEntries.length} dinners`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
