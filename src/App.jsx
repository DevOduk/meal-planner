import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/LoginPage";
import ResetPassword from "./pages/ResetPwPage";
import AddMeal from "./pages/AddMeal";
import Onboarding from "./pages/Onboarding"; // Import your onboarding page
import PageNotFound from "./pages/PageNotFound";
import { AuthProvider, useAuth } from "./context/AuthProvider";
import AccountPage from "./pages/AccountPage";
import { Backdrop, CircularProgress } from "@mui/material";
import EditAccountPage from "./pages/EditAccountPage";
import SignUpPage from "./pages/SignUpPage";

const ProtectedRoute = ({ children }) => {
  const { user, loading, profile } = useAuth();

  // 1. If Supabase is still actively verifying the initial login session,
  // DO NOT show a blank page or a separate loader. Show the backdrop overlay right away!
  if (loading && !user) {
    return (
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => Math.max(theme.zIndex.modal, theme.zIndex.drawer) + 999,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)", // Premium glass blur effect
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        open={true} // Forces it open during initial session check
      >
        <CircularProgress
          size={35}
          color="inherit"
          sx={{
            animationDuration: "500ms",
            "& .MuiCircularProgress-circle": { animationDuration: "500ms" },
          }}
        />
        <span className="fw-semibold text-light">Loading session...</span>
      </Backdrop>
    );
  }

  // 2. Once loading is complete, if there's genuinely no user session, bounce them to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If logged in but hasn't completed onboarding, intercept and force onboarding layout
  if (profile?.onboarded === false) {
    console.log("User is logged in but hasn't completed onboarding.");
    return <Navigate to="/onboarding" replace />;
  }

  // 4. Normal Authenticated View: Show the target page content 
  // along with the backdrop handler for background actions (like saving changes)
  return (
    <>
      {children}

      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => Math.max(theme.zIndex.modal, theme.zIndex.drawer) + 999,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(3px)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        open={!!loading} // Toggles on/off normally based on active operations
      >
        <CircularProgress
          size={35}
          color="inherit"
          sx={{
            animationDuration: "500ms",
            "& .MuiCircularProgress-circle": { animationDuration: "500ms" },
          }}
        />
        <span className="fw-semibold text-light">Just a moment...</span>
      </Backdrop>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/edit"
            element={
              <ProtectedRoute>
                <EditAccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <Onboarding />
            }
          />

          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <AddMeal />
              </ProtectedRoute>
            }
          />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/reset" element={<ResetPassword />} />

          {/* Catch-All Fallback */}
          <Route path="/*" element={<PageNotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;