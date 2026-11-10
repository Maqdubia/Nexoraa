
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { getCurrentUser } from "../services/recruiterApi";
import "./HRLogin.css";

function HRLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            await loginUser({ email, password });
            const user = await getCurrentUser();

            if (user.role === "recruiter") {
                navigate("/hr/dashboard", { replace: true });
            } else if (user.role === "admin") {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                setMessage("Admin accounts must use the Admin portal.");
            } else {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                setMessage("This login is for recruiter accounts only.");
            }
        } catch (error) {
            setMessage(
                error.response?.data?.detail ||
                "Unable to sign in. Check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="hr-login-page">
            <section className="hr-login-card">
                <div className="hr-brand">NEXORA<span>.</span></div>
                <p className="hr-login-label">RECRUITER PORTAL</p>
                <h1>Welcome back.</h1>
                <p className="hr-login-description">
                    Sign in to manage opportunities and discover talent.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="hr-email">Work email</label>
                    <input
                        id="hr-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="username"
                        required
                    />

                    <label htmlFor="hr-password">Password</label>
                    <input
                        id="hr-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />

                    {message && (
                        <p className="hr-login-error" role="alert">
                            {message}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in to recruiter portal"}
                    </button>
                </form>

                <p className="hr-login-footer">
                    New to Nexora?
                </p>

                <button
                    className="hr-back-button"
                    type="button"
                    onClick={() => navigate("/hr/register")}
                >
                    Create a recruiter account
                </button>

                <button
                    className="hr-back-button"
                    type="button"
                    onClick={() => navigate("/login")}
                >
                    Back to student login
                </button>
            </section>
        </main>
    );
}

export default HRLogin;
