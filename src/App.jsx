import { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, Calendar, LogOut } from "lucide-react";
import { supabase } from "./supabaseClient";
import { Alert, Avatar, Chip, CircularProgress, Snackbar } from "@mui/material";

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
      "Papaya",
      "Orange",
      "Avocado",
      "Fruit Salad",
    ],
  };
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // The Data (Meals, Onboarded, Name)
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
          seededRandom(seed * 1) * breakfast.length,
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
      const { data } = await supabase
        .from("planner_profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data) {
        setProfile(data); // This is your "source of truth" now
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
    // Use profile and session.user.id as the requirements
    if (!foodName || !session?.user?.id) return;

    // 1. Source from profile state (fallback to defaultFoods if profile isn't loaded)
    const currentMeals = profile?.meals || defaultFoods;

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
  const date = currentDate.getDate();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
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

  // console.log("my profile: ", profile);

  const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("123456789");
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

    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        {view === "onboarding" && "We are onboardingbaby"}
        <div
          id="logreg-forms"
          className="d-flex flex-md-row flex-column align-items-center shadow border p-0 bg-white rounded-2"
          style={{ maxWidth: "850px" }}
        >
          <div className="w-100 d-none d-md-block"
            style={{ aspectRatio: "4/5" }}>
          <img
            className="img-fluid d-none d-md-block w-100 object-cover"
            src="/premium_photo-1711434824963-ca894373272e.avif"
            alt=""
          />

          </div>
          {/* SIGN IN FORM */}
          {view === "login" && (
            <form className="form-signin w-100 p-4" onSubmit={handleLogin}>
              <h1 className="h3 mb-3 font-weight-normal text-center">
                Sign in
              </h1>
              <p className="text-center">
                Log in to your account to start your meal planning.
              </p>
              <input
                type="email"
                className="form-control mb-3"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="btn btn-success btn-block mb-2 w-100"
                type="submit"
                disabled={loading}
              >
                <i className="fas fa-sign-in-alt"></i>{" "}
                {loading ? "Loading..." : "Sign in"}
              </button>
              <div className="text-center">
                <a href="#" onClick={() => setView("reset")} id="forgot_pswd">
                  Forgot password?
                </a>
              </div>
              <hr />
              <button
                className="btn btn-primary btn-block w-100"
                type="button"
                onClick={() => setView("signup")}
              >
                <i className="fas fa-user-plus"></i> Create New Account
              </button>
            </form>
          )}

          {/* PASSWORD RESET FORM */}
          {view === "reset" && (
            <form className="form-reset w-100 p-4">
              <h1 className="h3 mb-3 font-weight-normal text-center">
                Reset Password
              </h1>

              <p className="text-center">
                An reset link will be sent to your email{" "}
                <strong>{email}</strong>.
              </p>
              <input
                type="email"
                className="form-control mb-3"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="btn btn-primary btn-block mb-2 w-100"
                type="submit"
              >
                Reset Password
              </button>
              <a
                href="#"
                onClick={() => setView("login")}
                className="d-block text-center"
              >
                <i className="fas fa-angle-left"></i> Back
              </a>
            </form>
          )}

          {/* SIGN UP FORM */}
          {view === "signup" && (
            <form className="form-signup w-100 p-4" onSubmit={handleSignUp}>
              <h1 className="h3 mb-3 font-weight-normal text-center">
                Sign Up
              </h1>

              <p className="text-center">
                Enter details below to signup for an account.
              </p>
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Username e.g @User_577"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <input
                type="email"
                className="form-control mb-3"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="btn btn-primary btn-block mb-2 w-100"
                type="submit"
              >
                <i className="fas fa-user-plus"></i> Sign Up
              </button>
              <a
                href="#"
                onClick={() => setView("login")}
                className="d-block text-center"
              >
                <i className="fas fa-angle-left"></i> Back
              </a>
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
    };

    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center">
        <div className="container onboarding-card">
          <h5>Let's get started... </h5>
          {step === 1 && (
            <section>
              <h3>Step 1: Gender</h3>
              <div className="p-2 mt-4 d-flex gap-3 text-uppercase">
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    className={`w-100 outline-o shadow-0 p-5 small`}
                    key={g}
                    onClick={() => {
                      setFormData({ ...formData, gender: g });
                    }}
                    style={{
                      background:
                        formData?.gender === g ? "#6a0dada1" : "transparent",
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
                  Continue
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h3>Step 2: Age Group</h3>
              <div className="p-2 mt4 d-flex gap-3">
                {["Child", "Teen", "Adult", "Senior"].map((g) => (
                  <button
                    className={`w-100 outline-o shadow-0 p-5 small`}
                    key={g}
                    onClick={() => {
                      setFormData({ ...formData, age_group: g });
                    }}
                    style={{
                      background:
                        formData?.age_group === g ? "#6a0dada1" : "transparent",
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
                  Continue
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
                  <h3>Step 3: Starter Pack</h3>
                  <p>Select at least 3 meals for each category</p>
                  {Object.keys(defaultFoods).map((category) => (
                    <div key={category} style={{ marginBottom: "40px" }}>
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
                        className="py-2 gap-3"
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
                                // console.log("removed");
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

  if (profile && profile?.onboarded === false) {
    return <Onboarding session={session} setSession={setSession} />;
  }

  return (
    <>
      {profile?.onboarded !== undefined ? (
        <div className="min-vh-100 bg-light">
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
                <div className="small d-flex gap-2 align-items-center fw-semibold">
                  <Avatar
                    alt={profile?.display_name}
                    sx={{ background: "black" }}
                    src={profile?.avatar_url}
                  />
                  {profile?.display_name}

                  <button
                    className="btn btn-link text-danger btn-sm p-0"
                    onClick={handleLogout}
                  >
                    <LogOut size={23} title="Logout" />
                  </button>
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
                    <div className="fw-bold mb-1" style={{ color: "#6A0DAD" }}>
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
                      <i className="bi bi-apple"></i> Fruits/Salads
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
              <div className="alert alert-primary">
                <strong>Usage Tips! </strong> You can customize your meals below
                add, remove or modify existing items.
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark m-0">Available Foods</h5>
                <button
                  onClick={() => setShowAddFood(!showAddFood)}
                  className="p-2 px-4 text-light border-0 rounded-3 d-flex align-items-center gap-2 shadow small"
                  style={{ background: "#6A0DAD" }}
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
                    {profile?.meals?.breakfast.map((breakfast) => (
                      <span
                        role="button"
                        className="p-1 px-2 border rounded-2 bg-light"
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
                    {profile?.meals?.lunch.map((lunch) => (
                      <span
                        role="button"
                        className="p-1 px-2 border rounded-2 bg-light"
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
                  <div className="fw-bold mb-1" style={{ color: "#6A0DAD" }}>
                    <i className="bi bi-moon-stars"></i> Supper
                  </div>
                  <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                    {profile?.meals?.supper.map((supper) => (
                      <span
                        role="button"
                        className="p-1 px-2 border rounded-2 bg-light"
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
                    <i className="bi bi-apple"></i> Fruits/Salads
                  </div>
                  <div className="text-muted d-flex flex-wrap gap-2 mt-2">
                    {profile?.meals?.fruits.map((fruit) => (
                      <span
                        role="button"
                        className="p-1 px-2 border rounded-2 bg-light"
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
                      <option value="fruits">Fruits/Salads</option>
                    </select>
                    <button
                      onClick={addFood}
                      className="p-2 px-4 text-light border-0 rounded-3 d-flex align-items-center gap-2 shadow"
                      style={{ background: "#6A0DAD" }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Calendar Grid */}
            <div className="card shadow-sm border-0 p-4 calendar">
              <div style={{ overflowX: "auto" }}>
                <div
                  className="d-grid gap-2 w-100"
                  style={{
                    gridTemplateColumns: "repeat(7, 1fr)",
                    minWidth: "800px", // Prevents squishing and maintains alignment on small screens
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
                        className={`border rounded text-dark p-2 ${
                          isToday
                            ? "alert-info text-light border-success border-2 shadow"
                            : "bg-white text-dark"
                        }`}
                        style={{ minHeight: "120px" }}
                      >
                        <div
                          className={`small fw-semibold text-end mb-1 fs-1 ${
                            isToday ? "text-success" : "text-muted"
                          }`}
                        >
                          {isToday && (
                            <span className="small fs-6 text-muted">Today</span>
                          )}{" "}
                          {day}
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
                            <div className="text-truncate small">
                              {meals.lunch}
                            </div>
                          </div>
                          <div
                            className="bg-opacity-25 rounded p-1 text-dark"
                            title="Supper"
                          >
                            <div className="fw-bold mb-1">
                              <i
                                className="bi bi-moon-stars"
                                style={{ color: "#6A0DAD" }}
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
      ) : (
        <Auth />
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
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
