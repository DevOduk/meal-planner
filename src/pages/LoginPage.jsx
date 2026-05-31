import { useAuth } from "@/context/AuthProvider";
import { useState } from "react";

export default function Login() {
  const { handleLogin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 authBg">
      <div id="logreg-forms" className="authCard" style={{ width: "100%", maxWidth: "480px", margin: "1rem" }}>
        <form className="form-signin p-5" onSubmit={onSubmit}>
          <div className="text-center mb-4">
            <div className="authLogo mb-3">🍽️</div>
            <h1 className="h2 fw-bold mb-2">Welcome back</h1>
            <p className="text-muted small">Please enter your details to sign in</p>
          </div>

          <div className="mb-3">
            <label className="form-label fw-600 small mb-2">Your Email Address</label>
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
                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
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
              <label className="form-check-label small" htmlFor="rememberMe">
                Remember me
              </label>
            </div>
            <a href="/reset" className="authLink small">
              Forgot password?
            </a>
          </div>

          <button className="btn btn-dark w-100 fw-600 py-2 mb-4 authSignInBtn" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Sign in"}
          </button>

          <div className="text-center">
            <span className="text-muted small">Don't have an account? </span>
            <a href="/signup" className="authLink small fw-600">
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}