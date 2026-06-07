import React, { useState } from 'react'
import { AddOutlined } from '@mui/icons-material';
import { useAuth } from "@/context/AuthProvider";
import BottomBar from "@/components/BottomBar";
import TopHeader from "@/components/TopHeader";
import { useNavigate } from "react-router";
import {
    Alert,
    Snackbar,
} from "@mui/material";
import { supabase } from "../supabaseClient"; // Adjust path as needed
import Footer from '@/components/Footer';
import { useLocation } from "react-router-dom";
import Invite from "@/components/Invite";


export const defaultFoods = {
    breakfast: [
        "Chai + Mandazi",
        "Chai + Bread",
        "Porridge/Uji Power",
        "Chai + Bread + Eggs",
        "Chapati + Beans",
        "Pancakes",
        "Chai + Cassava",
        "Uji + Cassava",
        "Chai + Sweet Potatoes",
        "Chai + Nduma (Arrowroot)",
        "Chai + Chapati",
        "Chai + Samosa",
        "Chai + Bread + Suasages"
    ],
    lunch: [
        "Rice + Beans",
        "Ugali + Sukuma",
        "Pilau",
        "Githeri",
        "Rice + Beef Stew",
        "Ugali + Beef Stew",
        "Ugali + Fish",
        "Chapati + Chicken",
        "Fries + Chicken Wings + Salad",
        "Ugali + Nyama Choma + Kachumbari",
        "Matoke (Green Bananas)"
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
        "Ugali + Managu (African Nightshade)",
        "Mursik + Ugali",
        "Chapati + Chicken",
        "Ugali + Chicken",
        "Ugali + Nyama Choma + Kachumbari",
        "Matoke (Green Bananas)"
    ],
    fruits: [
        "Banana",
        "Mango",
        "Watermelon",
        "Pineapple",
        "Orange",
        "Avocado",
        "Apples",
        "Fruit Salad",
        "Pawpaw (Papaya)",
        "Passion Fruit"
    ],
};



function AddMeal() {
    const location = useLocation();
    const { profile, setProfile, friends } = useAuth();
    const passedCategory = location.state?.category || "breakfast"; // Default to "breakfast" if no category is passed
    const [newFood, setNewFood] = useState({ name: "", category: passedCategory });
    const [error, setError] = useState([false, "", ""]);
    const [adding, setAdding] = useState(false);
    const navigate = useNavigate();
    const [toast, setToast] = useState({
        open: false,
        message: "",
        severity: "error",
    });


    const addFood = async () => {
        setAdding(true);
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
            setAdding(false);
            return;
        }
        // Use profile and session.user.id as the requirements
        if (!foodName) {
            setToast({
                open: true,
                message: "Please enter a valid food name to proceed!",
                severity: "warning",
            });
            setAdding(false);
            return;
        }
        // Use profile and session.user.id as the requirements
        if (!profile?.id) {
            setToast({
                open: true,
                message: "User must be logged in!",
                severity: "warning",
            });
            setAdding(false);
            return;
        }

        // 1. Source from profile state (fallback to defaultFoods if profile isn't loaded)

        const updatedMeals = {
            ...currentMeals,
            [newFood.category]: [...(currentMeals[newFood.category] || []), foodName],
        };

        // 2. Update Supabase
        const { error } = await supabase.from("planner_profiles").update({
            meals: updatedMeals,
        })
        .eq("id", profile?.id)
        ;

        if (error) {
            setToast({
                open: true,
                message: "Sync failed: " + error.message,
                severity: "error",
            });
            setAdding(false);
        } else {
            // 3. Update the PROFILE state specifically
            setProfile((prev) => ({
                ...prev,
                meals: updatedMeals,
            }));

            setNewFood({ ...newFood, name: "" });
            setAdding(false);

            setToast({
                open: true,
                message: `Successfully added "${foodName}" to ${newFood.category} meals!`,
                severity: "success",
            });
        }
    };

    const handleCloseToast = (event, reason) => {
        if (reason === "clickaway") return;
        setToast({ ...toast, open: false });
    };

    return (
        <div className="container-xxl">
            <TopHeader profile={profile} />

            <section>
                <div>
                    <span
                        className="p-2 w-auto"
                        role="button"
                        onClick={() => navigate("/")}
                    >
                        <i className="bi bi-arrow-left"></i> &nbsp; Back
                    </span>
                </div>

                {/* Add Food Form */}
                <div className="bg-light p-3 rounded mb-3 mt-3 border">
                    <p className="form-label mb-2">
                        Add New Food (Use " + " to separate food combinations i.e
                        Fries + Chicken Wings + Salad)
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
                        <div className="col-12 d-flex gap-3 mb-3 justify-content-start align-items-start flex-wrap">
                            <p className="form-label fw-semibold m-0 w-auto">Quick Add: </p>
                            <div className="d-flex flex-column w-100 flex-wrap gap-2 justify-content-start align-items-start">
                                <div className="text-danger d-flex flex-wrap gap-2">
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
                                                    onClick={() => setNewFood({ ...newFood, name: food })}
                                                    className="p-1 text-nowrap px-3 text-primary border border-primary rounded-pill small d-flex align-items-center justify-content-center gap-2 shadow-0"
                                                    style={{ cursor: "pointer", transition: "all 0.2s", backgroundColor: newFood.name === food ? "#0080ff2f" : "transparent" }}
                                                >
                                                    <span>+</span> {food}
                                                </div>
                                            ))
                                        : "No more suggestions available! Invite friends to share their meals and expand your options!"}
                                </div>
                                {
                                    friends.length > 0 && (
                                        <div className="border p-2 px-3 mt-2 rounded-3 bg-white w-100" style={{ backgroundColor: "#f8f9fa" }}>
                                            <p className="fw-semibold text-danger">See what your friends are eating!</p>
                                            {
                                                friends
                                                    // 1. Only keep friends who have AT LEAST ONE meal in this category that you don't have
                                                    .filter((friend) => {
                                                        const friendMealsInCat = friend.meals?.[newFood.category] || [];
                                                        const myMealsInCat = profile?.meals?.[newFood.category] || [];

                                                        return friendMealsInCat.some((food) => !myMealsInCat.includes(food));
                                                    })
                                                    // 2. Map over the filtered social list
                                                    .map((friend) => {
                                                        const myMealsInCat = profile?.meals?.[newFood.category] || [];
                                                        const friendMealsInCat = friend.meals?.[newFood.category] || [];

                                                        // Get the unique subset of items this specific friend has
                                                        const uniqueFriendSuggestions = friendMealsInCat.filter(
                                                            (food) => !myMealsInCat.includes(food)
                                                        );

                                                        return (
                                                            <div key={friend.id} className="mb-3 p-2 border-bottom">
                                                                <h5 className="small fw-bold text-dark mb-2">{friend.name} suggests:</h5>

                                                                <div className="d-flex flex-wrap gap-2 w-full">
                                                                    {uniqueFriendSuggestions.map((food) => (
                                                                        <div
                                                                            role="button"
                                                                            key={food}
                                                                            onClick={() => setNewFood({ ...newFood, name: food })}
                                                                            className="p-1 px-3 text-nowrap text-primary border border-primary rounded-pill small d-flex align-items-center justify-content-center gap-2 shadow-0"
                                                                            style={{ cursor: "pointer", transition: "all 0.2s", backgroundColor: newFood.name === food ? "#0080ff2f" : "transparent" }}
                                                                        >
                                                                            <span>+</span> {food}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            }

                                            {/* 3. Fallback display if NO friends have unique meals for this specific category right now */}
                                            {friends.filter(f => f.meals?.[newFood.category]?.some(food => !profile?.meals?.[newFood.category]?.includes(food))).length === 0 && (
                                                <p className="small text-muted italic">
                                                    You are caught up with you friends! Invite more friends to expand your options.
                                                </p>
                                            )}
                                        </div>
                                    )
                                }

                            </div>
                        </div>

                        <button
                            disabled={adding}
                            onClick={addFood}
                            className="p-2 px-4 text-light justify-content-center border-0 rounded-3 d-flex align-items-center ms-auto gap-2 shadow col-12 col-md-0"
                            style={{
                                background:
                                    "linear-gradient(135deg, #6a0dad 0%, #392b8d 65%, #1f1a4b 100%)",
                            }}
                        >
                            {
                                adding ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                            aria-hidden="true"
                                        />
                                    </>
                                ) : (
                                    <AddOutlined size={20} />
                                )
                            }
                            {adding ? "Adding ..." : "Add Food"}
                        </button>
                    </div>
                </div>
            </section>

            <Invite profile={profile} />

            <BottomBar currentPage={1} />
            <Footer />

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
        </div>
    )
}

export default AddMeal
