
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function RecruiterRegister() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        company: "",
        email: "",
        password: "",
        confirm_password: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");

        if (form.password !== form.confirm_password) {
            setMessage("Passwords do not match.");
            return;
        }

        if (form.password.length < 10) {
            setMessage("Password must contain at least 10 characters.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                "/api/auth/recruiter/register/",
                {
                    full_name: form.full_name.trim(),
                    company: form.company.trim(),
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                }
            );

            navigate("/hr/verify-email-otp", {
                state: {
                    email: response.data.email,
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
                        const value = Array.isArray(errors)
                            ? errors.join(" ")
                            : String(errors);
                        return `${field}: ${value}`;
                    })
                    .join(" ");
            }

            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1 className="logo">NEXORA</h1>

                <p className="subtitle">RECRUITER REGISTRATION</p>

                <h2>Create your recruiter account</h2>

                <p>
                    Join Nexora to publish opportunities and discover talented candidates.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="full_name">Full Name</label>
                        <input
                            id="full_name"
                            name="full_name"
                            value={form.full_name}
                            onChange={handleChange}
                            placeholder="Your full name"
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="company">Company Name</label>
                        <input
                            id="company"
                            name="company"
                            value={form.company}
                            onChange={handleChange}
                            placeholder="Your company"
                            autoComplete="organization"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Work Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@company.com"
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
                            value={form.password}
                            onChange={handleChange}
                            placeholder="At least 10 characters"
                            autoComplete="new-password"
                            minLength={10}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirm_password">Confirm Password</label>
                        <input
                            id="confirm_password"
                            type="password"
                            name="confirm_password"
                            value={form.confirm_password}
                            onChange={handleChange}
                            placeholder="Enter password again"
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    {message && (
                        <p className="message" role="alert">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create Recruiter Account"}
                    </button>
                </form>

                <p className="switch-text">
                    Already registered?
                </p>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate("/hr/login")}
                >
                    Sign in
                </button>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate("/login")}
                >
                    Back to Nexora
                </button>
            </section>
        </main>
    );
}

export default RecruiterRegister;
