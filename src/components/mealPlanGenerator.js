// const seededRandom = (seed) => {
//   const x = Math.sin(seed) * 10000;
//   return x - Math.floor(x);
// };

// const generateMealPlan = (year, month, foodList) => {

        
//       const plan = {};
//       const daysInMonth = new Date(year, month + 1, 0).getDate();
//       const { breakfast, lunch, supper, fruits } = foodList;


//       // 1. Specialized History Buffers
//       const history = {
//         breakfast: [],
//         fruit: [],
//         recentMeals: [], // Tracks full strings (e.g., "Rice + Chicken") to stop back-to-back days
//         recentIngredients: [], // Tracks base items (e.g., "rice") with a short memory window
//       };

//       // Static safety windows optimized for your specific list sizes
//       const maxBreakfastHistory = Math.max(1, breakfast.length - 2); // Remembers last 5 days
//       // const maxFruitHistory = Math.max(1, fruits.length - 1);
//       // Remembers last 2 days
//       const maxFruitHistory = 2;
//       const maxMealHistory = 2; // Prevents exact lunch/supper combo duplication for 2 full days
//       const maxIngredientHistory = 2; // Remembers base ingredients for roughly 24 hours

//       // Helper to split and clean up meal ingredients safely
//       const getIngredients = (mealString) => {
//         if (!mealString) return [];
//         return mealString
//           .toLowerCase()
//           .split(/\s*\+\s*/)
//           .map((item) => item.trim());
//       };

//       for (let day = 1; day <= daysInMonth; day++) {
//         const seed = year * 10000 + month * 100 + day;

//         const getDiverseIndex = (
//           seedMultiplier,
//           list,
//           isMainMeal = false,
//           excludeIngredients = [],
//         ) => {
//           const seedValue = seededRandom(seed * seedMultiplier);

//           // --- NEW LOGIC FOR FRUITS & BREAKFAST ---
//           if (!isMainMeal) {
//             const targetHistory =
//               list === breakfast ? history.breakfast : history.fruit;

//             // 1. Gather all items from the list that are NOT in the history window
//             const validChoices = list.filter(
//               (item) => !targetHistory.includes(item),
//             );

//             // 2. If we have choices that don't violate history, pick randomly from THEM
//             if (validChoices.length > 0) {
//               const chosenItem =
//                 validChoices[Math.floor(seedValue * validChoices.length)];
//               return list.indexOf(chosenItem);
//             }

//             // Fallback if history window is somehow completely full (impossible with window = 2 and list = 4)
//             return Math.floor(seedValue * list.length);
//           }

//           // --- MAIN MEAL LOGIC (LUNCH & SUPPER) ---
//           // Keeps your working tiered lookup for complex broken-down ingredient strings
//           const initialIndex = Math.floor(seedValue * list.length);
//           let backupIndex = -1;

//           for (let i = 0; i < list.length; i++) {
//             const index = (initialIndex + i) % list.length;
//             const selection = list[index];
//             const currentIngredients = getIngredients(selection);

//             const conflictsWithHistory = currentIngredients.some((ing) =>
//               history.recentIngredients.includes(ing),
//             );
//             const conflictsWithToday = currentIngredients.some((ing) =>
//               excludeIngredients.includes(ing),
//             );
//             const duplicateMealCombo = history.recentMeals.includes(selection);

//             if (
//               !duplicateMealCombo &&
//               !conflictsWithHistory &&
//               !conflictsWithToday
//             ) {
//               return index;
//             }
//             if (
//               !duplicateMealCombo &&
//               !conflictsWithToday &&
//               backupIndex === -1
//             ) {
//               backupIndex = index;
//             }
//           }

//           if (backupIndex !== -1) return backupIndex;
//           return initialIndex;
//         };

//         // 3. Process Selections Sequential Order
//         const bIndex = getDiverseIndex(1, breakfast, false);

//         // Get Lunch
//         const lIndex = getDiverseIndex(2, lunch, true);
//         const selectedLunch = lunch[lIndex];
//         const lunchIngredients = getIngredients(selectedLunch);

//         // Get Supper (Evaluates lunch ingredients to prevent overlap)
//         const sIndex = getDiverseIndex(3, supper, true, lunchIngredients);
//         const selectedSupper = supper[sIndex];
//         const supperIngredients = getIngredients(selectedSupper);

//         const fIndex = getDiverseIndex(4, fruits, false);

//         // 4. Populate Plan
//         plan[day] = {
//           breakfast: breakfast[bIndex],
//           lunch: selectedLunch,
//           supper: selectedSupper,
//           fruit: fruits[fIndex],
//         };

//         // 5. Commit Data to History Buffers
//         history.breakfast.push(breakfast[bIndex]);
//         if (history.breakfast.length > maxBreakfastHistory)
//           history.breakfast.shift();

//         history.fruit.push(fruits[fIndex]);
//         if (history.fruit.length > maxFruitHistory) history.fruit.shift();

//         // Main meals: Push full strings to history
//         history.recentMeals.push(selectedLunch, selectedSupper);
//         while (history.recentMeals.length > maxMealHistory) {
//           history.recentMeals.shift();
//         }

//         // Main meals: Push individual ingredients to history pool
//         history.recentIngredients.push(
//           ...lunchIngredients,
//           ...supperIngredients,
//         );
//         while (history.recentIngredients.length > maxIngredientHistory) {
//           history.recentIngredients.shift();
//         }
//       }

//       return plan;
//     };


// export { generateMealPlan };

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Helper: Shuffle array using seed
const shuffle = (array, seed) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateMealPlan = (year, month, foodList) => {
  const plan = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const { breakfast, lunch, supper, fruits } = foodList;

  // Pools for perfect frequency leveling
  const pools = {
    breakfast: [],
    lunch: [],
    supper: [],
    fruits: []
  };

  const history = {
    recentMeals: [],
    recentIngredients: [],
  };

  const maxMealHistory = 2;
  const maxIngredientHistory = 2;

  const getIngredients = (mealString) => {
    if (!mealString) return [];
    return mealString.toLowerCase().split(/\s*[\+\&]\s*/).map((item) => item.trim());
  };

  // Helper to get next item from shuffled pool with collision safety
  const getNextFromPool = (category, list, seed, excludeIngredients = []) => {
    if (pools[category].length === 0) {
      pools[category] = shuffle(list, seed);
    }

    // Try to find a valid item
    for (let i = 0; i < pools[category].length; i++) {
      const meal = pools[category][i];
      const ingredients = getIngredients(meal);
      
      const conflictsWithHistory = ingredients.some((ing) => history.recentIngredients.includes(ing));
      const conflictsWithToday = ingredients.some((ing) => excludeIngredients.includes(ing));
      const isRecent = history.recentMeals.includes(meal);

      if (!conflictsWithHistory && !conflictsWithToday && !isRecent) {
        return pools[category].splice(i, 1)[0];
      }
    }
    // Fallback: pop first if no ideal choice
    return pools[category].shift();
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const dailySeed = year * 10000 + month * 100 + day;

    const b = getNextFromPool('breakfast', breakfast, dailySeed + 1);
    const l = getNextFromPool('lunch', lunch, dailySeed + 2);
    const lIng = getIngredients(l);
    const s = getNextFromPool('supper', supper, dailySeed + 3, lIng);
    const sIng = getIngredients(s);
    const f = getNextFromPool('fruits', fruits, dailySeed + 4);

    plan[day] = { breakfast: b, lunch: l, supper: s, fruit: f };

    // Update History
    history.recentMeals.push(l, s);
    if (history.recentMeals.length > maxMealHistory * 2) history.recentMeals.splice(0, 2);

    history.recentIngredients.push(...lIng, ...sIng);
    while (history.recentIngredients.length > maxIngredientHistory * 2) history.recentIngredients.shift();
  }

  return plan;
};

export { generateMealPlan };