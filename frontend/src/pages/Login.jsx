
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import GoogleSignInButton from "../components/GoogleSignInButton";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = (result) => {
    const role = result.user?.role;
    const destination = role === "admin" || role === "hr" || role === "recruiter"
      ? "/hr/dashboard"
      : "/dashboard";
    navigate(destination, { replace: true });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      setMessage({
        text: "Login successful! Redirecting...",
        type: "success",
      });

      setTimeout(() => navigate("/portal"), 600);
    } catch (error) {
      console.error("Login error:", error.response?.data || error);

      const errMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Login failed. Check your email and password.";

      setMessage({
        text: typeof errMsg === "object"
          ? JSON.stringify(errMsg)
          : errMsg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-header">
          <h1 className="logo">Nexora</h1>
        </div>

        <p className="subtitle">
          Welcome back! Please enter your details.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                padding: "4px 0",
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="divider">
          <span>or continue with</span>
        </div>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} />

        <p className="switch-text">
          Don't have an account?
        </p>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/register")}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

export default Login;
