import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useNavigate } from "react-router-dom"; // Or useRouter if using Next.js/Vite equivalent
import { supabase } from "../supabaseClient"; // Adjust path as needed
import Chip from "@mui/material/Chip"; // Double check your Material UI import match

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

const Onboarding = () => {
    const { user, profile,setProfile } = useAuth(); // Grab user context
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        gender: "",
        age_group: "",
        meals: { breakfast: [], lunch: [], supper: [], fruits: [] },
    });

      if (profile?.onboarded === true) {
        navigate("/");
      }


    const handleComplete = async () => {
        // 1. Strict Validation
        const isReady = Object.values(formData.meals).every(
            (cat) => cat.length >= 3
        );

        if (!isReady) {
            alert("Please select at least 3 items for every category!");
            return;
        }

        // 2. Database Update
        const { error } = await supabase
            .from("planner_profiles")
            .update({
                gender: formData.gender,
                age_group: formData.age_group,
                meals: formData.meals,
                onboarded: true,
            })
            .eq("id", user?.id); // Read directly from context

        if (error) {
            console.error("Update failed:", error.message);
            return;
        }

        // 3. Clear State Syncing (Optional helper function in Context)
        if (setProfile) {
            setProfile((prev) => ({
                ...prev,
                gender: formData.gender,
                age_group: formData.age_group,
                meals: formData.meals,
                onboarded: true,
            }));
        }

        // 4. Smooth redirection over jarring page reloads
        navigate("/");
    };

    if (profile?.onboarded === true) {
        navigate("/");
    }

    return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center">
            <div className="container onboarding-card border-0 shadow=0 rounded-5 p-4">
                <h5 className="primary-text fw-bold">WELCOME</h5>
                <p className="text-muted">
                    Hello there, let's get started. This will take less than a minute...
                </p>

                {step === 1 && (
                    <section>
                        <h3>Gender</h3>
                        <div className="p-2 mt-4 mb-2 d-flex flex-wrap flex-md-nowrap gap-3">
                            {["Male", "Female", "Other"].map((g) => (
                                <button
                                    className="w-100 outline-0 shadow-sm rounded-4 p-5 small border-0"
                                    key={g}
                                    onClick={() => setFormData({ ...formData, gender: g })}
                                    style={{
                                        background: formData?.gender === g ? "#6a0dada1" : "gainsboro",
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
                                    className="w-100 outline-0 shadow-sm rounded-4 p-5 small border-0"
                                    key={g}
                                    onClick={() => setFormData({ ...formData, age_group: g })}
                                    style={{
                                        background: formData?.age_group === g ? "#6a0dada1" : "gainsboro",
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

                {step === 3 && (() => {
                    const isValid = Object.keys(defaultFoods).every(
                        (category) => formData.meals[category].length >= 3
                    );
                    return (
                        <section>
                            <h3>Starter Pack</h3>
                            <p className="text-muted small">
                                Select at least 3 meals for each category. You can select more if you like.
                            </p>
                            {Object.keys(defaultFoods).map((category) => (
                                <div key={category} className="mb-4 bg-light p-2 border-left border-2 border-primary rounded">
                                    <h4 style={{ textTransform: "uppercase", fontSize: "0.9rem", color: "#666" }}>
                                        {category}
                                    </h4>
                                    <div className="py-1 gap-2" style={{ display: "flex", flexWrap: "wrap" }}>
                                        {defaultFoods[category].map((food) => {
                                            const isSelected = formData.meals[category].includes(food);
                                            return (
                                                <Chip
                                                    key={food}
                                                    label={food}
                                                    variant={isSelected ? "filled" : "outlined"}
                                                    onClick={() => {
                                                        const list = formData.meals[category];
                                                        const newItems = isSelected
                                                            ? list.filter((i) => i !== food)
                                                            : [...list, food];

                                                        setFormData({
                                                            ...formData,
                                                            meals: { ...formData.meals, [category]: newItems },
                                                        });
                                                    }}
                                                    style={{
                                                        transition: "all 0.2s",
                                                        background: isSelected ? "#6A0DAD" : "transparent",
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

export default Onboarding;