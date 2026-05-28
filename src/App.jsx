import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Alert,
  Avatar,
  Backdrop,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Chip,
  CircularProgress,
  Fade,
  Modal,
  Snackbar,
  Typography,
} from "@mui/material";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import {
  AddOutlined,
  CalendarTodayOutlined,
  HomeOutlined,
  LogoutOutlined,
} from "@mui/icons-material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  // width: 400,
  bgcolor: "background.paper",
  boxShadow: 4,
  borderRadius: 4,
  p: 4,
};

const others = [
  { name: "Alice", profile_pic: "alice.jpg" },
  { name: "Bob", profile_pic: "bob.jpg" },
  { name: "Charlie", profile_pic: "charlie.jpg" },
]; // Example number of other friends

function App() {
  const defaultFoods = {
    breakfast: [
      "Chai + Mandazi",
      "Porridge",
      "Bread + Eggs",
      "Chapati + Beans",
      "Pancakes",
      "Yams",
      "Sweet Potatoes",
    ],
    lunch: [
      "Rice + Beans",
      "Ugali + Sukuma",
      "Pilau",
      "Githeri",
      "Rice + Beef Stew",
      "Ugali + Fish",
      "Chapati + Chicken",
      "Fries + Chips + Salad",
    ],
    supper: [
      "Ugali + Sukuma",
      "Rice + Vegetables",
      "Chapati + Stew",
      "Ugali + Beans",
      "Rice + Chicken",
      "Mukimo",
      "Ugali + Beef",
      "Pilau",
      "Githeri",
      "Ugali + Fish",
      "Rice + Beef Stew",
    ],
    fruits: [
      "Banana",
      "Mango",
      "Watermelon",
      "Pineapple",
      "Lettuce",
      "Orange",
      "Avocado",
      "Apples",
      "Fruit Salad",
    ],
  };

  const [currentPage, setCurrentPage] = useState(0);
  const [open, setOpen] = useState([false, {}, ""]);
  const [error, setError] = useState([false, "", ""]);
  const handleClose = () => setOpen([false, {}, ""]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // The Data (Meals, Onboarded, Name)
  const [newFood, setNewFood] = useState({ name: "", category: "breakfast" });
  const [currentDate] = useState(new Date());
  const seededRandom = useCallback((seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }, []);

  // const generateMealPlan = useCallback(
  //   (year, month, foodList) => {
  //     const plan = {};
  //     const daysInMonth = new Date(year, month + 1, 0).getDate();
  //     const { breakfast, lunch, supper, fruits } = foodList;

  //     // 1. Initialize History Buffers for each category
  //     const history = {
  //       breakfast: [],
  //       lunch: [],
  //       supper: [],
  //       fruit: [],
  //     };

  //     for (let day = 1; day <= daysInMonth; day++) {
  //       const seed = year * 10000 + month * 100 + day;

  //       // 2. Diversified Selection Helper
  //       const getDiverseIndex = (
  //         seedMultiplier,
  //         list,
  //         categoryHistory,
  //         excludeItem = null,
  //       ) => {
  //         let index = Math.floor(
  //           seededRandom(seed * seedMultiplier) * list.length,
  //         );
  //         let selection = list[index];

  //         let attempts = 0;
  //         // Check if selection exists in the last 5 days OR matches excludeItem (today's other meal)
  //         while (
  //           (categoryHistory.includes(selection) ||
  //             selection === excludeItem) &&
  //           attempts < list.length
  //         ) {
  //           index = (index + 1) % list.length;
  //           selection = list[index];
  //           attempts++;
  //         }
  //         return index;
  //       };

  //       // 3. Generate indices using the 5-day history
  //       const bIndex = getDiverseIndex(1, breakfast, history.breakfast);
  //       const lIndex = getDiverseIndex(2, lunch, (history.lunch).map((item) => item?.includes(" + ") ? item.split(" + ") : [item]).flat());

  //       // Supper check: Avoid 5-day history AND today's lunch
  //       const sIndex = getDiverseIndex(
  //         3,
  //         supper,
  //         history.supper,
  //         (lunch[lIndex])?.includes(" + ")
  //           ? lunch[lIndex].split(" + ")[0] // If lunch has " + ", take the first part for comparison
  //           : lunch[lIndex], // Otherwise, use it directly
  //       );

  //       const fIndex = getDiverseIndex(4, fruits, history.fruit);

  //       // 4. Assign to plan
  //       const selectedBreakfast = breakfast[bIndex];
  //       const selectedLunch = lunch[lIndex];
  //       const selectedSupper = supper[sIndex];
  //       const selectedFruit = fruits[fIndex];

  //       plan[day] = {
  //         breakfast: selectedBreakfast,
  //         lunch: selectedLunch,
  //         supper: selectedSupper,
  //         fruit: selectedFruit,
  //       };

  //       // 5. Update History (Maintain sliding window of 5)
  //       const updateHistory = (cat, item) => {
  //         history[cat].push(item);
  //         if (history[cat].length > 5) history[cat].shift();
  //       };

  //       updateHistory("breakfast", selectedBreakfast);
  //       updateHistory("lunch", selectedLunch);
  //       updateHistory("supper", selectedSupper);
  //       updateHistory("fruit", selectedFruit);
  //     }

  //     return plan;
  //   },
  //   [seededRandom],
  // );

  const generateMealPlan = useCallback(
    (year, month, foodList) => {
      const plan = {};
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const { breakfast, lunch, supper, fruits } = foodList;

      // 1. Specialized History Buffers
      const history = {
        breakfast: [],
        fruit: [],
        recentMeals: [], // Tracks full strings (e.g., "Rice + Chicken") to stop back-to-back days
        recentIngredients: [], // Tracks base items (e.g., "rice") with a short memory window
      };

      // Static safety windows optimized for your specific list sizes
      const maxBreakfastHistory = Math.max(1, breakfast.length - 2); // Remembers last 5 days
      // const maxFruitHistory = Math.max(1, fruits.length - 1);
      // Remembers last 2 days
      const maxFruitHistory = 2;
      const maxMealHistory = 4; // Prevents exact lunch/supper combo duplication for 2 full days
      const maxIngredientHistory = 8; // Remembers base ingredients for roughly 24 hours

      // Helper to split and clean up meal ingredients safely
      const getIngredients = (mealString) => {
        if (!mealString) return [];
        return mealString
          .toLowerCase()
          .split(/\s*\+\s*/)
          .map((item) => item.trim());
      };

      for (let day = 1; day <= daysInMonth; day++) {
        const seed = year * 10000 + month * 100 + day;

        const getDiverseIndex = (
          seedMultiplier,
          list,
          isMainMeal = false,
          excludeIngredients = [],
        ) => {
          const seedValue = seededRandom(seed * seedMultiplier);

          // --- NEW LOGIC FOR FRUITS & BREAKFAST ---
          if (!isMainMeal) {
            const targetHistory =
              list === breakfast ? history.breakfast : history.fruit;

            // 1. Gather all items from the list that are NOT in the history window
            const validChoices = list.filter(
              (item) => !targetHistory.includes(item),
            );

            // 2. If we have choices that don't violate history, pick randomly from THEM
            if (validChoices.length > 0) {
              const chosenItem =
                validChoices[Math.floor(seedValue * validChoices.length)];
              return list.indexOf(chosenItem);
            }

            // Fallback if history window is somehow completely full (impossible with window = 2 and list = 4)
            return Math.floor(seedValue * list.length);
          }

          // --- MAIN MEAL LOGIC (LUNCH & SUPPER) ---
          // Keeps your working tiered lookup for complex broken-down ingredient strings
          const initialIndex = Math.floor(seedValue * list.length);
          let backupIndex = -1;

          for (let i = 0; i < list.length; i++) {
            const index = (initialIndex + i) % list.length;
            const selection = list[index];
            const currentIngredients = getIngredients(selection);

            const conflictsWithHistory = currentIngredients.some((ing) =>
              history.recentIngredients.includes(ing),
            );
            const conflictsWithToday = currentIngredients.some((ing) =>
              excludeIngredients.includes(ing),
            );
            const duplicateMealCombo = history.recentMeals.includes(selection);

            if (
              !duplicateMealCombo &&
              !conflictsWithHistory &&
              !conflictsWithToday
            ) {
              return index;
            }
            if (
              !duplicateMealCombo &&
              !conflictsWithToday &&
              backupIndex === -1
            ) {
              backupIndex = index;
            }
          }

          if (backupIndex !== -1) return backupIndex;
          return initialIndex;
        };

        // 3. Process Selections Sequential Order
        const bIndex = getDiverseIndex(1, breakfast, false);

        // Get Lunch
        const lIndex = getDiverseIndex(2, lunch, true);
        const selectedLunch = lunch[lIndex];
        const lunchIngredients = getIngredients(selectedLunch);

        // Get Supper (Evaluates lunch ingredients to prevent overlap)
        const sIndex = getDiverseIndex(3, supper, true, lunchIngredients);
        const selectedSupper = supper[sIndex];
        const supperIngredients = getIngredients(selectedSupper);

        const fIndex = getDiverseIndex(4, fruits, false);

        // 4. Populate Plan
        plan[day] = {
          breakfast: breakfast[bIndex],
          lunch: selectedLunch,
          supper: selectedSupper,
          fruit: fruits[fIndex],
        };

        // 5. Commit Data to History Buffers
        history.breakfast.push(breakfast[bIndex]);
        if (history.breakfast.length > maxBreakfastHistory)
          history.breakfast.shift();

        history.fruit.push(fruits[fIndex]);
        if (history.fruit.length > maxFruitHistory) history.fruit.shift();

        // Main meals: Push full strings to history
        history.recentMeals.push(selectedLunch, selectedSupper);
        while (history.recentMeals.length > maxMealHistory) {
          history.recentMeals.shift();
        }

        // Main meals: Push individual ingredients to history pool
        history.recentIngredients.push(
          ...lunchIngredients,
          ...supperIngredients,
        );
        while (history.recentIngredients.length > maxIngredientHistory) {
          history.recentIngredients.shift();
        }
      }

      return plan;
    },
    [seededRandom],
  );
  const mealPlan = useMemo(() => {
    if (!session?.user?.id) return {};

    // If DB is empty, use empty arrays for all categories
    const currentFoods = profile?.meals || {
      breakfast: [],
      lunch: [],
      supper: [],
      fruits: [],
    };

    return generateMealPlan(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentFoods,
    );
  }, [session?.user?.id, profile?.meals, currentDate, generateMealPlan]);

  const todaysMeals = mealPlan[currentDate.getDate()] || null;

  useEffect(() => {
    setLoading(true);

    // 1. Get Initial Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false); // No user? Stop loading.
    });

    // 2. Auth Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "SIGNED_OUT") {
        setProfile(null); // Clear profile on logout
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("planner_profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        setToast({
          open: true,
          message: "Server failed: " + error,
          severity: "error",
        });
        return;
      }
      const userData = session.user;

      if (data) {
        setProfile({
          ...data,
          email: userData?.email,
          email_confirmed_at: userData?.email_confirmed_at,
          created_at: userData?.created_at,
          last_sign_in_at: userData?.last_sign_in_at,
        }); // This is your "source of truth" now
      } else {
        setProfile({ onboarded: false }); // User exists but no profile yet
      }

      // Final stop for the initial loader
      setTimeout(() => setLoading(false), 1000);
    };

    fetchProfile();
  }, [session?.user?.id]);

  const addFood = async () => {
    const foodName = newFood.name.trim();
    const currentMeals = profile?.meals || defaultFoods;
    setError([false, "", ""]);

    if (currentMeals[newFood.category].includes(foodName)) {
      setToast({
        open: true,
        message: `The food "${foodName}" already exists in the ${newFood.category} list}!`,
        severity: "warning",
      });
      setError([
        true,
        "addFood",
        `The food "${foodName}" already exists in the ${newFood.category} list!`,
      ]);

      return;
    }
    // Use profile and session.user.id as the requirements
    if (!foodName || !session?.user?.id) return;

    // 1. Source from profile state (fallback to defaultFoods if profile isn't loaded)

    const updatedMeals = {
      ...currentMeals,
      [newFood.category]: [...(currentMeals[newFood.category] || []), foodName],
    };

    // 2. Update Supabase
    const { error } = await supabase.from("planner_profiles").upsert({
      id: session.user.id,
      meals: updatedMeals,
    });

    if (error) {
      setToast({
        open: true,
        message: "Sync failed: " + error.message,
        severity: "error",
      });
    } else {
      // 3. Update the PROFILE state specifically
      setProfile((prev) => ({
        ...prev,
        meals: updatedMeals,
      }));

      setNewFood((prev) => ({ ...prev, name: "" }));
      setCurrentPage(0);

      setToast({
        open: true,
        message: `Successfully added "${foodName}" to ${newFood.category} meals!`,
        severity: "success",
      });
    }
  };

  const removeFood = async (category, foodToRemove) => {
    if (!session?.user?.id || !profile?.meals) return;

    const currentMeals = profile.meals;
    const updatedMeals = {
      ...currentMeals,
      [category]: currentMeals[category].filter(
        (item) => item !== foodToRemove,
      ),
    };

    const { error } = await supabase.from("planner_profiles").upsert({
      id: session.user.id,
      meals: updatedMeals,
    });

    if (error) {
      setToast({ open: true, message: "Failed to remove", severity: "error" });
    } else {
      // Update the PROFILE state specifically
      setProfile((prev) => ({
        ...prev,
        meals: updatedMeals,
      }));
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth();
  const monthName = currentDate.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const today = new Date().getDate();
  const isCurrentMonth =
    new Date().getMonth() === currentDate.getMonth() &&
    new Date().getFullYear() === currentDate.getFullYear();

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const handleCloseToast = (event, reason) => {
    if (reason === "clickaway") return;
    setToast({ ...toast, open: false });
  };

  const Invite = () => {
    return (
      <div className="card shadow-sm border-0 p-4 mb-4">
        <h5 className="fw-bold text-dark m-0 mb-3">Invite Friends</h5>
        <span className="fw-semibold mb-3 small text-secondary">
          Connect and share your meal plans with friends and family!
        </span>
        <div className="d-flex flex-wrap gap-3 align-items-center">
          {/* you  */}
          <Badge
            variant="dot"
            color="success"
            overlap="circular"
            badgeContent=" "
            sx={{
              "& .MuiBadge-dot": {
                height: 15, // Default dot is 8px, standard is ~20px. 12px is the sweet spot.
                width: 15,
                borderRadius: "50%",
              },
            }}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Avatar
              style={{ width: 70, height: 70 }}
              alt={profile?.display_name}
              src={profile?.avatar_url}
              title={`${profile?.display_name} (You)`}
              className="border shadow-sm border-2 border-primary"
            />
          </Badge>
          {others.map((friend, index) => (
            <Avatar
              title={friend.name}
              src={friend.profile_pic}
              key={index}
              style={{ width: 70, height: 70 }}
              className="border shadow-sm border-2 border-light"
            />
          ))}
          <button
            style={{ width: 50, height: 50 }}
            className="text-dark border-0 rounded-circle d-flex align-items-center justify-content-center gap-2 shadow small"
          >
            <AddOutlined size={20} />
          </button>
        </div>
      </div>
    );
  };

  const Share = () => {
    return (
      <div className="card shadow-sm border-0 p-4 mb-4">
        <h5 className="fw-bold text-dark m-0 mb-3">Share with Friends</h5>
        <span className="fw-semibold mb-3 small text-secondary">
          Share the joy of meal planning with your loved ones!
        </span>
        <div className="d-flex flex-wrap gap-3 align-items-center">
          {["facebook", "twitter", "instagram", "whatsapp", "telegram"].map(
            (social, index) => (
              <button
                key={index}
                style={{ width: 40, height: 40 }}
                onClick={() => {
                  const shareData = {
                    title: "Check out my meal plan!",
                    text: "I've been using this awesome meal planner app to organize my meals. Check it out!",
                  };
                  navigator.share(shareData);
                }}
                className="text-dark border-0 rounded-circle d-flex align-items-center justify-content-center gap-2 shadow small"
              >
                <i className={`fab fs-5 fa-${social}`}></i>
              </button>
            ),
          )}
        </div>
      </div>
    );
  };

  const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("login"); // 'login', 'signup', 'reset'
    const [fullName, setFullName] = useState("");

    const handleLogin = async (e) => {
      e.preventDefault();
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setToast({
          open: true,
          message: error.message,
          severity: "error",
        });
      }
    };

    const handleSignUp = async (e) => {
      e.preventDefault();
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: fullName } },
      });
      if (error) {
        setToast({
          open: true,
          message: "Check your email for confirmation!",
          severity: "error",
        });
      } else
        setToast({
          open: true,
          message: "Account created successfully!",
          severity: "success",
        });
      setLoading(false);
      setView("onboarding");
    };

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 authBg">
        {view === "onboarding" && "We are onboardingbaby"}
        <div
          id="logreg-forms"
          className="authCard"
          style={{ width: "100%", maxWidth: "480px", margin: "1rem" }}
        >
          {/* SIGN IN FORM */}
          {view === "login" && (
            <form className="form-signin p-5" onSubmit={handleLogin}>
              <div className="text-center mb-4">
                <div className="authLogo mb-3">🍽️</div>
                <h1 className="h2 fw-bold mb-2">Welcome back</h1>
                <p className="text-muted small">
                  Please enter your details to sign in
                </p>
              </div>

              <div className="mb-3">
                <label className="form-label fw-600 small mb-2">
                  Your Email Address
                </label>
                <input
                  type="email"
                  className="form-control authInput"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-600 small mb-2">Password</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control authInput"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="authPasswordToggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-slash"></i>
                    ) : (
                      <i className="bi bi-eye"></i>
                    )}
                  </button>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor="rememberMe"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setView("reset")}
                  className="authLink small"
                >
                  Forgot password?
                </button>
              </div>

              <button
                className="btn btn-dark w-100 fw-600 py-2 mb-4 authSignInBtn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Loading..." : "Sign in"}
              </button>

              <div className="text-center">
                <span className="text-muted small">
                  Don't have an account?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => setView("signup")}
                  className="authLink small fw-600"
                >
                  Sign up
                </button>
              </div>
            </form>
          )}

          {/* PASSWORD RESET FORM */}
          {view === "reset" && (
            <form className="form-reset p-5">
              <div className="text-center mb-4">
                <div className="authLogo mb-3">🍽️</div>
                <h1 className="h2 fw-bold mb-2">Reset Password</h1>
                <p className="text-muted small">
                  Enter your email to receive a reset link
                </p>
              </div>

              <div className="mb-4">
                <label className="form-label fw-600 small mb-2">
                  Your Email Address
                </label>
                <input
                  type="email"
                  className="form-control authInput"
                  placeholder="Your Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                className="btn btn-dark w-100 fw-600 py-3 mb-3 authSignInBtn"
                type="submit"
              >
                Reset Password
              </button>
              <button
                type="button"
                onClick={() => setView("login")}
                className="authLink d-block w-100 text-center small fw-600"
              >
                Back to sign in
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {view === "signup" && (
            <form className="form-signup p-5" onSubmit={handleSignUp}>
              <div className="text-center mb-4">
                <div className="authLogo mb-3">🍽️</div>
                <h1 className="h2 fw-bold mb-2">Create account</h1>
                <p className="text-muted small">
                  Join us to start planning your meals
                </p>
              </div>

              <div className="mb-3">
                <label className="form-label fw-600 small mb-2">Username</label>
                <input
                  type="text"
                  className="form-control authInput"
                  placeholder="e.g @User_577"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-600 small mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control authInput"
                  placeholder="Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-600 small mb-2">Password</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control authInput"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="authPasswordToggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-slash"></i>
                    ) : (
                      <i className="bi bi-eye"></i>
                    )}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-600 small mb-2">
                  Confirm Password
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control authInput"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="authPasswordToggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-slash"></i>
                    ) : (
                      <i className="bi bi-eye"></i>
                    )}
                  </button>
                </div>
              </div>

              <button
                className="btn btn-dark w-100 fw-600 py-2 mb-3 authSignInBtn"
                type="submit"
              >
                Sign Up
              </button>

              <div className="text-center">
                <span className="text-muted small">
                  Already have an account?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="authLink small fw-600"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  const Onboarding = ({ session, setSession }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      gender: "",
      age_group: "",
      meals: { breakfast: [], lunch: [], supper: [], fruits: [] },
    });

    const handleComplete = async () => {
      // 1. Strict Validation
      const isReady = Object.values(formData.meals).every(
        (cat) => cat.length >= 3,
      );

      if (!isReady) {
        alert("Please select at least 3 items for every category!");
        return;
      }

      // 2. Database Update
      // Explicitly mapping fields to ensure they match your table columns
      const { error } = await supabase
        .from("planner_profiles")
        .update({
          gender: formData.gender,
          age_group: formData.age_group, // Ensure column name is exactly age_group in DB
          meals: formData.meals,
          onboarded: true,
        })
        .eq("id", session.user.id);

      if (error) {
        console.error("Update failed:", error.message);
        return;
      }

      // 3. Precise Session Update
      // Instead of spreading formData (which has a nested meals object),
      // we spread it explicitly to match the session.user structure
      setSession((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          gender: formData.gender,
          age_group: formData.age_group,
          meals: formData.meals,
          onboarded: true,
        },
      }));
      window.location.reload;
    };

    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center">
        <div className="container onboarding-card border shadow rounded-5 p-4">
          <h5 className="primary-text fw-bold">WELCOME</h5>
          <p className="text-muted">
            Hello there, let's get started. This will take less than a
            minute...{" "}
          </p>
          {step === 1 && (
            <section>
              <h3>Gender</h3>
              <div className="p-2 mt-4 mb-2 d-flex flex-wrap flex-md-nowrap gap-3">
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    className={`w-100 outline-0 shadow-sm rounded-4 p-5 small border-0`}
                    key={g}
                    onClick={() => {
                      setFormData({ ...formData, gender: g });
                    }}
                    style={{
                      background:
                        formData?.gender === g ? "#6a0dada1" : "gainsboro",
                      color: formData?.gender === g ? "white" : "black",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="d-flex justify-content-end">
                <button
                  disabled={!formData?.gender}
                  className="p-2 px-4 text-light border-0 rounded-3 d-flex align-items-center gap-2 shadow small"
                  style={{
                    background: formData?.gender ? "#6A0DAD" : "#ccc",
                    cursor: formData?.gender ? "pointer" : "not-allowed",
                  }}
                  onClick={() => setStep(2)}
                >
                  Continue <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h3>Age Group</h3>
              <div className="p-2 mt-4 mb-2 d-flex flex-wrap flex-md-nowrap gap-3">
                {["Child", "Teen", "Adult", "Senior"].map((g) => (
                  <button
                    className={`w-100 outline-0 shadow-sm rounded-4 p-5 small border-0`}
                    key={g}
                    onClick={() => {
                      setFormData({ ...formData, age_group: g });
                    }}
                    style={{
                      background:
                        formData?.age_group === g ? "#6a0dada1" : "gainsboro",
                      color: formData?.age_group === g ? "white" : "black",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="d-flex justify-content-end">
                <button
                  disabled={!formData?.age_group}
                  className="p-2 px-4 text-light border-0 rounded-3 d-flex align-items-center gap-2 shadow small"
                  onClick={() => setStep(3)}
                  style={{
                    background: formData?.age_group ? "#6A0DAD" : "#ccc",
                    cursor: formData?.age_group ? "pointer" : "not-allowed",
                  }}
                >
                  Continue <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </section>
          )}

          {step === 3 &&
            (() => {
              // 1. Validation Logic: Check if every category has at least 3 items
              const isValid = Object.keys(defaultFoods).every(
                (category) => formData.meals[category].length >= 3,
              );
              return (
                <section>
                  <h3>Starter Pack</h3>
                  <p className="text-muted small">
                    Select at least 3 meals for each category. You can select
                    more if you like. You can always modify your selection
                    later.
                  </p>
                  {Object.keys(defaultFoods).map((category) => (
                    <div
                      key={category}
                      className="mb-4 bg-light p-2 border-left border-2 border-primary rounded"
                    >
                      <h4
                        style={{
                          textTransform: "uppercase",
                          fontSize: "0.9rem",
                          color: "#666",
                        }}
                      >
                        {category}
                      </h4>
                      <div
                        className="py-1 gap-2"
                        style={{ display: "flex", flexWrap: "wrap" }}
                      >
                        {defaultFoods[category].map((food) => {
                          const isSelected =
                            formData.meals[category].includes(food);

                          return (
                            <Chip
                              key={food}
                              label={food + " "}
                              variant={isSelected ? "filled" : "outlined"}
                              onClick={() => {
                                const list = formData.meals[category];
                                const newItems = isSelected
                                  ? list.filter((i) => i !== food) // Remove if already there
                                  : [...list, food]; // Add if not there

                                setFormData({
                                  ...formData,
                                  meals: {
                                    ...formData.meals,
                                    [category]: newItems,
                                  },
                                });
                              }}
                              onDelete={() => {
                                console.log("removed");
                              }}
                              style={{
                                transition: "all 0.2s",
                                background: isSelected
                                  ? "#6A0DAD"
                                  : "transparent",
                                color: isSelected ? "white" : "inherit",
                                borderColor: isSelected ? "#6A0DAD" : "#ccc",
                                cursor: "pointer",
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    disabled={!isValid}
                    style={{
                      background: isValid ? "#6A0DAD" : "#ccc",
                      cursor: isValid ? "pointer" : "not-allowed",
                    }}
                    className="p-2 px-4 text-light border-0 rounded-3 d-flex align-items-center gap-2 shadow small"
                    onClick={handleComplete}
                  >
                    Finish & Generate Plan
                  </button>
                </section>
              );
            })()}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex gap-3 flex-column justify-content-center align-items-center">
        <CircularProgress
          size={28}
          color="primary"
          sx={{
            // Change the duration here (e.g., '0.5s' for fast, '3s' for slow)
            animationDuration: "700ms",
            "& .MuiCircularProgress-circle": {
              // This ensures the internal stroke animation matches the speed
              animationDuration: "700ms",
            },
          }}
        />{" "}
        <span>Just a moment ...</span>
      </div>
    );
  }
  // change sign to ===
  if (profile && profile?.onboarded === false) {
    return <Onboarding session={session} setSession={setSession} />;
  }

  // console.log("default: ", defaultFoods[newFood.category], "profile: ", profile?.meals?.[newFood.category], "todays: ", todaysMeals);
  return (
    <>
      {profile?.onboarded !== undefined ? (
        <div className="min-vh-100 bg-light">
          <div className="container-xxl">
            {/* Header */}
            <div className="mainHeader mt-3 mb-5 d-flex flex-column justify-content-between">
              <div className="d-flex mb-4 justify-content-between align-items-center gap-3">
                <div className="">
                  <div className="h4 fw-bold mb-1">
                    Hello {profile?.display_name},
                  </div>

                  <div className="small">Lets plan what to eat together.</div>
                </div>
                <div className="d-flex align-items-center gap-3 text-white">
                  <div
                    className="d-flex align-items-center gap-3"
                    role="button"
                    onClick={() => setCurrentPage(2)}
                  >
                    <Badge
                      variant="dot"
                      color="success"
                      overlap="circular"
                      badgeContent=" "
                      sx={{
                        "& .MuiBadge-dot": {
                          height: 15, // Default dot is 8px, standard is ~20px. 12px is the sweet spot.
                          width: 15,
                          borderRadius: "50%",
                        },
                      }}
                      anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                      <Avatar
                        alt={profile?.display_name}
                        sx={{ background: "rgba(255,255,255,0.18)" }}
                        src={profile?.avatar_url}
                        className="bg-light"
                      />
                    </Badge>
                    <div className="d-flex flex-column">
                      <span className="fw-semibold">
                        {/* {profile?.display_name} */}
                        You
                      </span>
                      <span className="small text-white-50">Ready to plan</span>
                    </div>
                  </div>
                  {/* to handle logout
                  <LogOut onClic={handleLogout} size={20} title="Logout" /> */}
                </div>
              </div>
              <div className="d-flex justify-content-end align-items-center gap-2 text-white-75">
                <CalendarTodayOutlined size={20} />
                <span className="fw-semibold">{monthName}</span>
              </div>
            </div>
            {currentPage === 0 ? (
              <section>
                {todaysMeals && (
                  <div className="card shadow-sm border-0 p-4 mb-4">
                    <h5 className="fw-bold text-dark mb-2 mt-5">Today</h5>
                    <span className="fw-semibold mb-3 small text-secondary">
                      {monthName}
                    </span>
                    <div className="row row-cols-1 row-cols-md-4 g-3 small">
                      <div className="col-6 col-md-3 mb-3">
                        <div
                          className="fw-bold mb-1"
                          style={{ color: "orange" }}
                        >
                          <i className="bi bi-cloud-sun"></i> Breakfast
                        </div>
                        <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                          <div
                            role="button"
                            className="rounded-2 w-100 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                            key={"breakfast"}
                          >
                            <i className="bi bi-check2-circle text-success">
                              {" "}
                            </i>{" "}
                            {todaysMeals.breakfast}
                          </div>
                        </div>
                      </div>
                      <div className="col-6 col-md-3 mb-3">
                        <div
                          className="fw-bold mb-1"
                          style={{ color: "green" }}
                        >
                          <i className="bi bi-brightness-high"></i> Lunch
                        </div>
                        <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                          <div
                            role="button"
                            className="rounded-2 w-100 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                            key={"lunch"}
                          >
                            <i className="bi bi-check2-circle text-success">
                              {" "}
                            </i>{" "}
                            {todaysMeals.lunch}
                          </div>
                        </div>
                      </div>
                      <div className="col-6 col-md-3 mb-3">
                        <div
                          className="fw-bold mb-1"
                          style={{ color: "#6A0DAD" }}
                        >
                          <i className="bi bi-moon-stars"></i> Supper
                        </div>
                        <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                          <div
                            role="button"
                            className="rounded-2 w-100 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                            key={"supper"}
                          >
                            <i className="bi bi-check2-circle text-success">
                              {" "}
                            </i>{" "}
                            {todaysMeals.supper}
                          </div>
                        </div>
                      </div>
                      <div className="col-6 col-md-3 mb-3">
                        <div className="fw-bold text-danger mb-1">
                          <i className="bi bi-apple"></i> Fruits/Salads
                        </div>
                        <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                          <div
                            role="button"
                            className="rounded-2 w-100 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                            key={"fruit"}
                          >
                            <i className="bi bi-check2-circle text-success">
                              {" "}
                            </i>{" "}
                            {todaysMeals.fruit}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="card shadow-sm border-0 p-4 mb-4">
                  <div className="alert alert-primary">
                    <strong>Usage Tips! </strong> You can customize your meals
                    below add, remove or modify existing items to match your
                    preferences.
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark m-0">Available Foods</h5>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="p-2 px-4 text-light border-0 rounded-3 d-flex align-items-center gap-2 shadow small"
                      style={{
                        background:
                          "linear-gradient(135deg, #6a0dad 0%, #392b8d 65%, #1f1a4b 100%)",
                      }}
                    >
                      <AddOutlined size={20} />
                      Add Food
                    </button>
                  </div>
                  <div className="row row-cols-1 row-cols-md-4 g-3 small">
                    <div className="col-6 col-md-3 mb-3">
                      <div className="fw-bold mb-1" style={{ color: "orange" }}>
                        <i className="bi bi-cloud-sun"></i> Breakfast
                      </div>
                      <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                        {profile?.meals?.breakfast.map((breakfast, i) => (
                          <div
                            role="button"
                            className="p-1 w-100 px-2 border rounded-2 bg-light d-flex justify-content-between align-items-center"
                            key={i}
                          >
                            {i + 1}. {breakfast} &nbsp;
                            <i
                              className="bi bi-x text-danger"
                              title="Remove this item"
                              onClick={() => removeFood("breakfast", breakfast)}
                            ></i>
                          </div>
                        ))}
                        <div
                          role="button"
                          title="Add new Breakfast item"
                          className="p-1 w-100 text-primary border-primary px-2 border rounded-2 mt-2 bg-transparent justify-content-center d-flex align-items-center"
                          onClick={() => {
                            setCurrentPage(1);
                            setNewFood({ ...newFood, category: "breakfast" });
                          }}
                        >
                          <AddOutlined size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3 mb-3">
                      <div className="fw-bold mb-1" style={{ color: "green" }}>
                        <i className="bi bi-brightness-high"></i> Lunch
                      </div>
                      <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                        {profile?.meals?.lunch.map((lunch, i) => (
                          <div
                            role="button"
                            className="p-1 w-100 px-2 border rounded-2 bg-light d-flex justify-content-between align-items-center"
                            key={i}
                          >
                            {i + 1}. {lunch} &nbsp;
                            <i
                              className="bi bi-x text-danger"
                              title="Remove this item"
                              onClick={() => removeFood("lunch", lunch)}
                            ></i>
                          </div>
                        ))}
                        <div
                          role="button"
                          title="Add new Lunch item"
                          className="p-1 w-100 text-primary border-primary px-2 border rounded-2 mt-2 bg-transparent justify-content-center d-flex align-items-center"
                          onClick={() => {
                            setCurrentPage(1);
                            setNewFood({ ...newFood, category: "lunch" });
                          }}
                        >
                          <AddOutlined size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3 mb-3">
                      <div
                        className="fw-bold mb-1"
                        style={{ color: "#6A0DAD" }}
                      >
                        <i className="bi bi-moon-stars"></i> Supper
                      </div>
                      <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                        {profile?.meals?.supper.map((supper, i) => (
                          <div
                            role="button"
                            className="p-1 w-100 px-2 border rounded-2 bg-light d-flex justify-content-between align-items-center"
                            key={i}
                          >
                            {i + 1}. {supper} &nbsp;
                            <i
                              className="bi bi-x text-danger"
                              title="Remove this item"
                              onClick={() => removeFood("supper", supper)}
                            ></i>
                          </div>
                        ))}

                        <div
                          role="button"
                          title="Add new Supper item"
                          className="p-1 w-100 text-primary border-primary px-2 border rounded-2 mt-2 bg-transparent justify-content-center d-flex align-items-center"
                          onClick={() => {
                            setCurrentPage(1);
                            setNewFood({ ...newFood, category: "supper" });
                          }}
                        >
                          <AddOutlined size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3 mb-3">
                      <div className="fw-bold text-danger mb-1">
                        <i className="bi bi-apple"></i> Fruits/Salads
                      </div>
                      <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                        {profile?.meals?.fruits.map((fruit, i) => (
                          <div
                            role="button"
                            className="p-1 w-100 px-2 border rounded-2 bg-light d-flex justify-content-between align-items-center"
                            key={i}
                          >
                            {i + 1}. {fruit} &nbsp;
                            <i
                              className="bi bi-x text-danger"
                              title="Remove this item"
                              onClick={() => removeFood("fruits", fruit)}
                            ></i>
                          </div>
                        ))}

                        <div
                          role="button"
                          title="Add new Fruits/Salads item"
                          className="p-1 w-100 text-primary border-primary px-2 border rounded-2 mt-2 bg-transparent justify-content-center d-flex align-items-center"
                          onClick={() => {
                            setCurrentPage(1);
                            setNewFood({ ...newFood, category: "fruits" });
                          }}
                        >
                          <AddOutlined size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {open[1] && (
                  <Modal
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    open={open[0]}
                    onClose={handleClose}
                    closeAfterTransition
                    slots={{ backdrop: Backdrop }}
                    slotProps={{
                      backdrop: {
                        timeout: 500,
                      },
                    }}
                  >
                    <Fade in={open[0]}>
                      <Box className="container" sx={style}>
                        <div className="px-2">
                          <h5 className="fw-bold text-dark mb-3">View Plan</h5>
                          <div className="fw-semibold mb-4 small text-secondary">
                            <strong>Date: </strong> {open[2]}
                          </div>
                          <div className="row row-cols-1 row-cols-md-4 g-3 small">
                            <div className="col-6 col-md-3 mb-3">
                              <div
                                className="fw-bold mb-1"
                                style={{ color: "orange" }}
                              >
                                <i className="bi bi-cloud-sun"></i> Breakfast
                              </div>
                              <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                                <div
                                  role="button"
                                  className="rounded-2 w-100 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                                  key={"breakfast"}
                                >
                                  <i className="bi bi-check2-circle text-success">
                                    {" "}
                                  </i>{" "}
                                  {open[1].breakfast}
                                </div>
                              </div>
                            </div>
                            <div className="col-6 col-md-3 mb-3">
                              <div
                                className="fw-bold mb-1"
                                style={{ color: "green" }}
                              >
                                <i className="bi bi-brightness-high"></i> Lunch
                              </div>
                              <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                                <div
                                  role="button"
                                  className="rounded-2 w-100 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                                  key={"lunch"}
                                >
                                  <i className="bi bi-check2-circle text-success">
                                    {" "}
                                  </i>{" "}
                                  {open[1].lunch}
                                </div>
                              </div>
                            </div>
                            <div className="col-6 col-md-3 mb-3">
                              <div
                                className="fw-bold mb-1"
                                style={{ color: "#6A0DAD" }}
                              >
                                <i className="bi bi-moon-stars"></i> Supper
                              </div>
                              <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                                <div
                                  role="button"
                                  className="rounded-2 w-100 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                                  key={"supper"}
                                >
                                  <i className="bi bi-check2-circle text-success">
                                    {" "}
                                  </i>{" "}
                                  {open[1].supper}
                                </div>
                              </div>
                            </div>
                            <div className="col-6 col-md-3 mb-3">
                              <div className="fw-bold text-danger mb-1">
                                <i className="bi bi-apple"></i> Fruits/Salads
                              </div>
                              <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                                <div
                                  role="button"
                                  className="rounded-2 w-100 fw-semibold alert-success d-flex align-items-center gap-2 p-1 px-2"
                                  key={"fruit"}
                                >
                                  <i className="bi bi-check2-circle text-success">
                                    {" "}
                                  </i>{" "}
                                  {open[1].fruit}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex justify-content-end mt-3">
                            <button
                              style={{ width: "15rem" }}
                              className="btn small btn-dark fw-600 py-2 authSignInBtn"
                              onClick={handleClose}
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      </Box>
                    </Fade>
                  </Modal>
                )}

                <div className="card shadow-sm border-0 p-4 calendar mb-5">
                  <div style={{ overflowX: "auto" }}>
                    <div
                      className="d-grid gap-2 w-100 mb-5"
                      style={{
                        gridTemplateColumns: "repeat(7, 1fr)",
                        // minWidth: "800px", // Prevents squishing and maintains alignment on small screens
                      }}
                    >
                      {/* 1. Header Row (Sun-Sat) - Now sharing the same grid parent */}
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="text-center fw-bold text-muted py-2"
                          >
                            {day}
                          </div>
                        ),
                      )}

                      {/* 2. Empty cells for previous month padding */}
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="" />
                      ))}

                      {/* 3. Calendar days */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const meals = mealPlan[day];
                        const isToday = isCurrentMonth && day === today;
                        const formattedDate = new Date(
                          currentDate.getUTCFullYear(),
                          currentDate.getMonth(),
                          day,
                        ).toLocaleString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                        return (
                          <div
                            key={day}
                            className={`border rounded text-dark p-2 ${
                              isToday
                                ? "alert-success text-light border-success border-2 shadow"
                                : "bg-white text-dark"
                            }`}
                            // style={{ minHeight: "120px" }}
                            role="button"
                            title={formattedDate}
                            onClick={() => {
                              const year = currentDate.getUTCFullYear();
                              const month = currentDate.getMonth();
                              const selectedDate = new Date(year, month, day);

                              setOpen([true, meals, formattedDate]);
                              console.log(
                                "Selected date:",
                                selectedDate,
                                "Meals: ",
                                meals,
                              );
                            }}
                          >
                            <div
                              className={`small fw-semibold text-end mb-1 fs-5 ${
                                isToday ? "text-success" : "text-muted"
                              }`}
                            >
                              {day ?? 0}
                            </div>
                            <div
                              className="flex-column gap-1 d-none d-md-flex"
                              style={{ fontSize: "0.75rem" }}
                            >
                              <div
                                className="bg-opacity-25 rounded p-1 text-dark"
                                // title="Breakfast"
                              >
                                <div className="fw-bold mb-1">
                                  <i
                                    className="bi bi-cloud-sun"
                                    style={{ color: "orange" }}
                                  ></i>
                                </div>
                                <div className="text-truncate small">
                                  {meals.breakfast || "?"}
                                </div>
                              </div>
                              <div
                                className="bg-opacity-25 rounded p-1 text-dark"
                                // title="Lunch"
                              >
                                <div className="fw-bold mb-1">
                                  <i
                                    className="bi bi-brightness-high"
                                    style={{ color: "green" }}
                                  ></i>
                                </div>
                                <div className="text-truncate small">
                                  {meals.lunch || "?"}
                                </div>
                              </div>
                              <div
                                className="bg-opacity-25 rounded p-1 text-dark"
                                // title="Supper"
                              >
                                <div className="fw-bold mb-1">
                                  <i
                                    className="bi bi-moon-stars"
                                    style={{ color: "#6A0DAD" }}
                                  ></i>
                                </div>
                                <div className="text-truncate small">
                                  {meals.supper || "?"}
                                </div>
                              </div>
                            </div>
                            <div
                              className="bg-opacity-25 shadow-sm d-none d-md-flex alert-success px-2 small mt-1 align-items-center gap-2 small rounded p-1 text-dark"
                              // title="Fruits"
                            >
                              <div className="fw-bold">
                                <i className="bi bi-apple"></i>
                              </div>
                              <div className="text-truncate">
                                {meals.fruit || "?"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* end of calendar */}
                <Invite />

                <Share />
              </section>
            ) : currentPage === 1 ? (
              <section>
                <div>
                  <span
                    className="p-2 w-auto"
                    role="button"
                    onClick={() => setCurrentPage((value) => value - 1)}
                  >
                    <i className="bi bi-arrow-left"></i> &nbsp; Back
                  </span>
                </div>

                {/* Add Food Form */}
                <div className="bg-light p-3 rounded mb-3 mt-3 border">
                  <p className="form-label mb-2">
                    Add New Food (Use " + " to separate food combinations i.e
                    Fries + Chips + Salad)
                  </p>

                  <div className="row gx-3 gy-3 align-items-center">
                    <div className="col-12 col-md-5">
                      <select
                        value={newFood.category}
                        onChange={(e) =>
                          setNewFood({ ...newFood, category: e.target.value })
                        }
                        className="form-select shadow-none"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="supper">Supper</option>
                        <option value="fruits">Fruits/Salads</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-7">
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
                    </div>
                    {error[0] && error[1] === "addFood" && (
                      <div
                        className="alert alert-danger mt-4 p-2 px-3 text-small col-12"
                        role="alert"
                      >
                        {error[2]}
                      </div>
                    )}
                    <div className="col-12 d-flex gap-3 mb-3 justify-content-start align-items-center flex-wrap">
                      <p className="form-label fw-semibold m-0">Quick Add: </p>
                      <div className="text-danger d-flex flex-row-reverse gap-2">
                        {defaultFoods[newFood.category]?.filter(
                          (food) =>
                            !profile?.meals[newFood.category]?.includes(food),
                        ).length > 0
                          ? defaultFoods[newFood.category]
                              ?.filter(
                                (food) =>
                                  !profile?.meals[newFood.category]?.includes(
                                    food,
                                  ),
                              )
                              .map((food) => (
                                <div
                                  role="button"
                                  key={food}
                                  onClick={() =>
                                    setNewFood({ ...newFood, name: food })
                                  }
                                  className="p-1 text-primary border border-primary rounded-2 px-3 small d-flex align-items-center justify-content-center gap-2 shadow-0"
                                >
                                  {food}
                                </div>
                              ))
                          : "No more suggestions available!"}
                      </div>
                    </div>

                    <button
                      onClick={addFood}
                      className="p-2 px-4 text-light justify-content-center border-0 rounded-3 d-flex align-items-center ms-auto gap-2 shadow col-12 col-md-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #6a0dad 0%, #392b8d 65%, #1f1a4b 100%)",
                      }}
                    >
                      <AddOutlined size={20} />
                      Add Food
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section>
                <div>
                  <span
                    className="p-2 w-auto"
                    role="button"
                    onClick={() => setCurrentPage(0)}
                  >
                    <i className="bi bi-arrow-left"></i> &nbsp; Back
                  </span>
                </div>

                <div className="d-flex flex-column mt-3 gap-4">
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
                    <div className="w-100">
                      <h3 className="fw-bold mb-1 text-center">Account</h3>
                      <p className="text-muted mb-0 small text-center">
                        Manage your profile and sign out from the app.
                      </p>
                    </div>
                  </div>

                  <div className="card shadow-sm border-0 p-4 mb-4">
                    <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                      <Badge
                        variant="dot"
                        color="success"
                        overlap="circular"
                        badgeContent=" "
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                        sx={{
                          "& .MuiBadge-dot": {
                            height: 15, // Default dot is 8px, standard is ~20px. 12px is the sweet spot.
                            width: 15,
                            borderRadius: "50%",
                          },
                        }}
                      >
                        <Avatar
                          className="border shadow-sm border-2 border-primary"
                          sx={{
                            // bgcolor: "#6A0DAD",
                            width: 72,
                            height: 72,
                            fontSize: "1.75rem",
                          }}
                          src={profile?.avatar_url}
                        >
                          {profile?.display_name?.[0]?.toUpperCase() || "U"}
                        </Avatar>
                      </Badge>
                      <div>
                        <h4 className="mb-1">
                          {profile?.display_name || "Unknown"}
                        </h4>
                        <div className="small text-muted">
                          {profile?.gender || "Not specified"} |{" "}
                          {profile?.age_group.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="row gy-3">
                      <div className="col-12 col-md-6">
                        <div
                          className="p-3 rounded-3 border"
                          style={{ background: "#f7f2ff" }}
                        >
                          <div className="text-uppercase small text-muted mb-2">
                            <i
                              className="bi bi-person"
                              style={{ color: "#6A0DAD" }}
                            ></i>{" "}
                            User ID
                          </div>
                          <div className="fw-semibold small text-dark">
                            {profile?.id || "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div
                          className="p-3 rounded-3 border"
                          style={{ background: "#f7f2ff" }}
                        >
                          <div className="text-uppercase small text-muted mb-2">
                            <i
                              className="bi bi-wifi"
                              style={{ color: "#6A0DAD" }}
                            ></i>{" "}
                            Status
                          </div>
                          <div className="fw-semibold small d-flex align-items-center gap-2 text-success">
                            <div
                              className="rounded-circle m-0 p-0 border-0"
                              style={{
                                width: "8px",
                                height: "8px",
                                background: "#33ff00",
                              }}
                            ></div>{" "}
                            <div>Online</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div
                          className="p-3 rounded-3 border"
                          style={{ background: "#f7f2ff" }}
                        >
                          <div className="text-uppercase small text-muted mb-2">
                            <i
                              className="bi bi-calendar"
                              style={{ color: "#6A0DAD" }}
                            ></i>{" "}
                            Date Joined
                          </div>
                          <div className="fw-semibold small text-dark">
                            {profile?.created_at
                              ? new Date(profile.created_at).toLocaleString()
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div
                          className="p-3 rounded-3 border"
                          style={{ background: "#f7f2ff" }}
                        >
                          <div className="text-uppercase small text-muted mb-2">
                            <i
                              className="bi bi-clock"
                              style={{ color: "#6A0DAD" }}
                            ></i>{" "}
                            Last Sigin
                          </div>
                          <div className="fw-semibold small text-dark">
                            {profile?.last_sign_in_at
                              ? new Date(
                                  profile.last_sign_in_at,
                                ).toLocaleString()
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div
                          className="p-3 rounded-3 border"
                          style={{ background: "#f7f2ff" }}
                        >
                          <div className="text-uppercase small text-muted mb-2">
                            <i
                              className="bi bi-envelope"
                              style={{ color: "#6A0DAD" }}
                            ></i>{" "}
                            Email
                          </div>
                          <div className="fw-semibold small text-dark d-flex justify-content-between">
                            {profile?.email || "Not available"}{" "}
                            {profile?.email_confirmed_at ? (
                              <span className="text-success">
                                Verified <i className="bi bi-check2-circle"></i>
                              </span>
                            ) : (
                              <span className="text-danger">
                                Not verified <i className="bi bi-x"></i>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div
                          className="p-3 rounded-3 border"
                          style={{ background: "#f7f2ff" }}
                        >
                          <div className="text-uppercase small text-muted mb-2">
                            <i
                              className="bi bi-phone"
                              style={{ color: "#6A0DAD" }}
                            ></i>{" "}
                            Phone
                          </div>
                          <div className="fw-semibold small text-dark d-flex justify-content-between">
                            {profile?.phone || "Not available"}{" "}
                            {profile?.identity_data?.phone_verified ? (
                              <span className="text-success">
                                Verified <i className="bi bi-check2-circle"></i>
                              </span>
                            ) : (
                              <span className="text-danger">
                                Not verified <i className="bi bi-x"></i>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div
                          className="p-3 rounded-3 border"
                          style={{ background: "#f7f2ff" }}
                        >
                          <div className="text-danger mb-2">Logout</div>
                          <div className="fw-semibold small text-dark d-flex justify-content-between align-items-center">
                            Logout now (This will clear you current session. You
                            will need to log in again.)
                            <button
                              className="btn text-danger bg-light shadow-sm"
                              onClick={handleLogout}
                            >
                              <LogoutOutlined />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Invite />
              </section>
            )}
            {/* Footer */}
            <footer className="mb-5 text-center">
              @Copyright Meal Planner 2026 Designed and developed by DevOduk
            </footer>
            <br />
            <br />
            <br />
          </div>
        </div>
      ) : (
        <Auth />
      )}

      {profile && (
        <BottomNavigation
          className="shadow-lg bg-light"
          value={currentPage}
          showLabels
          sx={{
            position: "fixed",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100,
            width: "min(92%, 520px)",
            borderRadius: "18px",
            background: "#fff",
            "& .Mui-selected": {
              color: "#6A0DAD",
              fontWeight: 600,
            },
          }}
          onChange={(event, newValue) => {
            setCurrentPage(newValue);
          }}
        >
          <BottomNavigationAction label="Home" icon={<HomeOutlined />} />
          <BottomNavigationAction label="Add New" icon={<AddOutlined />} />
          <BottomNavigationAction
            label="Account"
            icon={<PersonOutlinedIcon />}
          />
        </BottomNavigation>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={7000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // Top center placement
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px", fontWeight: 500 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
