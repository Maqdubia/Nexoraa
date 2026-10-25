
import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const iconPaths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    education: <><path d="m2 10 10-6 10 6-10 6-10-6Z" /><path d="M6 12.5V17c3.5 3 8.5 3 12 0v-4.5" /><path d="M22 10v6" /></>,
    skills: <><path d="M12 3v3m6.4-.4-2.1 2.1M21 12h-3m.4 6.4-2.1-2.1M12 21v-3m-6.4.4 2.1-2.1M3 12h3m-.4-6.4 2.1 2.1" /><circle cx="12" cy="12" r="5" /></>,
    experience: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    resume: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    jobs: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>,
    analytics: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    applications: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3.5h6M8 9h8M8 13h8M8 17h5" /></>,
    interview: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m8 19-2 3M16 19l2 3M8 11h.01M12 11h.01M16 11h.01" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
};

function LineIcon({ name, className = "" }) {
    return (
        <svg
            className={`line-icon ${className}`}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {iconPaths[name]}
        </svg>
    );
}

const navigation = [
    { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/profile", label: "Profile", icon: "profile" },
    { to: "/education", label: "Education", icon: "education" },
    { to: "/skills", label: "Skills", icon: "skills" },
    { to: "/experience", label: "Experience", icon: "experience" },
    { to: "/resume", label: "Resume", icon: "resume" },
    { to: "/jobs", label: "Jobs", icon: "jobs" },
    { to: "/skill-gap", label: "Skill Gap", icon: "analytics" },
    { to: "/my-applications", label: "My Applications", icon: "applications" },
    { to: "/ai-interview", label: "AI Interview", icon: "interview" },
    { to: "/interview-history", label: "Interview History", icon: "history" },
];

function Sidebar({
    isOpen = false,
    onClose = () => {},
    isCollapsed = false,
    onToggleCollapse = () => {},
}) {
    const navigate = useNavigate();

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.classList.add("sidebar-drawer-open");
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.classList.remove("sidebar-drawer-open");
        };
    }, [isOpen, onClose]);

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        onClose();
        navigate("/login", { replace: true });
    };

    return (
        <>
            <button
                type="button"
                className={`mobile-sidebar-toggle ${isOpen ? "is-hidden" : ""}`}
                onClick={() => {
                    if (!isOpen) {
                        // The parent owns the drawer state. This event
                        // is handled by the callback supplied below.
                        onOpenSidebar();
                    }
                }}
                aria-label="Open navigation menu"
                aria-expanded={isOpen}
            >
                <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    aria-hidden="true"
                >
                    <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
            </button>

            <button
                type="button"
                className={`sidebar-backdrop ${isOpen ? "visible" : ""}`}
                onClick={onClose}
                aria-label="Close navigation"
                tabIndex={isOpen ? 0 : -1}
            />

            <aside
                className={`sidebar ${isOpen ? "sidebar-open" : ""} ${isCollapsed ? "sidebar-collapsed" : ""}`}
                aria-label="Main navigation"
            >
                <button
                    type="button"
                    className="sidebar-collapse-toggle"
                    onClick={onToggleCollapse}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!isCollapsed}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        {isCollapsed
                            ? <path d="m9 18 6-6-6-6" />
                            : <path d="m15 18-6-6 6-6" />}
                    </svg>
                </button>

                <div className="sidebar-mobile-top">
                    <span>Navigation</span>
                    <button
                        type="button"
                        className="sidebar-close"
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <path d="m6 6 12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>

                <NavLink
                    to="/dashboard"
                    className="sidebar-logo"
                    onClick={onClose}
                    aria-label="Nexora home"
                >
                    <span className="sidebar-logo-mark">
                        <svg
                            viewBox="0 0 24 24"
                            width="23"
                            height="23"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M19 4c-8 0-13 4-13 11 0 3 2 5 5 5 7 0 10-7 8-16Z" />
                            <path d="M4 21c2-5 5-8 10-11" />
                        </svg>
                    </span>

                    <span className="sidebar-brand-text">
                        <strong>Nexora.</strong>
                        <small>Career Platform</small>
                    </span>
                </NavLink>

                <nav className="sidebar-menu" aria-label="Application pages">
                    {navigation.map((item) => (
                        <NavLink
                            to={item.to}
                            key={item.to}
                            onClick={onClose}
                            title={isCollapsed ? item.label : undefined}
                            className={({ isActive }) =>
                                isActive ? "active" : ""
                            }
                        >
                            <LineIcon name={item.icon} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <button
                        className="logout-btn"
                        onClick={logout}
                        type="button"
                    >
                        <LineIcon name="logout" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
