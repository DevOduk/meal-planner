import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  Alert,
  Backdrop,
  Box,
  Fade,
  Modal,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  FireExtinguisherRounded,
} from "@mui/icons-material";
import Invite from "@/components/Invite";
import Share from "@/components/Share";
import { useAuth } from "@/context/AuthProvider";
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined';
import html2pdf from "html2pdf.js";
import { toPng } from 'html-to-image';
import { generateMealPlan } from '@/components/mealPlanGenerator';


const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  // width: 400,
  maxWidth: '95%',
  bgcolor: "background.paper",
  boxShadow: 4,
  borderRadius: 4,
  p: 4,
};
import TopHeader from "@/components/TopHeader";
import BottomBar from "@/components/BottomBar";
import { useNavigate } from "react-router";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [open, setOpen] = useState([false, {}, ""]);
  const handleClose = () => setOpen([false, {}, ""]);
  const { profile, setProfile, setLoading, friends } = useAuth();
  const [currentDate] = useState(new Date());
  const seededRandom = useCallback((seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }, []);
  const navigate = useNavigate();
  const domRef = useRef(null);




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

  // 🌟 Returns a reusable function closure that accepts a friend object
  const friendsMealPlan = useMemo(() => {
    return (friend) => {
      if (!friend?.id) return {};

      // If friend has no custom database list, fall back to empty categories
      const currentFoods = friend.meals || {
        breakfast: [],
        lunch: [],
        supper: [],
        fruits: [],
      };

      // Computes deterministic plan mapping using your core diversity logic
      return generateMealPlan(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentFoods
      );
    };
  }, [currentDate, generateMealPlan]); // Tracks scope re-renders securely


  const todaysMeals = mealPlan[currentDate.getDate()] || null;

  const removeFood = async (category, foodToRemove) => {
    if (!profile?.id || !profile?.meals) return;

    const currentMeals = profile.meals;
    const updatedMeals = {
      ...currentMeals,
      [category]: currentMeals[category].filter(
        (item) => item !== foodToRemove,
      ),
    };


    const { error } = await supabase.from("planner_profiles").update({
      meals: updatedMeals,
    })
      .eq("id", profile?.id);

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

  const generateImage = useCallback(() => {
    if (domRef.current === null) return;
    setLoading(true);

    toPng(domRef.current, {
      cacheBust: true,
      // 🌟 SKIP trying to process third-party rules that trigger CORS issues
      styleCacheFilter: (cssRule) => {
        try {
          // If we can't read the parent rule or text, skip it safely
          if (!cssRule || !cssRule.cssText) return false;

          // Skip Bootstrap's inline SVG background images that cause the 400 errors
          if (cssRule.cssText.includes('data:image/svg+xml')) return false;

          return true;
        } catch (e) {
          // Catches the SecurityError and ignores the broken third-party rule
          return false;
        }
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = (profile?.username || 'user') + "_weekly-meal-plan.png";
        link.href = dataUrl;
        link.click();
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error generating image:', err);
        setLoading(false); // Make sure loading states turn off if processing throws
      });
  }, [domRef, profile]); // Added profile to dependencies since it's referenced inside

  const generatePdf = () => {
    setLoading(true)
    const element = document.getElementById("hidden-weekly-grid-printout");
    const options = {
      margin: 0.2,
      filename: profile?.username + "_weekly-meal-plan.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" } // Landscape is perfect for side-by-side grids!
    };
    html2pdf().set(options).from(element).save();

    setLoading(false)
  };
  return (
    <>
      <div className="min-vh-100 bg-light">
        <div className="container-xxl">
          {/* Header */}
          <TopHeader profile={profile} />

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


            {
              friends && friends.length > 0 && (
                <div className="card shadow-sm border-0 p-4 mb-4">
                  <h5 className="fw-bold text-dark mb-2">Your Friends</h5>
                  <span className="fw-semibold mb-3 small text-secondary">
                    {monthName}
                  </span>
                  <div className="row row-cols-1 row-cols-md-4 g-3 small">
                    {friends.map((friend, i) => (
                      <div key={i} className="col-12 col-md-6 col-lg-3 mb-3">
                        <div className="p-2 border rounded-3 bg-light sahdow w-100">
                          <table className="table bg-transparent">
                            <tbody>
                              <tr>
                                <td colSpan={2} className="mt-0 fw-bold p-2 border-0 text-primary bg-transparent">{friend.name}'s Meals Today</td>

                              </tr>
                              <tr>
                                <td className="d-flex gap-2 align-items-center bg-transparent">
                                  <i className="bi bi-cloud-sun"></i> Breakfast
                                </td>
                                <td className="fw-semibold bg-transparent text-nowrap">
                                  {friendsMealPlan(friend)[currentDate.getDate()]?.breakfast || "Breakfast Food"}
                                </td>

                              </tr>
                              <tr>
                                <td className="d-flex gap-2 align-items-center bg-transparent">
                                  <i className="bi bi-brightness-high"></i> Lunch
                                </td>
                                <td className="fw-semibold bg-transparent text-nowrap">
                                  {friendsMealPlan(friend)[currentDate.getDate()]?.lunch || "Lunch Food"}
                                </td>

                              </tr>
                              <tr>
                                <td className="d-flex gap-2 align-items-center bg-transparent">
                                  <i className="bi bi-moon-stars"></i> Supper
                                </td>
                                <td className="fw-semibold bg-transparent text-nowrap">
                                  {friendsMealPlan(friend)[currentDate.getDate()]?.supper || "Supper Food"}
                                </td>

                              </tr>
                              <tr>
                                <td className="d-flex gap-2 align-items-center bg-transparent">
                                  <i className="bi bi-apple"></i> Fruits/Salads
                                </td>
                                <td className="fw-semibold bg-transparent text-nowrap">
                                  {friendsMealPlan(friend)[currentDate.getDate()]?.fruit || "Some Fruit"}
                                </td>

                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>))}
                  </div>
                </div>)
            }







            {/* generate PDF/Images Buttons and Calendar Grid */}
            <div className="d-flex justify-content-end gap-3 mb-2">
              <div className="btn small btn-outline-danger bg-transparent fw-600 py-2 d-flex align-items-center gap-2 text-danger hover-danger" onClick={
                generatePdf
              }>
                <PictureAsPdfOutlinedIcon /> Export as PDF
              </div>
              <div className="btn small btn-outline-primary bg-transparent fw-600 py-2 d-flex align-items-center gap-2 text-primary" onClick={generateImage}>
                <InsertPhotoOutlinedIcon /> Export as Image
              </div>
            </div>

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
                        className={`border rounded text-dark p-2 ${isToday
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
                        }}
                      >
                        <div
                          className={`small fw-semibold text-end mb-1 fs-5 ${isToday ? "text-success" : "text-muted"
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
                              {meals?.breakfast || "Breakfast Food"}
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
                              {meals?.lunch || "Lunch Food"}
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
                              {meals?.supper || "Supper Food"}
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
                            {meals?.fruit || "Some Fruit"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="card shadow-sm border-0 p-4 mb-4">
              <div className="alert alert-primary">
                <strong>Usage Tips! </strong> You can customize your meals
                below add, remove or modify existing items to match your
                preferences. The more meals the better the planner can create.
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark m-0">Available Foods</h5>
                <button
                  onClick={() => navigate("/add", { state: { category: "breakfast" } })}
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
                        navigate("/add", { state: { category: "breakfast" } });
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
                        navigate("/add", { state: { category: "lunch" } });
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
                        navigate("/add", { state: { category: "supper" } });
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
                        navigate("/add", { state: { category: "fruits" } });
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

            {/* end of calendar */}
            <Invite profile={profile} />

            <Share />
          </section>

          {/* Footer */}
          <Footer />
        </div>
      </div>

      <BottomBar currentPage={0} />

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

      <div className="print-wrapper-hidden">
        {/* HIDDEN HIGH-DEFINITION EXPORT TARGET */}
        <div ref={domRef} id="hidden-weekly-grid-printout" className="print-only-target position-relative" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
          <div className="rounded-circle position-absolute d-flex align-items-center justify-content-center" style={{ backgroundColor: '#6a0dad17', height: '60vh', aspectRatio: '1/1', right: '-15%', top: '-35%', scale: '1.3', zIndex: 0 }}>
            <div className="rounded-circle" style={{ backgroundColor: '#6a0dad1c', height: '30vh', aspectRatio: '1/1' }}>
            </div>
          </div>
          <div className="text-center mb-4">
            <h1 style={{ color: "#6A0DAD", fontWeight: "bold", letterSpacing: "1px" }}>MY WEEKLY MEAL PLAN</h1>
            <p className="text-muted text-uppercase small fw-bold">
              {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
            </p>
          </div>

          <table className="table table-bordered align-middle text-center m-0" style={{ tableLayout: "fixed", width: "100%", zIndex: 2, position: 'relative' }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #6a0dad 0%, #392b8d 100%)", color: "white" }}>
                <th style={{ width: "12%" }} className="text-uppercase small fw-bold">Day / Date</th>
                <th style={{ width: "22%" }} className="text-uppercase small fw-bold">☀️ Breakfast</th>
                <th style={{ width: "22%" }} className="text-uppercase small fw-bold">🌤️ Lunch</th>
                <th style={{ width: "22%" }} className="text-uppercase small fw-bold">🌙 Supper</th>
                <th style={{ width: "22%" }} className="text-uppercase small fw-bold">🍎 Fruits / Snacks</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Aligned to match your calendar header order (Sunday - Saturday)
                const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

                // Calculate the start of the current week (Sunday)
                const currentDayIndex = currentDate.getDay(); // 0 (Sun) to 6 (Sat)
                const sunday = new Date(currentDate);
                sunday.setDate(currentDate.getDate() - currentDayIndex);

                return daysOfWeek.map((dayName, index) => {
                  const loopDate = new Date(sunday);
                  loopDate.setDate(sunday.getDate() + index);

                  const dayNumber = loopDate.getDate();

                  // Pull the target day structure from your computed useMemo matrix
                  const dayMeals = mealPlan[dayNumber] || null;

                  return (
                    <tr key={dayName} className="p-2">
                      {/* Day Label & Date */}
                      <td className="bg-light fw-bold p-2 text-start">
                        <div className="text-dark small text-center fw-bold">{dayName}</div>
                        <div className="text-muted text-center extra-small fw-normal">
                          {loopDate.toLocaleDateString("default", { day: "numeric", month: "short" })}
                        </div>
                      </td>

                      {/* Breakfast Column */}
                      <td className="p-2">
                        {dayMeals?.breakfast ? (
                          <div className="p-2 py-3 rounded-3 text-wrap small fw-semibold" style={{ background: "#F3E8FF", color: "#6A0DAD" }}>
                            {Array.isArray(dayMeals.breakfast) ? dayMeals.breakfast.join(", ") : dayMeals.breakfast}
                          </div>
                        ) : <span className="text-muted small">-</span>}
                      </td>

                      {/* Lunch Column */}
                      <td className="p-2">
                        {dayMeals?.lunch ? (
                          <div className="p-2 py-3 rounded-3 text-wrap small fw-semibold" style={{ background: "#E0F2FE", color: "#0369A1" }}>
                            {Array.isArray(dayMeals.lunch) ? dayMeals.lunch.join(", ") : dayMeals.lunch}
                          </div>
                        ) : <span className="text-muted small">-</span>}
                      </td>

                      {/* Supper Column */}
                      <td className="p-2">
                        {dayMeals?.supper ? (
                          <div className="p-2 py-3 rounded-3 text-wrap small fw-semibold" style={{ background: "#FEF3C7", color: "#B45309" }}>
                            {Array.isArray(dayMeals.supper) ? dayMeals.supper.join(", ") : dayMeals.supper}
                          </div>
                        ) : <span className="text-muted small">-</span>}
                      </td>

                      {/* Fruits Column (Aligned to your exact singular '.fruit' property lookup) */}
                      <td className="p-2">
                        {dayMeals?.fruit ? (
                          <div className="p-2 py-3 rounded-3 text-wrap small fw-semibold" style={{ background: "#DCFCE7", color: "#15803D" }}>
                            {Array.isArray(dayMeals.fruit) ? dayMeals.fruit.join(", ") : dayMeals.fruit}
                          </div>
                        ) : <span className="text-muted small">-</span>}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

          <div className="mt-2">
            <p className="mt-2 primary-text fw-bold">NOTES: </p>

            <div className="border-black border-top py-3 mt-1">
            </div>
            <div className="border-black border-top p-0">
            </div>
          </div>
        </div>

      </div>


    </>
  );
}

