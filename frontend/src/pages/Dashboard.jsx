
import { Link } from "react-router-dom";
import "./Dashboard.css";

const icons = {
    jobs: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>,
    applications: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3.5h6M8 9h8M8 13h8M8 17h5" /></>,
    resume: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    interview: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M8 19l-2 3M16 19l2 3M8 11h.01M12 11h.01M16 11h.01" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    skills: <><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" /><circle cx="12" cy="12" r="5" /></>,
    analytics: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    leaf: <><path d="M19 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-7 9-16Z" /><path d="M4 21c2-5 5-8 10-11" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
};

function DashboardIcon({ name, className = "" }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
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
        number: "01",
        title: "Find Jobs",
        description: "Discover opportunities that align with your skills and ambitions.",
        icon: "jobs",
        link: "/jobs",
        button: "Explore opportunities",
        tone: "olive",
    },
    {
        number: "02",
        title: "My Applications",
        description: "Keep track of the opportunities you've applied for.",
        icon: "applications",
        link: "/my-applications",
        button: "Track applications",
        tone: "sand",
    },
    {
        number: "03",
        title: "Resume Analysis",
        description: "Understand your resume and discover where it can improve.",
        icon: "resume",
        link: "/resume",
        button: "Review resume",
        tone: "sage",
    },
    {
        number: "04",
        title: "AI Interview",
        description: "Practise answering questions and build interview confidence.",
        icon: "interview",
        link: "/ai-interview",
        button: "Start practising",
        tone: "clay",
    },
];

const careerActions = [
    {
        title: "My Profile",
        description: "Keep your professional details up to date.",
        icon: "profile",
        link: "/profile",
    },
    {
        title: "My Skills",
        description: "Manage the skills that represent you.",
        icon: "skills",
        link: "/skills",
    },
    {
        title: "Skill Gap Analysis",
        description: "Explore skills to strengthen for your goals.",
        icon: "analytics",
        link: "/skill-gap",
    },
    {
        title: "Interview History",
        description: "Revisit your previous practice sessions.",
        icon: "history",
        link: "/interview-history",
    },
];

const roadmap = [
    { step: "01", title: "Build your profile", detail: "Tell employers about yourself.", link: "/profile" },
    { step: "02", title: "Polish your resume", detail: "Make your experience stand out.", link: "/resume" },
    { step: "03", title: "Strengthen your skills", detail: "Find your next learning opportunity.", link: "/skill-gap" },
    { step: "04", title: "Practise interviews", detail: "Prepare for your next conversation.", link: "/ai-interview" },
];

function CareerIllustration() {
    return (
        <div className="career-art" aria-hidden="true">
            <div className="career-art-orbit career-art-orbit-one" />
            <div className="career-art-orbit career-art-orbit-two" />
            <div className="career-art-sun" />
            <div className="career-art-plant">
                <svg viewBox="0 0 250 280" fill="none">
                    <path d="M125 265C125 205 118 151 125 85" stroke="#DDE5D1" strokeWidth="3" strokeLinecap="round" />
                    <path d="M124 190C80 176 56 145 58 111C96 112 124 142 124 190Z" fill="#AFC1A1" />
                    <path d="M126 151C163 132 182 100 176 69C143 76 124 107 126 151Z" fill="#D7DFC9" />
                    <path d="M124 113C91 96 81 69 91 43C119 54 132 79 124 113Z" fill="#8FA585" />
                    <path d="M126 225C163 212 185 187 186 158C155 160 130 187 126 225Z" fill="#B9C9AD" />
                    <path d="M124 190L58 111M126 151L176 69M124 113L91 43M126 225L186 158" stroke="#71866B" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M90 267H160" stroke="#DDE5D1" strokeWidth="3" strokeLinecap="round" />
                </svg>
            </div>
            <div className="career-art-note">
                <span className="career-art-note-icon"><DashboardIcon name="spark" /></span>
                <span>
                    <strong>Your next chapter</strong>
                    <small>Starts with one step</small>
                </span>
            </div>
            <div className="career-art-stamp"><DashboardIcon name="leaf" /></div>
        </div>
    );
}

function Dashboard() {
    return (
        <main className="dashboard-page">
            <section className="dashboard-hero">
                <div className="dashboard-hero-content">
                    <span className="dashboard-kicker">
                        <span className="kicker-line" />
                        YOUR CAREER, YOUR JOURNEY
                    </span>

                    <h1>
                        Make room for
                        <em> what’s next.</em>
                    </h1>

                    <p>
                        Every great career begins with a step forward.
                        Find opportunities, build your skills, and bring
                        your ambitions to life.
                    </p>

                    <div className="dashboard-hero-actions">
                        <Link to="/jobs" className="dashboard-primary-button">
                            Explore jobs
                            <DashboardIcon name="arrow" />
                        </Link>
                        <Link to="/profile" className="dashboard-secondary-link">
                            View my profile
                        </Link>
                    </div>
                </div>

                <CareerIllustration />

                <div className="dashboard-hero-bottom">
                    <span>GROW WITH PURPOSE</span>
                    <span className="hero-bottom-divider" />
                    <span>MOVE WITH CONFIDENCE</span>
                </div>
            </section>

            <section className="dashboard-section dashboard-overview-section">
                <div className="dashboard-section-heading">
                    <div>
                        <span className="dashboard-eyebrow">YOUR CAREER TOOLKIT</span>
                        <h2>Where would you like to begin?</h2>
                        <p>Everything you need to move your career forward, in one place.</p>
                    </div>
                    <span className="dashboard-heading-aside">01 / EXPLORE</span>
                </div>

                <div className="dashboard-overview-grid">
                    {overviewCards.map((card) => (
                        <article className={`dashboard-feature-card tone-${card.tone}`} key={card.title}>
                            <div className="feature-card-top">
                                <span className="feature-card-number">{card.number}</span>
                                <span className="feature-card-icon">
                                    <DashboardIcon name={card.icon} />
                                </span>
                            </div>

                            <div className="feature-card-content">
                                <h3>{card.title}</h3>
                                <p>{card.description}</p>
                            </div>

                            <Link to={card.link} className="feature-card-link">
                                {card.button}
                                <DashboardIcon name="arrow" />
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dashboard-lower-grid">
                <div className="dashboard-roadmap-panel">
                    <div className="dashboard-section-heading roadmap-heading">
                        <div>
                            <span className="dashboard-eyebrow">A LITTLE DIRECTION</span>
                            <h2>Your career roadmap</h2>
                            <p>Four useful places to focus your energy.</p>
                        </div>
                        <span className="dashboard-heading-aside">02 / BUILD</span>
                    </div>

                    <div className="dashboard-roadmap-list">
                        {roadmap.map((item, index) => (
                            <Link to={item.link} className="roadmap-item" key={item.step}>
                                <span className="roadmap-step">{item.step}</span>
                                <span className="roadmap-copy">
                                    <strong>{item.title}</strong>
                                    <small>{item.detail}</small>
                                </span>
                                <span className="roadmap-arrow">
                                    <DashboardIcon name="arrow" />
                                </span>
                                {index !== roadmap.length - 1 && <span className="roadmap-connector" />}
                            </Link>
                        ))}
                    </div>
                </div>

                <aside className="dashboard-spotlight">
                    <div className="spotlight-decoration spotlight-decoration-one" />
                    <div className="spotlight-decoration spotlight-decoration-two" />

                    <span className="spotlight-icon">
                        <DashboardIcon name="target" />
                    </span>

                    <span className="spotlight-kicker">A GOOD PLACE TO START</span>
                    <h2>Your next opportunity deserves your best profile.</h2>
                    <p>
                        Make sure your education, experience, and skills tell
                        the story of what you can bring to your next role.
                    </p>

                    <Link to="/education" className="spotlight-button">
                        Complete your profile
                        <DashboardIcon name="arrow" />
                    </Link>

                    <span className="spotlight-footer">SMALL STEPS. MEANINGFUL PROGRESS.</span>
                </aside>
            </section>

            <section className="dashboard-development-section">
                <div className="dashboard-section-heading">
                    <div>
                        <span className="dashboard-eyebrow">KEEP MOVING FORWARD</span>
                        <h2>Your career development</h2>
                        <p>Jump back into the areas that help you grow.</p>
                    </div>
                    <span className="dashboard-heading-aside">03 / GROW</span>
                </div>

                <div className="dashboard-actions-grid">
                    {careerActions.map((action) => (
                        <Link to={action.link} className="dashboard-action-card" key={action.title}>
                            <span className="dashboard-action-icon">
                                <DashboardIcon name={action.icon} />
                            </span>
                            <span className="dashboard-action-copy">
                                <strong>{action.title}</strong>
                                <small>{action.description}</small>
                            </span>
                            <DashboardIcon name="arrow" className="dashboard-action-arrow" />
                        </Link>
                    ))}
                </div>
            </section>

            <footer className="dashboard-footer">
                <span className="footer-brand"><DashboardIcon name="leaf" /> NEXORA.</span>
                <span>Build your future, one step at a time.</span>
            </footer>
        </main>
    );
}

export default Dashboard;
