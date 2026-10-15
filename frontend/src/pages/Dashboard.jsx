
import { Link } from "react-router-dom";

import "./Dashboard.css";

function Dashboard() {
    const overviewCards = [
        {
            title: "Find Jobs",
            description: "Explore opportunities matching your skills.",
            icon: "💼",
            link: "/jobs",
            button: "Explore Jobs",
            color: "blue",
        },
        {
            title: "My Applications",
            description: "Check the jobs you have applied for.",
            icon: "📋",
            link: "/my-applications",
            button: "View Applications",
            color: "purple",
        },
        {
            title: "Resume Analysis",
            description: "Review your resume and improve it.",
            icon: "📄",
            link: "/resume",
            button: "View Resume",
            color: "green",
        },
        {
            title: "AI Interview",
            description: "Practice questions and improve your answers.",
            icon: "🤖",
            link: "/ai-interview",
            button: "Start Practice",
            color: "orange",
        },
    ];

    const careerActions = [
        {
            title: "My Profile",
            description: "Update your personal information.",
            icon: "👤",
            link: "/profile",
        },
        {
            title: "My Skills",
            description: "Add and manage your technical skills.",
            icon: "💡",
            link: "/skills",
        },
        {
            title: "Skill Gap Analysis",
            description: "Identify skills to improve for your target jobs.",
            icon: "📊",
            link: "/skill-gap",
        },
        {
            title: "Interview History",
            description: "Review your previous practice sessions.",
            icon: "📚",
            link: "/interview-history",
        },
    ];

    return (
        <div className="dashboard-page">
            {/* Welcome section */}
            <section className="dashboard-welcome">
                <div>
                    <span className="dashboard-label">
                        NEXORA CAREER PLATFORM
                    </span>

                    <h1>Welcome to Your Dashboard 👋</h1>

                    <p>
                        Manage your career profile, discover jobs, improve
                        your skills, and prepare for interviews.
                    </p>
                </div>

                <div className="dashboard-welcome-icon">🚀</div>
            </section>

            {/* Overview cards */}
            <section className="dashboard-section">
                <div className="dashboard-section-heading">
                    <div>
                        <h2>Career Overview</h2>
                        <p>Choose what you want to work on today.</p>
                    </div>
                </div>

                <div className="dashboard-overview-grid">
                    {overviewCards.map((card) => (
                        <div
                            className={`dashboard-card ${card.color}`}
                            key={card.title}
                        >
                            <div className="dashboard-card-icon">
                                {card.icon}
                            </div>

                            <h3>{card.title}</h3>

                            <p>{card.description}</p>

                            <Link
                                to={card.link}
                                className="dashboard-card-link"
                            >
                                {card.button} →
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Career actions */}
            <section className="dashboard-section">
                <div className="dashboard-section-heading">
                    <div>
                        <h2>Career Development</h2>
                        <p>Build your profile and prepare for opportunities.</p>
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
                                {action.icon}
                            </span>

                            <div>
                                <h3>{action.title}</h3>
                                <p>{action.description}</p>
                            </div>

                            <span className="dashboard-arrow">→</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Getting started */}
            <section className="dashboard-tip">
                <div className="dashboard-tip-icon">💡</div>

                <div>
                    <h3>Your next career step</h3>
                    <p>
                        Keep your profile updated, improve your skills,
                        apply for relevant jobs, and practice interviews
                        regularly.
                    </p>

                    <Link to="/education" className="dashboard-tip-link">
                        Complete Your Profile →
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;
