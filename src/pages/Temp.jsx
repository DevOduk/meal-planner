import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";

export default function Temp() {
  const { handleSignUp, loading, setToast } = useAuth();
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState([false, "", ""]);


  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setToast({ open: true, message: "Passwords do not match.", severity: "error" });
      setError([true, "password", "Passwords do not match."]);
      return;
    }
    await handleSignUp(email, password, userName, fullName);
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 authBg">
      <div id="logreg-forms" className="authCard" style={{ width: "100%", maxWidth: "480px", margin: "1rem" }}>
        <form className="form-signup p-5" onSubmit={onSubmit}>
          <div className="text-center mb-4">
            <div className="authLogo mb-3">🍽️</div>
            <h1 className="h2 fw-bold mb-2">Create account</h1>
            <p className="text-muted small">Join us to start planning your meals</p>
          </div>

          <div className="mb-3">
            <label className="form-label fw-600 small mb-2">Username</label>
            <input
              type="text"
              className="form-control authInput"
              placeholder="Enter a unique username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              name="username"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-600 small mb-2">Full Name</label>
            <input
              type="text"
              className="form-control authInput"
              placeholder="e.g John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-600 small mb-2">Email Address</label>
            <input
              type="email"
              className="form-control authInput"
              placeholder="Your Email Address"
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
              <button type="button" className="authPasswordToggle" onClick={() => setShowPassword(!showPassword)}>
                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-600 small mb-2">Confirm Password</label>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control authInput"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error[0] && error[1] === "password" && (
              <small className="text-muted text-danger mt-1 d-block">
                {error[2]}
              </small>
            )}
          </div>

          <button className="btn btn-dark w-100 fw-600 py-2 mb-3 authSignInBtn" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Sign Up"}
          </button>

          <div className="text-center">
            <span className="text-muted small">Already have an account? </span>
            <a href="/login" className="authLink small fw-600">
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}