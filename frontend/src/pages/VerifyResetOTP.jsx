
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyPasswordResetOTP } from "../services/api";
import "./Login.css";

function VerifyResetOTP() {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setMessage("Email address is missing. Please request a new OTP.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await verifyPasswordResetOTP(
                email,
                otp.trim()
            );

            const resetToken =
                response?.reset_token ||
                response?.resetToken ||
                response?.token;

            if (!resetToken) {
                setMessage(
                    "OTP verification response did not contain a reset token. The backend response needs to be checked."
                );
                return;
            }

            navigate("/reset-password", {
                state: { email, resetToken },
            });
        } catch (error) {
            const data = error.response?.data;

            setMessage(
                data?.error ||
                data?.message ||
                "OTP verification failed. Please check the code and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="logo">Nexora</h1>

                <h2>Verify Your Email</h2>

                <p className="subtitle">
                    Enter the six-digit OTP sent to your registered email.
                </p>

                {email && (
                    <p className="subtitle">{email}</p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="otp">Email OTP</label>

                        <input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) =>
                                setOtp(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6)
                                )
                            }
                            pattern="[0-9]{6}"
                            maxLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
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
                    onClick={() => navigate("/forgot-password")}
                >
                    Request Another OTP
                </button>
            </div>
        </div>
    );
}

export default VerifyResetOTP;
