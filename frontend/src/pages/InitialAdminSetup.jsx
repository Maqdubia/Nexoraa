
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function InitialAdminSetup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        email: "nexora.job.app@gmail.com",
        password: "",
        setup_key: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/auth/initial-admin-setup/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    Array.isArray(data.detail)
                        ? data.detail.join(" ")
                        : data.detail || "Admin setup failed."
                );
            }

            setSuccess(true);
            setMessage(data.detail);
            setForm({
                full_name: "",
                email: "nexora.job.app@gmail.com",
                password: "",
                setup_key: "",
            });
        } catch (error) {
            setMessage(error.message || "Unable to create Admin account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#f8f6f0",
            padding: "24px",
            color: "#243b32",
            fontFamily: "Arial, sans-serif",
        }}>
            <section style={{
                width: "100%",
                maxWidth: "460px",
                background: "#fff",
                padding: "36px",
                borderRadius: "18px",
                border: "1px solid #e5e0d5",
                boxShadow: "0 12px 35px rgba(36,59,50,0.08)",
            }}>
                <h1 style={{ marginBottom: "8px" }}>NEXORA</h1>
                <p style={{ color: "#75877c", marginTop: 0 }}>
                    INITIAL ADMINISTRATOR SETUP
                </p>

                <h2>Create your Admin account</h2>
                <p>Set up the primary administrator for Nexora.</p>

                {message && (
                    <p role="status" style={{
                        padding: "12px",
                        borderRadius: "8px",
                        background: success ? "#e8f4ec" : "#fff0ed",
                        color: success ? "#24613b" : "#a12d20",
                    }}>
                        {message}
                    </p>
                )}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="full_name">Full name</label>
                        <input
                            id="full_name"
                            name="full_name"
                            value={form.full_name}
                            onChange={handleChange}
                            required
                            autoComplete="name"
                            style={inputStyle}
                        />

                        <label htmlFor="email">Admin email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            readOnly
                            style={inputStyle}
                        />

                        <label htmlFor="password">Create a strong password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={10}
                            autoComplete="new-password"
                            style={inputStyle}
                        />

                        <label htmlFor="setup_key">Private setup key</label>
                        <input
                            id="setup_key"
                            name="setup_key"
                            type="password"
                            value={form.setup_key}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                            style={inputStyle}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={buttonStyle}
                        >
                            {loading ? "Creating account..." : "Create Admin account"}
                        </button>
                    </form>
                )}

                {success && (
                    <button
                        onClick={() => navigate("/login")}
                        style={buttonStyle}
                    >
                        Go to login
                    </button>
                )}
            </section>
        </main>
    );
}

const inputStyle = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    margin: "8px 0 18px",
    border: "1px solid #d9ded8",
    borderRadius: "8px",
    fontSize: "15px",
};

const buttonStyle = {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#244c3b",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "12px",
};

export default InitialAdminSetup;
