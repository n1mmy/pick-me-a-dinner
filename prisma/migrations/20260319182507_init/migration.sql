-- CreateEnum
CREATE TYPE "DinnerType" AS ENUM ('RESTAURANT', 'HOMECOOKED');

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderUrl" TEXT,
    "phoneNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dinner" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "DinnerType" NOT NULL,
    "notes" TEXT,
    "restaurantId" TEXT,
    "mealId" TEXT,

    CONSTRAINT "Dinner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dinner_date_key" ON "Dinner"("date");

-- AddForeignKey
ALTER TABLE "Dinner" ADD CONSTRAINT "Dinner_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dinner" ADD CONSTRAINT "Dinner_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
