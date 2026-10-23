
import { Link } from "react-router-dom";
import "./Dashboard.css";

const icons = {
    jobs: (
        <>
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
        </>
    ),
    applications: (
        <>
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M9 3.5h6M8 9h8M8 13h8M8 17h5" />
        </>
    ),
    resume: (
        <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6M8 13h8M8 17h8" />
        </>
    ),
    interview: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M8 19l-2 3M16 19l2 3M8 11h.01M12 11h.01M16 11h.01" />
        </>
    ),
    profile: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
    ),
    skills: (
        <>
            <circle cx="12" cy="12" r="8" />
            <path d="m8.5 12 2.2 2.2 4.8-5" />
        </>
    ),
    analytics: (
        <>
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </>
    ),
    history: (
        <>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5M12 7v5l3 2" />
        </>
    ),
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    leaf: (
        <>
            <path d="M19 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-7 9-16Z" />
            <path d="M4 21c2-5 5-8 10-11" />
        </>
    ),
};

function DashboardIcon({ name, className = "" }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            width="23"
            height="23"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {icons[name]}
        </svg>
    );
}

const overviewCards = [
    {
        title: "Find Jobs",
        description: "Explore opportunities matching your skills.",
        icon: "jobs",
        link: "/jobs",
        button: "Explore jobs",
    },
    {
        title: "My Applications",
        description: "Check the jobs you have applied for.",
        icon: "applications",
        link: "/my-applications",
        button: "View applications",
    },
    {
        title: "Resume Analysis",
        description: "Review your resume and identify areas to improve.",
        icon: "resume",
        link: "/resume",
        button: "View resume",
    },
    {
        title: "AI Interview",
        description: "Practice questions and improve your answers.",
        icon: "interview",
        link: "/ai-interview",
        button: "Start practice",
    },
];

const careerActions = [
    {
        title: "My Profile",
        description: "Update your personal information.",
        icon: "profile",
        link: "/profile",
    },
    {
        title: "My Skills",
        description: "Add and manage your technical skills.",
        icon: "skills",
        link: "/skills",
    },
    {
        title: "Skill Gap Analysis",
        description: "Identify skills to improve for your target jobs.",
        icon: "analytics",
        link: "/skill-gap",
    },
    {
        title: "Interview History",
        description: "Review your previous practice sessions.",
        icon: "history",
        link: "/interview-history",
    },
];

function Dashboard() {
    return (
        <div className="dashboard-page">
            <section className="dashboard-welcome">
                <div className="dashboard-welcome-copy">
                    <span className="dashboard-label">
                        YOUR NEXT CHAPTER
                    </span>

                    <h1>Make your next move count.</h1>

                    <p>
                        Manage your career profile, discover opportunities,
                        strengthen your skills, and prepare for interviews.
                    </p>
                </div>

                <div className="dashboard-welcome-mark" aria-hidden="true">
                    <DashboardIcon name="leaf" />
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-section-heading">
                    <div>
                        <span className="dashboard-eyebrow">
                            YOUR CAREER
                        </span>
                        <h2>Career overview</h2>
                        <p>Choose what you want to work on next.</p>
                    </div>
                </div>

                <div className="dashboard-overview-grid">
                    {overviewCards.map((card) => (
                        <article
                            className="dashboard-card"
                            key={card.title}
                        >
                            <div className="dashboard-card-icon">
                                <DashboardIcon name={card.icon} />
                            </div>

                            <h3>{card.title}</h3>
                            <p>{card.description}</p>

                            <Link
                                to={card.link}
                                className="dashboard-card-link"
                            >
                                {card.button}
                                <DashboardIcon
                                    name="arrow"
                                    className="dashboard-link-arrow"
                                />
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-section-heading">
                    <div>
                        <span className="dashboard-eyebrow">
                            SMALL STEPS, REAL PROGRESS
                        </span>
                        <h2>Career development</h2>
                        <p>
                            Build your profile and prepare for opportunities.
                        </p>
                    </div>
                </div>

                <div className="dashboard-actions-grid">
                    {careerActions.map((action) => (
                        <Link
                            to={action.link}
                            className="dashboard-action-card"
                            key={action.title}
                        >
                            <span className="dashboard-action-icon">
                                <DashboardIcon name={action.icon} />
                            </span>

                            <span className="dashboard-action-copy">
                                <strong>{action.title}</strong>
                                <small>{action.description}</small>
                            </span>

                            <DashboardIcon
                                name="arrow"
                                className="dashboard-arrow"
                            />
                        </Link>
                    ))}
                </div>
            </section>

            <section className="dashboard-tip">
                <div className="dashboard-tip-icon">
                    <DashboardIcon name="leaf" />
                </div>

                <div className="dashboard-tip-copy">
                    <span className="dashboard-eyebrow">
                        YOUR NEXT STEP
                    </span>
                    <h3>Build a profile that reflects your potential.</h3>
                    <p>
                        Keep your details updated, strengthen your skills,
                        and prepare for the opportunities you want.
                    </p>

                    <Link to="/education" className="dashboard-tip-link">
                        Complete your profile
                        <DashboardIcon
                            name="arrow"
                            className="dashboard-link-arrow"
                        />
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;
