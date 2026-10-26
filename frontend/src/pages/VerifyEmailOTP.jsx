
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmailOTP } from "../services/api";
import "./Login.css";

function VerifyEmailOTP() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(
        location.state?.email || ""
    );
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const normalizedEmail = email.trim().toLowerCase();
        const enteredOTP = otp.trim();

        if (!normalizedEmail) {
            setMessage("Please enter your registered email address.");
            return;
        }

        if (!/^\d{6}$/.test(enteredOTP)) {
            setMessage("Please enter the six-digit verification code.");
            return;
        }

        setLoading(true);

        try {
            const response = await verifyEmailOTP(
                normalizedEmail,
                enteredOTP
            );

            setVerified(true);
            setMessage(
                response.detail ||
                "Email verified successfully. You can now log in."
            );
        } catch (error) {
            const data = error.response?.data;

            setMessage(
                typeof data?.detail === "string"
                    ? data.detail
                    : "Email verification failed. Check your code and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="logo">Nexora</h1>

                <p className="subtitle">
                    Verify your email address
                </p>

                <p>
                    Enter the six-digit code sent to your email
                    address to activate your account.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="verification-email">
                            Email address
                        </label>

                        <input
                            id="verification-email"
                            type="email"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                            disabled={loading || verified}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="verification-otp">
                            Six-digit verification code
                        </label>

                        <input
                            id="verification-otp"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) =>
                                setOtp(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6)
                                )
                            }
                            autoComplete="one-time-code"
                            required
                            disabled={loading || verified}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading || verified}
                    >
                        {loading
                            ? "Verifying..."
                            : verified
                                ? "Email Verified"
                                : "Verify Email"}
                    </button>
                </form>

                {message && (
                    <p className="message" role="status">
                        {message}
                    </p>
                )}

                {verified && (
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => navigate("/login", { replace: true })}
                    >
                        Continue to Login
                    </button>
                )}

                {!verified && (
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => navigate("/register")}
                    >
                        Back to Registration
                    </button>
                )}
            </div>
        </div>
    );
}

export default VerifyEmailOTP;
