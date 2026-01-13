import { useState, useCallback, useMemo } from "react";
import { Plus, Calendar } from "lucide-react";

function App() {
  const defaultFoods = {
    breakfast: [
      "Chai & Mandazi",
      "Porridge",
      "Bread & Eggs",
      "Pancakes",
      "Uji",
      "Chapati & Beans",
    ],
    lunch: [
      "Rice & Beans",
      "Ugali & Sukuma",
      "Pilau",
      "Githeri",
      "Rice & Beef Stew",
      "Ugali & Fish",
      "Chapati & Chicken",
    ],
    supper: [
      "Ugali & Sukuma",
      "Rice & Vegetables",
      "Chapati & Stew",
      "Ugali & Beans",
      "Rice & Chicken",
      "Mukimo",
      "Ugali & Beef",
    ],
    fruits: [
      "Banana",
      "Mango",
      "Watermelon",
      "Pineapple",
      "Papaya",
      "Orange",
      "Avocado",
    ],
  };

  const [foods, setFoods] = useState(
    localStorage.getItem("foods")
      ? JSON.parse(localStorage.getItem("foods"))
      : defaultFoods
  );
  const [showAddFood, setShowAddFood] = useState(false);
  const [newFood, setNewFood] = useState({ name: "", category: "breakfast" });
  const [currentDate] = useState(new Date());

  const seededRandom = useCallback((seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }, []);

  const generateMealPlan = useCallback(
    (year, month, foodList) => {
      const plan = {};
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const { breakfast, lunch, supper, fruits } = foodList;

      for (let day = 1; day <= daysInMonth; day++) {
        const seed = year * 10000 + month * 100 + day;
        const breakfastIndex = Math.floor(
          seededRandom(seed * 1) * breakfast.length
        );
        const lunchIndex = Math.floor(seededRandom(seed * 2) * lunch.length);
        const supperIndex = Math.floor(seededRandom(seed * 3) * supper.length);
        const fruitIndex = Math.floor(seededRandom(seed * 4) * fruits.length);

        plan[day] = {
          breakfast: breakfast[breakfastIndex],
          lunch: lunch[lunchIndex],
          supper: supper[supperIndex],
          fruit: fruits[fruitIndex],
        };
      }
      return plan;
    },
    [seededRandom]
  );

  const mealPlan = useMemo(() => {
    return generateMealPlan(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      foods
    );
  }, [foods, currentDate, generateMealPlan]);

  const todaysMeals = mealPlan[currentDate.getDate()] || null;

  const addFood = () => {
    const foodName = newFood.name.trim();

    if (foodName) {
      const updatedFoods = {
        ...foods,
        [newFood.category]: [...foods[newFood.category], foodName],
      };

      setFoods(updatedFoods);

      localStorage.setItem("foods", JSON.stringify(updatedFoods));
      setNewFood((prev) => ({ ...prev, name: "" }));
    }
  };
  const removeFood = (category, foodToRemove) => {
    const updatedFoods = {
      ...foods,
      [category]: foods[category].filter((item) => item !== foodToRemove),
    };

    setFoods(updatedFoods);
    localStorage.setItem("foods", JSON.stringify(updatedFoods));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth();
  const date = currentDate.getDate();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = new Date().getDate();
  const isCurrentMonth =
    new Date().getMonth() === currentDate.getMonth() &&
    new Date().getFullYear() === currentDate.getFullYear();

  return (
    <div className="min-vh-100 bg-light p-4">
      <div className="container-xxl">
        {/* Header */}
        <div className="card shadow-sm border-0 p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2 text-secondary">
              <Calendar className="text-secondary" size={20} />
              <span className="h5 mb-0 fw-bold">
                {date}, {monthName}
              </span>
              <span className="text-muted">| Meal Planner</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        {todaysMeals && (
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h5 className="fw-bold text-dark mb-3">Today</h5>
            <div className="row row-cols-1 row-cols-md-4 g-3 small">
              <div className="col-6 col-md-3 mb-3">
                <div className="fw-bold mb-1" style={{ color: "orange" }}>
                  <i className="bi bi-cloud-sun"></i> Breakfast
                </div>
                <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                  <span
                    role="button"
                    className="rounded-2 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                    key={"breakfast"}
                  >
                    <i className="bi bi-check2-circle text-success"> </i>{" "}
                    {todaysMeals.breakfast}
                  </span>
                </div>
              </div>
              <div className="col-6 col-md-3 mb-3">
                <div className="fw-bold mb-1" style={{ color: "green" }}>
                  <i className="bi bi-brightness-high"></i> Lunch
                </div>
                <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                  <span
                    role="button"
                    className="rounded-2 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                    key={"lunch"}
                  >
                    <i className="bi bi-check2-circle text-success"> </i>{" "}
                    {todaysMeals.lunch}
                  </span>
                </div>
              </div>
              <div className="col-6 col-md-3 mb-3">
                <div className="fw-bold mb-1" style={{ color: "purple" }}>
                  <i className="bi bi-moon-stars"></i> Supper
                </div>
                <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                  <span
                    role="button"
                    className="rounded-2 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                    key={"supper"}
                  >
                    <i className="bi bi-check2-circle text-success"> </i>{" "}
                    {todaysMeals.supper}
                  </span>
                </div>
              </div>
              <div className="col-6 col-md-3 mb-3">
                <div className="fw-bold text-danger mb-1">
                  <i className="bi bi-apple"></i> Fruits
                </div>
                <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                  <span
                    role="button"
                    className="rounded-2 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                    key={"fruit"}
                  >
                    <i className="bi bi-check2-circle text-success"> </i>{" "}
                    {todaysMeals.fruit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="card shadow-sm border-0 p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-dark m-0">Available Foods</h5>
            <button
              onClick={() => setShowAddFood(!showAddFood)}
              className="p-2 px-4 text-light border-0 rounded-3 d-flex align-items-center gap-2 shadow small"
              style={{ background: "purple" }}
            >
              <Plus size={20} />
              Add Food
            </button>
          </div>
          <div className="row row-cols-1 row-cols-md-4 g-3 small">
            <div className="col-6 col-md-3 mb-3">
              <div className="fw-bold mb-1" style={{ color: "orange" }}>
                <i className="bi bi-cloud-sun"></i> Breakfast
              </div>
              <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                {foods.breakfast.map((breakfast) => (
                  <span
                    role="button"
                    className="p-1 px-2 border rounded-2"
                    key={breakfast}
                  >
                    {breakfast} &nbsp;
                    <i
                      className="bi bi-x text-danger"
                      title="Remove this item"
                      onClick={() => removeFood("breakfast", breakfast)}
                    ></i>
                  </span>
                ))}
              </div>
            </div>
            <div className="col-6 col-md-3 mb-3">
              <div className="fw-bold mb-1" style={{ color: "green" }}>
                <i className="bi bi-brightness-high"></i> Lunch
              </div>
              <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                {foods.lunch.map((lunch) => (
                  <span
                    role="button"
                    className="p-1 px-2 border rounded-2"
                    key={lunch}
                  >
                    {lunch} &nbsp;
                    <i
                      className="bi bi-x text-danger"
                      title="Remove this item"
                      onClick={() => removeFood("lunch", lunch)}
                    ></i>
                  </span>
                ))}
              </div>
            </div>
            <div className="col-6 col-md-3 mb-3">
              <div className="fw-bold mb-1" style={{ color: "purple" }}>
                <i className="bi bi-moon-stars"></i> Supper
              </div>
              <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                {foods.supper.map((supper) => (
                  <span
                    role="button"
                    className="p-1 px-2 border rounded-2"
                    key={supper}
                  >
                    {supper} &nbsp;
                    <i
                      className="bi bi-x text-danger"
                      title="Remove this item"
                      onClick={() => removeFood("supper", supper)}
                    ></i>
                  </span>
                ))}
              </div>
            </div>
            <div className="col-6 col-md-3 mb-3">
              <div className="fw-bold text-danger mb-1">
                <i className="bi bi-apple"></i> Fruits
              </div>
              <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                {foods.fruits.map((fruit) => (
                  <span
                    role="button"
                    className="p-1 px-2 border rounded-2"
                    key={fruit}
                  >
                    {fruit} &nbsp;
                    <i
                      className="bi bi-x text-danger"
                      title="Remove this item"
                      onClick={() => removeFood("fruits", fruit)}
                    ></i>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Add Food Form */}
          {showAddFood && (
            <div className="bg-light p-3 rounded mb-3 mt-3 border">
              <div className="d-flex gap-2">
                <input
                  type="text"
                  value={newFood.name}
                  onChange={(e) =>
                    setNewFood({ ...newFood, name: e.target.value })
                  }
                  autoFocus
                  placeholder="Food name..."
                  className="form-control shadow-none"
                  onKeyPress={(e) => e.key === "Enter" && addFood()}
                />
                <select
                  value={newFood.category}
                  onChange={(e) =>
                    setNewFood({ ...newFood, category: e.target.value })
                  }
                  className="form-select w-auto shadow-none"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="supper">Supper</option>
                  <option value="fruits">Fruits</option>
                </select>
                <button
                  onClick={addFood}
                  className="p-2 px-4 text-light border-0 rounded-3 d-flex align-items-center gap-2 shadow"
                  style={{ background: "purple" }}
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="card shadow-sm border-0 p-4">
          <div style={{ overflowX: "auto" }}>
            <div
              className="d-grid gap-2 w-100"
              style={{
                gridTemplateColumns: "repeat(7, 1fr)",
                minWidth: "800px", // Prevents squishing and maintains alignment on small screens
              }}
            >
              {/* 1. Header Row (Sun-Sat) - Now sharing the same grid parent */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center fw-bold text-muted py-2">
                  {day}
                </div>
              ))}

              {/* 2. Empty cells for previous month padding */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="ratio ratio-1x1" />
              ))}

              {/* 3. Calendar days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const meals = mealPlan[day];
                const isToday = isCurrentMonth && day === today;

                return (
                  <div
                    key={day}
                    className={`border rounded p-2 ${
                      isToday
                        ? "bg-light bg-opacity-10 border-success border-2 shadow"
                        : "bg-white text-dark"
                    }`}
                    style={{ minHeight: "120px" }}
                  >
                    <div
                      className={`small fw-semibold text-end mb-1 fs-1 ${
                        isToday ? "text-success" : "text-muted"
                      }`}
                    >
                      {isToday && <span className="small fs-6 text-muted">Today</span>} {day}
                    </div>
                    <div
                      className="d-flex flex-column gap-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <div
                        className="bg-opacity-25 rounded p-1 text-dark"
                        title="Breakfast"
                      >
                        <div className="fw-bold mb-1">
                          <i
                            className="bi bi-cloud-sun"
                            style={{ color: "orange" }}
                          ></i>
                        </div>
                        <div className="text-truncate small">
                          {meals.breakfast}
                        </div>
                      </div>
                      <div
                        className="bg-opacity-25 rounded p-1 text-dark"
                        title="Lunch"
                      >
                        <div className="fw-bold mb-1">
                          <i
                            className="bi bi-brightness-high"
                            style={{ color: "green" }}
                          ></i>
                        </div>
                        <div className="text-truncate small">{meals.lunch}</div>
                      </div>
                      <div
                        className="bg-opacity-25 rounded p-1 text-dark"
                        title="Supper"
                      >
                        <div className="fw-bold mb-1">
                          <i
                            className="bi bi-moon-stars"
                            style={{ color: "purple" }}
                          ></i>
                        </div>
                        <div className="text-truncate small">
                          {meals.supper}
                        </div>
                      </div>
                    </div>
                    <div
                      className="bg-opacity-25 shadow-sm d-flex alert-success px-2 small mt-1 align-items-center gap-2 small rounded p-1 text-dark"
                      title="Fruits"
                    >
                      <div className="fw-bold">
                        <i className="bi bi-apple"></i>
                      </div>
                      <div className="text-truncate">{meals.fruit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
