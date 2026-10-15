import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {

    const navigate = useNavigate();

    const handleLogout = () => {

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        navigate("/login");
    };

    return (
        <nav className="navbar">

            <div className="navbar-logo">
                Nexora
            </div>

            <div className="navbar-links">

                <Link to="/profile">
                    Profile
                </Link>

                <Link to="/education">
                    Education
                </Link>

                <Link to="/skills">
                    Skills
                </Link>

                <Link to="/experience">
                    Experience
                </Link>
                <Link to="/resume">
    Resume
</Link>

                <button
                    onClick={handleLogout}
                    className="logout-button"
                >
                    Logout
                </button>

            </div>

        </nav>
    );
}

export default Navbar;


