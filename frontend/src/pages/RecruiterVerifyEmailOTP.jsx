
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmailOTP } from "../services/api";
import "./Login.css";

function RecruiterVerifyEmailOTP() {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(location.state?.email || "");
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");

        if (!/^\d{6}$/.test(otp)) {
            setMessage("Enter the six-digit verification code.");
            return;
        }

        setLoading(true);

        try {
            const response = await verifyEmailOTP(email, otp);

            setVerified(true);
            setMessage(
                response.detail ||
                "Your recruiter account is now active."
            );
        } catch (error) {
            setMessage(
                error.response?.data?.detail ||
                "Verification failed. Check your code and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1 className="logo">NEXORA</h1>

                <p className="subtitle">RECRUITER EMAIL VERIFICATION</p>

                <h2>Verify your work email</h2>

                <p>
                    Enter the six-digit code sent to your email.
                    Your recruiter account will activate after verification.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="recruiter-email">Email address</label>
                        <input
                            id="recruiter-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            disabled={loading || verified}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="recruiter-otp">Verification code</label>
                        <input
                            id="recruiter-otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            pattern="[0-9]{6}"
                            placeholder="000000"
                            value={otp}
                            onChange={(event) =>
                                setOtp(
                                    event.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6)
                                )
                            }
                            required
                            disabled={loading || verified}
                        />
                    </div>

                    {message && (
                        <p className="message" role="status">
                            {message}
                        </p>
                    )}

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

                {verified && (
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => navigate("/hr/login", { replace: true })}
                    >
                        Continue to Recruiter Login
                    </button>
                )}

                {!verified && (
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => navigate("/hr/register")}
                    >
                        Back to Registration
                    </button>
                )}
            </section>
        </main>
    );
}

export default RecruiterVerifyEmailOTP;
