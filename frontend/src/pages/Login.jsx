import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUser, loginUser, logoutUser } from "../services/api";
import GoogleSignInButton from "../components/GoogleSignInButton";
import "./Login.css";

const roleHome = (role) => ({
  student: "/dashboard",
  recruiter: "/hr/dashboard",
  admin: "/admin/accounts",
}[role] || "/dashboard");

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [portal, setPortal] = useState(searchParams.get("portal") === "recruiter" ? "recruiter" : "student");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const finishLogin = async (authResult) => {
    // Use the server's authenticated identity, not the portal selector, to decide access.
    const user = authResult?.user?.role
      ? authResult.user
      : await getCurrentUser();
    const role = user?.role;

    if (!role) throw new Error("We could not verify your Nexora account role. Please sign in again.");
    if (role !== "admin" && role !== portal) {
      logoutUser();
      setMessage({
        text: `This account is registered as a ${role}. Select ${role === "recruiter" ? "Recruiter" : "Student"} login to continue. Your account role has not been changed.`,
        type: "error",
      });
      return;
    }

    navigate(roleHome(role), { replace: true });
  };

  const handleGoogleSuccess = async (result) => {
    try {
      setLoading(true);
      setMessage({ text: "", type: "" });
      await finishLogin(result);
    } catch (error) {
      setMessage({ text: error.message || "Google sign-in could not be completed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const result = await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      await finishLogin(result);
    } catch (error) {
      logoutUser();
      const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
      setMessage({
        text: typeof detail === "string" ? detail : "Login failed. Check your email and password.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-header"><h1 className="logo">Nexora</h1></div>
        <p className="subtitle">Welcome back! Choose your workspace and sign in.</p>

        <div className="login-portal-selector" role="group" aria-label="Choose login portal">
          <button type="button" className={portal === "student" ? "selected" : ""} aria-pressed={portal === "student"} onClick={() => { setPortal("student"); setMessage({ text: "", type: "" }); }}>
            <span className="portal-option-title">Student</span>
            <span className="portal-option-caption">Explore your career</span>
          </button>
          <button type="button" className={portal === "recruiter" ? "selected" : ""} aria-pressed={portal === "recruiter"} onClick={() => { setPortal("recruiter"); setMessage({ text: "", type: "" }); }}>
            <span className="portal-option-title">Recruiter</span>
            <span className="portal-option-caption">Hire great talent</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">{portal === "recruiter" ? "Work email" : "Email address"}</label>
            <input id="email" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} autoComplete="email" required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} autoComplete="current-password" required />
          </div>
          <div className="login-forgot-row">
            <button type="button" onClick={() => navigate("/forgot-password")}>Forgot Password?</button>
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing in..." : `Sign in as ${portal === "recruiter" ? "Recruiter" : "Student"}`}
          </button>
        </form>

        {message.text && <div className={`message-banner ${message.type}`} role="alert">{message.text}</div>}
        <div className="divider"><span>or continue with</span></div>
        <GoogleSignInButton onSuccess={handleGoogleSuccess} disabled={loading} />

        <p className="switch-text">Don't have an account?</p>
        <button type="button" className="secondary-button" onClick={() => navigate("/register")}>Create Account</button>
        {portal === "recruiter" && <p className="recruiter-login-note">Recruiter access is available to approved recruiter accounts.</p>}
      </div>
    </div>
  );
}

export default Login;
