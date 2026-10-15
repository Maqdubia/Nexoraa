import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/login", { replace: true });
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <h2>NEXORA</h2>
                <p>Career Platform</p>
            </div>

            <nav className="sidebar-menu">
                {/* Dashboard */}
                <NavLink to="/dashboard">
                    <span>🏠</span>
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/profile">
                    <span>👤</span>
                    <span>Profile</span>
                </NavLink>

                <NavLink to="/education">
                    <span>🎓</span>
                    <span>Education</span>
                </NavLink>

                <NavLink to="/skills">
                    <span>💡</span>
                    <span>Skills</span>
                </NavLink>

                <NavLink to="/experience">
                    <span>💼</span>
                    <span>Experience</span>
                </NavLink>

                <NavLink to="/resume">
                    <span>📄</span>
                    <span>Resume</span>
                </NavLink>

                <NavLink to="/jobs">
                    <span>💼</span>
                    <span>Jobs</span>
                </NavLink>

                <NavLink to="/skill-gap">
                    <span>📊</span>
                    <span>Skill Gap</span>
                </NavLink>

                <NavLink to="/my-applications">
                    <span>📋</span>
                    <span>My Applications</span>
                </NavLink>

                <NavLink to="/ai-interview">
                    <span>🤖</span>
                    <span>AI Interview</span>
                </NavLink>

                <NavLink to="/interview-history">
                    <span>📚</span>
                    <span>Interview History</span>
                </NavLink>
            </nav>

            <div className="sidebar-bottom">
                <button
                    className="logout-btn"
                    onClick={logout}
                >
                    <span>🚪</span>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;