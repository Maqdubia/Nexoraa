
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordResetOTP } from "../services/api";
import "./Login.css";

function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState({
        text: "",
        type: "",
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const response = await requestPasswordResetOTP(
                email.trim()
            );

            setMessage({
                text: response?.message ||
                    "OTP request submitted. Check your email for the code.",
                type: "success",
            });

            // Keep the email available for the OTP verification step.
            navigate("/verify-reset-otp", {
                state: { email: email.trim() },
            });
        } catch (error) {
            const data = error.response?.data;

            setMessage({
                text:
                    data?.error ||
                    data?.message ||
                    (typeof data === "string" ? data : null) ||
                    "Unable to send the OTP. Please check your email and try again.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="logo">Nexora</h1>

                <h2>Forgot Password?</h2>

                <p className="subtitle">
                    Enter your registered email address to receive a
                    password-reset OTP.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send OTP"}
                    </button>
                </form>

                {message.text && (
                    <div
                        className={`message-banner ${message.type}`}
                        role="status"
                        aria-live="polite"
                    >
                        {message.text}
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

export default ForgotPassword;
