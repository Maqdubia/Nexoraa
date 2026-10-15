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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {

            await registerUser(formData);

            setMessage("Registration successful!");

            setTimeout(() => {
                navigate("/login");
            }, 1000);

        } catch (error) {

            console.log(error);

            setMessage(
                JSON.stringify(
                    error.response?.data ||
                    error.message
                )
            );
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
                        <label>Username</label>

                        <input
                            type="text"
                            name="username"
                            placeholder="Enter username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Email</label>

                        <input
                            type="email"
                            name="email"
                            placeholder="Enter email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                    >
                        Register
                    </button>

                </form>

                {message && (
                    <p className="message">
                        {message}
                    </p>
                )}

                <p className="switch-text">
                    Already have an account?
                </p>

                <button
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