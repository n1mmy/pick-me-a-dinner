-- CreateIndex
CREATE INDEX "Restaurant_hidden_idx" ON "Restaurant"("hidden");

-- CreateIndex
CREATE INDEX "Meal_hidden_idx" ON "Meal"("hidden");

-- CreateIndex
CREATE INDEX "Dinner_restaurantId_idx" ON "Dinner"("restaurantId");

-- CreateIndex
CREATE INDEX "Dinner_mealId_idx" ON "Dinner"("mealId");
