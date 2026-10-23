
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";
import "./Login.css";

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email || "";
    const resetToken = location.state?.resetToken || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!email || !resetToken) {
            setMessage(
                "Your password reset session is missing or expired. Please request a new OTP."
            );
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await resetPassword(
                email,
                resetToken,
                password
            );

            setMessage(
                response?.detail ||
                "Password reset successful. Please log in."
            );

            setTimeout(() => navigate("/login"), 1500);
        } catch (error) {
            const data = error.response?.data;

            const errorMessage =
                data?.detail ||
                data?.error ||
                data?.message ||
                "Unable to reset your password. Please try again.";

            setMessage(
                Array.isArray(errorMessage)
                    ? errorMessage.join(" ")
                    : errorMessage
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="logo">Nexora</h1>

                <h2>Reset Password</h2>

                <p className="subtitle">
                    Create a new password for your Nexora account.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="new-password">
                            New Password
                        </label>

                        <input
                            id="new-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirm-password">
                            Confirm Password
                        </label>

                        <input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            required
                        />
                    </div>

                    <label className="password-visibility">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) =>
                                setShowPassword(e.target.checked)
                            }
                        />
                        Show passwords
                    </label>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                {message && (
                    <div
                        className="message-banner error"
                        role="alert"
                    >
                        {message}
                    </div>
                )}

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate("/login")}
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
}

export default ResetPassword;
