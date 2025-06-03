-- Complete Nutritional Data Update for food_items table
-- All values are per 100g of food

-- FRUITS
UPDATE food_items SET protein = 0.3, carbs = 14.0, fat = 0.2 WHERE name = 'Apple';
UPDATE food_items SET protein = 1.1, carbs = 23.0, fat = 0.3 WHERE name = 'Banana';
UPDATE food_items SET protein = 0.9, carbs = 12.0, fat = 0.1 WHERE name = 'Orange';
UPDATE food_items SET protein = 0.7, carbs = 7.7, fat = 0.3 WHERE name = 'Strawberries';
UPDATE food_items SET protein = 0.6, carbs = 16.0, fat = 0.2 WHERE name = 'Grapes';
UPDATE food_items SET protein = 0.5, carbs = 13.0, fat = 0.1 WHERE name = 'Pineapple';
UPDATE food_items SET protein = 0.8, carbs = 15.0, fat = 0.4 WHERE name = 'Mango';
UPDATE food_items SET protein = 0.6, carbs = 7.6, fat = 0.2 WHERE name = 'Watermelon';
UPDATE food_items SET protein = 0.7, carbs = 14.0, fat = 0.3 WHERE name = 'Blueberries';
UPDATE food_items SET protein = 2.0, carbs = 9.0, fat = 15.0 WHERE name = 'Avocado';
UPDATE food_items SET protein = 1.1, carbs = 9.0, fat = 0.3 WHERE name = 'Lemon';
UPDATE food_items SET protein = 0.9, carbs = 10.0, fat = 0.3 WHERE name = 'Peach';
UPDATE food_items SET protein = 0.4, carbs = 15.0, fat = 0.1 WHERE name = 'Pear';
UPDATE food_items SET protein = 1.1, carbs = 16.0, fat = 0.2 WHERE name = 'Cherries';
UPDATE food_items SET protein = 1.1, carbs = 15.0, fat = 0.5 WHERE name = 'Kiwi';

-- VEGETABLES
UPDATE food_items SET protein = 2.8, carbs = 7.0, fat = 0.4 WHERE name = 'Broccoli';
UPDATE food_items SET protein = 2.9, carbs = 3.6, fat = 0.4 WHERE name = 'Spinach';
UPDATE food_items SET protein = 0.9, carbs = 10.0, fat = 0.2 WHERE name = 'Carrots';
UPDATE food_items SET protein = 1.0, carbs = 7.0, fat = 0.3 WHERE name = 'Bell Peppers';
UPDATE food_items SET protein = 0.9, carbs = 3.9, fat = 0.2 WHERE name = 'Tomatoes';
UPDATE food_items SET protein = 0.7, carbs = 3.6, fat = 0.1 WHERE name = 'Cucumber';
UPDATE food_items SET protein = 1.4, carbs = 2.9, fat = 0.2 WHERE name = 'Lettuce';
UPDATE food_items SET protein = 1.1, carbs = 9.3, fat = 0.1 WHERE name = 'Onions';
UPDATE food_items SET protein = 6.4, carbs = 33.0, fat = 0.5 WHERE name = 'Garlic';
UPDATE food_items SET protein = 2.0, carbs = 20.0, fat = 0.1 WHERE name = 'Sweet Potato';
UPDATE food_items SET protein = 2.0, carbs = 17.0, fat = 0.1 WHERE name = 'Potato';
UPDATE food_items SET protein = 3.3, carbs = 19.0, fat = 1.4 WHERE name = 'Corn';
UPDATE food_items SET protein = 1.8, carbs = 7.0, fat = 0.1 WHERE name = 'Green Beans';
UPDATE food_items SET protein = 2.2, carbs = 3.9, fat = 0.1 WHERE name = 'Asparagus';
UPDATE food_items SET protein = 1.9, carbs = 5.0, fat = 0.3 WHERE name = 'Cauliflower';

-- MEATS & SEAFOOD
UPDATE food_items SET protein = 31.0, carbs = 0.0, fat = 3.6 WHERE name = 'Chicken Breast';
UPDATE food_items SET protein = 18.0, carbs = 0.0, fat = 15.0 WHERE name = 'Chicken Thigh';
UPDATE food_items SET protein = 26.0, carbs = 0.0, fat = 15.0 WHERE name = 'Beef (Lean)';
UPDATE food_items SET protein = 25.0, carbs = 0.0, fat = 12.0 WHERE name = 'Salmon';
UPDATE food_items SET protein = 23.0, carbs = 0.0, fat = 5.0 WHERE name = 'Tuna';
UPDATE food_items SET protein = 18.0, carbs = 0.0, fat = 0.7 WHERE name = 'Cod';
UPDATE food_items SET protein = 20.0, carbs = 0.0, fat = 1.7 WHERE name = 'Shrimp';
UPDATE food_items SET protein = 13.0, carbs = 1.1, fat = 11.0 WHERE name = 'Eggs';
UPDATE food_items SET protein = 24.0, carbs = 0.0, fat = 7.0 WHERE name = 'Turkey Breast';
UPDATE food_items SET protein = 22.0, carbs = 0.0, fat = 7.9 WHERE name = 'Pork Loin';
UPDATE food_items SET protein = 20.0, carbs = 0.0, fat = 20.0 WHERE name = 'Ground Beef (85% lean)';
UPDATE food_items SET protein = 25.0, carbs = 0.0, fat = 21.0 WHERE name = 'Lamb';
UPDATE food_items SET protein = 19.0, carbs = 0.0, fat = 28.0 WHERE name = 'Duck';
UPDATE food_items SET protein = 20.0, carbs = 0.0, fat = 1.3 WHERE name = 'Crab';
UPDATE food_items SET protein = 19.0, carbs = 0.0, fat = 0.9 WHERE name = 'Lobster';

-- DAIRY
UPDATE food_items SET protein = 3.4, carbs = 5.0, fat = 3.3 WHERE name = 'Milk (Whole)';
UPDATE food_items SET protein = 3.4, carbs = 5.0, fat = 2.0 WHERE name = 'Milk (2%)';
UPDATE food_items SET protein = 3.4, carbs = 5.0, fat = 0.1 WHERE name = 'Milk (Skim)';
UPDATE food_items SET protein = 25.0, carbs = 1.3, fat = 33.0 WHERE name = 'Cheddar Cheese';
UPDATE food_items SET protein = 22.0, carbs = 2.2, fat = 22.0 WHERE name = 'Mozzarella';
UPDATE food_items SET protein = 10.0, carbs = 3.6, fat = 0.4 WHERE name = 'Greek Yogurt';
UPDATE food_items SET protein = 3.5, carbs = 4.7, fat = 3.3 WHERE name = 'Regular Yogurt';
UPDATE food_items SET protein = 11.0, carbs = 3.4, fat = 4.3 WHERE name = 'Cottage Cheese';
UPDATE food_items SET protein = 0.9, carbs = 0.1, fat = 81.0 WHERE name = 'Butter';
UPDATE food_items SET protein = 6.0, carbs = 4.0, fat = 34.0 WHERE name = 'Cream Cheese';

-- GRAINS & STARCHES
UPDATE food_items SET protein = 2.6, carbs = 23.0, fat = 0.9 WHERE name = 'Brown Rice (cooked)';
UPDATE food_items SET protein = 2.7, carbs = 28.0, fat = 0.3 WHERE name = 'White Rice (cooked)';
UPDATE food_items SET protein = 4.4, carbs = 22.0, fat = 1.9 WHERE name = 'Quinoa (cooked)';
UPDATE food_items SET protein = 16.9, carbs = 66.0, fat = 6.9 WHERE name = 'Oats (dry)';
UPDATE food_items SET protein = 13.0, carbs = 43.0, fat = 4.2 WHERE name = 'Bread (Whole Wheat)';
UPDATE food_items SET protein = 9.0, carbs = 49.0, fat = 3.2 WHERE name = 'Bread (White)';
UPDATE food_items SET protein = 5.0, carbs = 25.0, fat = 1.1 WHERE name = 'Pasta (cooked)';
UPDATE food_items SET protein = 2.3, carbs = 28.0, fat = 0.4 WHERE name = 'Barley (cooked)';
UPDATE food_items SET protein = 3.1, carbs = 19.0, fat = 0.2 WHERE name = 'Bulgur (cooked)';
UPDATE food_items SET protein = 3.8, carbs = 23.0, fat = 0.2 WHERE name = 'Couscous (cooked)';

-- NUTS & SEEDS
UPDATE food_items SET protein = 21.0, carbs = 22.0, fat = 50.0 WHERE name = 'Almonds';
UPDATE food_items SET protein = 15.0, carbs = 14.0, fat = 65.0 WHERE name = 'Walnuts';
UPDATE food_items SET protein = 18.0, carbs = 30.0, fat = 44.0 WHERE name = 'Cashews';
UPDATE food_items SET protein = 26.0, carbs = 16.0, fat = 49.0 WHERE name = 'Peanuts';
UPDATE food_items SET protein = 21.0, carbs = 20.0, fat = 51.0 WHERE name = 'Sunflower Seeds';
UPDATE food_items SET protein = 17.0, carbs = 42.0, fat = 31.0 WHERE name = 'Chia Seeds';
UPDATE food_items SET protein = 18.0, carbs = 29.0, fat = 42.0 WHERE name = 'Flaxseeds';
UPDATE food_items SET protein = 19.0, carbs = 54.0, fat = 19.0 WHERE name = 'Pumpkin Seeds';
UPDATE food_items SET protein = 20.0, carbs = 28.0, fat = 45.0 WHERE name = 'Pistachios';
UPDATE food_items SET protein = 14.0, carbs = 12.0, fat = 66.0 WHERE name = 'Brazil Nuts';

-- LEGUMES
UPDATE food_items SET protein = 9.0, carbs = 23.0, fat = 0.5 WHERE name = 'Black Beans (cooked)';
UPDATE food_items SET protein = 8.7, carbs = 23.0, fat = 0.5 WHERE name = 'Kidney Beans (cooked)';
UPDATE food_items SET protein = 8.0, carbs = 27.0, fat = 2.6 WHERE name = 'Chickpeas (cooked)';
UPDATE food_items SET protein = 9.0, carbs = 20.0, fat = 0.4 WHERE name = 'Lentils (cooked)';
UPDATE food_items SET protein = 9.0, carbs = 26.0, fat = 0.7 WHERE name = 'Pinto Beans (cooked)';
UPDATE food_items SET protein = 8.0, carbs = 25.0, fat = 0.6 WHERE name = 'Navy Beans (cooked)';
UPDATE food_items SET protein = 17.0, carbs = 10.0, fat = 9.0 WHERE name = 'Soybeans (cooked)';
UPDATE food_items SET protein = 5.4, carbs = 14.0, fat = 0.4 WHERE name = 'Green Peas';
UPDATE food_items SET protein = 8.3, carbs = 21.0, fat = 0.4 WHERE name = 'Split Peas (cooked)';
UPDATE food_items SET protein = 8.0, carbs = 21.0, fat = 0.4 WHERE name = 'Lima Beans (cooked)';

-- PROCESSED FOODS
UPDATE food_items SET protein = 11.0, carbs = 33.0, fat = 10.0 WHERE name = 'Pizza (cheese)';
UPDATE food_items SET protein = 17.0, carbs = 30.0, fat = 14.0 WHERE name = 'Hamburger';
UPDATE food_items SET protein = 4.0, carbs = 63.0, fat = 17.0 WHERE name = 'French Fries';
UPDATE food_items SET protein = 3.5, carbs = 24.0, fat = 11.0 WHERE name = 'Ice Cream';
UPDATE food_items SET protein = 8.0, carbs = 46.0, fat = 31.0 WHERE name = 'Chocolate (Dark)';
UPDATE food_items SET protein = 5.9, carbs = 68.0, fat = 22.0 WHERE name = 'Cookies';
UPDATE food_items SET protein = 4.0, carbs = 58.0, fat = 15.0 WHERE name = 'Cake (vanilla)';
UPDATE food_items SET protein = 9.0, carbs = 74.0, fat = 14.0 WHERE name = 'Crackers';
UPDATE food_items SET protein = 6.6, carbs = 53.0, fat = 35.0 WHERE name = 'Potato Chips';
UPDATE food_items SET protein = 10.0, carbs = 80.0, fat = 3.0 WHERE name = 'Pretzels';

-- BEVERAGES
UPDATE food_items SET protein = 0.7, carbs = 10.4, fat = 0.2 WHERE name = 'Orange Juice';
UPDATE food_items SET protein = 0.1, carbs = 11.3, fat = 0.1 WHERE name = 'Apple Juice';
UPDATE food_items SET protein = 0.0, carbs = 10.6, fat = 0.0 WHERE name = 'Coca Cola';
UPDATE food_items SET protein = 0.5, carbs = 3.6, fat = 0.0 WHERE name = 'Beer';
UPDATE food_items SET protein = 0.1, carbs = 2.6, fat = 0.0 WHERE name = 'Wine (Red)';
UPDATE food_items SET protein = 0.3, carbs = 0.0, fat = 0.0 WHERE name = 'Coffee (black)';
UPDATE food_items SET protein = 0.0, carbs = 0.0, fat = 0.0 WHERE name = 'Tea (green)';
UPDATE food_items SET protein = 0.0, carbs = 11.0, fat = 0.0 WHERE name = 'Energy Drink';

-- CONDIMENTS & SWEETENERS
UPDATE food_items SET protein = 0.3, carbs = 82.0, fat = 0.0 WHERE name = 'Honey';
UPDATE food_items SET protein = 0.0, carbs = 100.0, fat = 0.0 WHERE name = 'Sugar';
UPDATE food_items SET protein = 0.0, carbs = 0.0, fat = 100.0 WHERE name = 'Olive Oil';
UPDATE food_items SET protein = 0.1, carbs = 0.6, fat = 75.0 WHERE name = 'Mayonnaise';
UPDATE food_items SET protein = 1.7, carbs = 26.0, fat = 0.4 WHERE name = 'Ketchup';
UPDATE food_items SET protein = 4.4, carbs = 6.0, fat = 4.0 WHERE name = 'Mustard';
UPDATE food_items SET protein = 1.4, carbs = 1.0, fat = 0.0 WHERE name = 'Soy Sauce';
UPDATE food_items SET protein = 0.5, carbs = 17.0, fat = 0.0 WHERE name = 'Balsamic Vinegar';
UPDATE food_items SET protein = 3.2, carbs = 5.0, fat = 23.0 WHERE name = 'Pesto';
UPDATE food_items SET protein = 8.0, carbs = 14.0, fat = 10.0 WHERE name = 'Hummus';

-- PREPARED DISHES
UPDATE food_items SET protein = 15.0, carbs = 8.0, fat = 14.0 WHERE name = 'Caesar Salad';
UPDATE food_items SET protein = 2.0, carbs = 5.0, fat = 1.0 WHERE name = 'Garden Salad';
UPDATE food_items SET protein = 4.0, carbs = 5.0, fat = 2.5 WHERE name = 'Chicken Soup';
UPDATE food_items SET protein = 1.5, carbs = 8.0, fat = 1.8 WHERE name = 'Vegetable Soup';
UPDATE food_items SET protein = 12.0, carbs = 8.0, fat = 6.0 WHERE name = 'Beef Stew';
UPDATE food_items SET protein = 7.0, carbs = 20.0, fat = 5.0 WHERE name = 'Spaghetti Bolognese';
UPDATE food_items SET protein = 4.5, carbs = 20.0, fat = 7.0 WHERE name = 'Fried Rice';
UPDATE food_items SET protein = 12.0, carbs = 22.0, fat = 13.0 WHERE name = 'Fish and Chips';
UPDATE food_items SET protein = 20.0, carbs = 5.0, fat = 4.0 WHERE name = 'Grilled Chicken Salad';
UPDATE food_items SET protein = 15.0, carbs = 35.0, fat = 8.0 WHERE name = 'Tuna Sandwich';

-- Verification query to check updated data
SELECT name, calories, protein, carbs, fat 
FROM food_items 
WHERE id <= 10
ORDER BY id; 