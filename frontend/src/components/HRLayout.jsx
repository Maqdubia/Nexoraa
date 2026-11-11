
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/recruiterApi";
import NexoraBrand from "./NexoraBrand";
import "./HRLayout.css";

const Icon = ({ name }) => {
    const paths = {
        dashboard: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </>
        ),
        jobs: (
            <>
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
            </>
        ),
        people: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        logout: (
            <>
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </>
        ),
        menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    };

    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name]}
        </svg>
    );
};

const initials = (name = "") =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "R";

function HRLayout({ title, subtitle, actions, children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        let active = true;

        getCurrentUser()
            .then((data) => {
                if (active) setUser(data);
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, []);

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/hr/login");
    };

    const linkClass = ({ isActive }) =>
        isActive ? "hr-nav-link active" : "hr-nav-link";

    return (
        <div className="hr-shell">
            <aside className={`hr-sidebar ${menuOpen ? "open" : ""}`}>
                <div className="hr-brand">
                    <NexoraBrand size="compact" />
                </div>

                <p className="hr-nav-label">MAIN MENU</p>

                <nav onClick={() => setMenuOpen(false)}>
                    <NavLink to="/hr/dashboard" className={linkClass}>
                        <Icon name="dashboard" /> Dashboard
                    </NavLink>
                    <NavLink to="/hr/jobs" className={linkClass}>
                        <Icon name="jobs" /> Jobs
                    </NavLink>
                    <NavLink to="/hr/candidates" className={linkClass}>
                        <Icon name="people" /> Candidates
                    </NavLink>
                </nav>

                <div className="hr-sidebar-bottom">
                    <div className="hr-user">
                        <span className="hr-avatar">
                            {initials(user?.name || user?.username)}
                        </span>
                        <span>
                            <strong>{user?.name || "Recruiter"}</strong>
                            <small>{user?.email || "Nexora workspace"}</small>
                        </span>
                    </div>

                    <button
                        type="button"
                        className="hr-logout"
                        onClick={logout}
                    >
                        <Icon name="logout" /> Sign out
                    </button>
                </div>
            </aside>

            {menuOpen && (
                <div
                    className="hr-backdrop"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <main className="hr-main">
                <header className="hr-topbar">
                    <button
                        type="button"
                        className="hr-menu-btn"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Icon name="menu" />
                    </button>

                    <div className="hr-heading">
                        <h1>{title}</h1>
                        {subtitle && <p>{subtitle}</p>}
                    </div>

                    {actions && (
                        <div className="hr-actions">{actions}</div>
                    )}
                </header>

                <div className="hr-content">{children}</div>
            </main>
        </div>
    );
}

export default HRLayout;
