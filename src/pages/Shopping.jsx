import React, { useMemo, useState, useCallback } from 'react'
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
import Invite from "@/components/Invite";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { generateMealPlan } from '@/components/mealPlanGenerator';


function Shopping() {
    const { profile } = useAuth();
    const [toast, setToast] = useState({
        open: false,
        message: "",
        severity: "error",
    });
    const [completedItems, setCompletedItems] = useState([]);


    const [currentDate] = useState(new Date());

    const handleCloseToast = (event, reason) => {
        if (reason === "clickaway") return;
        setToast({ ...toast, open: false });
    };

    const mealPlan = useMemo(() => {
        if (!profile?.id) return {};

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
    }, [profile?.id, profile?.meals, currentDate, generateMealPlan]);


    // weneed to generate weekly shoping list by getting the mealplan for the current week and then getting the meals for each day and then getting the ingredients for each meal and then generating a shopping list based on the ingredients needed for the week.
    const meals = mealPlan[(currentDate.getDate() + 1)] || {};
    const shoppingList = [
        meals.breakfast,
        meals.lunch,
        meals.supper,
        meals.fruit
    ];

    const flatShoppingList = shoppingList.map(m => m?.split(" + ").map(i => i.trim())).flat();

    return (
        <div className="container-xxl">
            <TopHeader profile={profile} />

            <section>
                <div className="card shadow-sm border-0 p-4 mb-4">
                    <h5 className="fw-bold text-dark mb-2">Shopping List</h5>
                    <div className="fw-semibold mb-3 small text-secondary">
                        Check out your shopping list for tommorrow! You can add more items and mark as acquired.
                    </div>
                    <div className="m-2 bg-light p-2 rounded">
                        <FormGroup>
                            {flatShoppingList?.length > 0 ? (
                                flatShoppingList.map((meal, i) => (
                                    <FormControlLabel
                                        className={completedItems.includes(meal) ? "text-decoration-line-through text-secondary" : ""}
                                        key={i}
                                        control={
                                            <Checkbox
                                                checked={completedItems.includes(meal)}
                                                onChange={() =>
                                                    setCompletedItems((prev) =>
                                                        prev.includes(meal)
                                                            ? prev.filter((item) => item !== meal)
                                                            : [...prev, meal]
                                                    )
                                                }
                                            />
                                        }
                                        label={meal || "Shopping Item " + i + 1}
                                    />
                                ))
                            ) : (
                                <div className="text-muted">
                                    No items in your shopping list.
                                </div>
                            )}
                        </FormGroup>
                    </div>
                </div>
            </section>

            <Invite profile={profile} />

            <BottomBar currentPage={2} />
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

export default Shopping
