import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider"; // Adjust your path
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const { handleResetPassword, handleUpdatePassword, loading, user, setToast } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  console.log(user)
  useEffect(() => {
    // 1. Listen actively for the explicit PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoverySession(true);
      } else if (session && event === "SIGNED_IN") {
        // If they are logged in normally but DID NOT trigger a recovery event,
        // it means their password is fine. Bounce them to safety.
        // navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleRequestLink = async (e) => {
    e.preventDefault();
    if (!email) {
      setToast({ open: true, message: "Please enter your email address.", severity: "error" });
      return;
    }
    if (user && email !== user.email) {
      setToast({ open: true, message: "The email you entered does not match your account email.", severity: "error" });
      return;
    }
    await handleResetPassword(email);
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    const success = await handleUpdatePassword(newPassword);
    if (success) {
      // 2. Clear the local view flag immediately on success
      setIsRecoverySession(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 authBg">
      <div id="logreg-forms" className="authCard" style={{ width: "100%", maxWidth: "480px", margin: "1rem" }}>

        {isRecoverySession ? (
          /* PHASE 2: Only shows if the entry event type was explicitly PASSWORD_RECOVERY */
          <form className="form-reset p-5" onSubmit={handleSetNewPassword}>
            <div className="text-center mb-4">
              <div className="authLogo mb-3">🔒</div>
              <h1 className="h2 fw-bold mb-2">Create New Password</h1>
              <p className="text-muted small">Enter your secure new account password below</p>
            </div>

            <div className="mb-4">
              <label className="form-label fw-600 small mb-2">New Password</label>
              <input
                type="password"
                className="form-control authInput"
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-dark w-100 fw-600 py-3 mb-3 authSignInBtn" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save Password"}
            </button>
          </form>
        ) : (
          /* PHASE 1: Default view to request link / shows if change is done */
          <form className="form-reset p-5" onSubmit={handleRequestLink}>
            <div className="text-center mb-4">
              <div className="authLogo mb-3">🍽️</div>
              <h1 className="h2 fw-bold mb-2">Reset Password</h1>
              <p className="text-muted small">Enter your email to receive a reset link {user?.email}</p>
            </div>

            <div className="mb-4">
              <label className="form-label fw-600 small mb-2">Your Email Address</label>
              <input
                type="email"
                className="form-control authInput"
                placeholder="Your Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>


            <button className="btn btn-dark w-100 fw-600 py-2 mb-4 authSignInBtn" type="submit" disabled={loading}>
              {loading ? "Sending ..." : "Reset Password"}
            </button>

            <a href="/login" className="authLink d-block w-100 text-center small fw-600">
              Back to sign in
            </a>
          </form>
        )}

      </div>
    </div>
  );
}