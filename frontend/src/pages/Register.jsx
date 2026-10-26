
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import "./Login.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData((previous) => ({
            ...previous,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await registerUser({
                ...formData,
                email: formData.email.trim().toLowerCase(),
            });

            setMessage(
                response.detail ||
                "Registration received. Check your email for the verification code."
            );

            navigate("/verify-email-otp", {
                state: {
                    email: formData.email.trim().toLowerCase(),
                },
            });
        } catch (error) {
            const data = error.response?.data;

            let errorMessage = "Registration failed. Please try again.";

            if (typeof data?.detail === "string") {
                errorMessage = data.detail;
            } else if (data && typeof data === "object") {
                errorMessage = Object.entries(data)
                    .map(([field, errors]) => {
                        const text = Array.isArray(errors)
                            ? errors.join(" ")
                            : String(errors);

                        return `${field}: ${text}`;
                    })
                    .join(" ");
            } else if (error.message) {
                errorMessage = error.message;
            }

            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="logo">Nexora</h1>

                <p className="subtitle">
                    Create your account
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            placeholder="Enter username"
                            value={formData.username}
                            onChange={handleChange}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="Enter email"
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
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                {message && (
                    <p className="message" role="status">
                        {message}
                    </p>
                )}

                <p className="switch-text">
                    Already have an account?
                </p>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate("/login")}
                >
                    Login
                </button>
            </div>
        </div>
    );
}

export default Register;
