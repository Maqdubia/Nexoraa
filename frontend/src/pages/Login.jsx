import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

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
      await loginUser(formData);

      setMessage({ text: "Login successful! Redirecting...", type: "success" });

      setTimeout(() => {
        navigate("/profile");
      }, 600);
    } catch (error) {
      console.error(error);
      const errMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";

      setMessage({
        text: typeof errMsg === "object" ? JSON.stringify(errMsg) : errMsg,
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
          <div className="logo-icon">✨</div>
          <h1 className="logo">Nexora</h1>
        </div>

        <p className="subtitle">Welcome back! Please enter your details.</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="e.g. naveed"
              value={formData.username}
              onChange={handleChange}
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
              required
            />
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
          <span>or</span>
        </div>

        <p className="switch-text">Don't have an account?</p>

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