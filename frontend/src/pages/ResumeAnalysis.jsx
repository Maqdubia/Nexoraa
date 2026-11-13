
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getResumeAnalysis } from "../services/api";
import "./ResumeAnalysis.css";

function DataDisplay({ value }) {
    if (value === null || value === undefined || value === "") {
        return <span>Not available</span>;
    }

    if (typeof value === "boolean") {
        return <span>{value ? "Yes" : "No"}</span>;
    }

    if (typeof value === "string" || typeof value === "number") {
        return <span>{String(value)}</span>;
    }

    if (Array.isArray(value)) {
        if (!value.length) return <span>No information available.</span>;

        return (
            <ul>
                {value.map((item, index) => (
                    <li key={index}>
                        <DataDisplay value={item} />
                    </li>
                ))}
            </ul>
        );
    }

    if (typeof value === "object") {
        const entries = Object.entries(value);

        if (!entries.length) return <span>No information available.</span>;

        return (
            <div className="analysis-object">
                {entries.map(([key, item]) => (
                    <div className="analysis-item" key={key}>
                        <strong>{key.replace(/_/g, " ")}</strong>
                        <DataDisplay value={item} />
                    </div>
                ))}
            </div>
        );
    }

    return <span>Not available</span>;
}

function ScoreVisual({ score }) {
    const numericScore = Number(score);
    const safeScore = Number.isFinite(numericScore)
        ? Math.min(100, Math.max(0, numericScore))
        : 0;

    const circumference = 2 * Math.PI * 48;
    const offset = circumference - (safeScore / 100) * circumference;

    return (
        <div className="score-visual" aria-label={`Resume score: ${safeScore} out of 100`}>
            <svg viewBox="0 0 112 112" role="img">
                <circle
                    className="score-track"
                    cx="56"
                    cy="56"
                    r="48"
                />
                <circle
                    className="score-progress"
                    cx="56"
                    cy="56"
                    r="48"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>

            <div className="score-visual-value">
                <strong>{safeScore}</strong>
                <span>/100</span>
            </div>
        </div>
    );
}

function SectionCard({ title, children }) {
    return (
        <section className="analysis-card">
            <h2>{title}</h2>
            {children}
        </section>
    );
}

function ResumeAnalysis() {
    const { id } = useParams();

    const [analysis, setAnalysis] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const loadAnalysis = async () => {
            setLoading(true);
            setMessage("");

            try {
                const data = await getResumeAnalysis(id);

                if (active) setAnalysis(data);
            } catch (error) {
                console.error("Resume analysis error:", error);

                if (active) {
                    setMessage(
                        "We couldn't load this analysis. Please try again."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        if (id) {
            loadAnalysis();
        } else {
            setMessage("Resume ID is missing.");
            setLoading(false);
        }

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return (
            <div className="analysis-page">
                <div className="analysis-container">
                    <div className="analysis-loading">
                        <div className="loading-spinner" />
                        <h2>Preparing your insights</h2>
                        <p>Loading your resume analysis...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (message || !analysis) {
        return (
            <div className="analysis-page">
                <div className="analysis-container">
                    <div className="analysis-error">
                        <h2>Analysis unavailable</h2>
                        <p>{message || "No analysis data was found."}</p>
                        <Link to="/resume" className="analysis-back-link">
                            Back to my resumes
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const skills = Array.isArray(analysis.skills)
        ? analysis.skills
        : [];

    const recommendations = Array.isArray(analysis.recommendations)
        ? analysis.recommendations
        : [];

    const score = Number(analysis.score);
    const safeScore = Number.isFinite(score)
        ? Math.min(100, Math.max(0, score))
        : 0;

    return (
        <div className="analysis-page">
            <div className="analysis-container">

                <div className="analysis-topbar">
                    <Link to="/resume" className="analysis-back-link">
                        ← My Resumes
                    </Link>
                    <span className="analysis-label">NEXORA INSIGHTS</span>
                </div>

                <header className="analysis-header">
                    <div>
                        <span className="analysis-eyebrow">
                            YOUR CAREER DOCUMENT
                        </span>
                        <h1>Resume Insights</h1>
                        <p>
                            Understand your resume, identify strengths,
                            and discover where you can improve.
                        </p>
                    </div>
                </header>

                <section className="score-card">
                    <div className="score-card-copy">
                        <span className="analysis-eyebrow">
                            YOUR RESUME OVERVIEW
                        </span>
                        <h2>Your career story, at a glance.</h2>
                        <p>
                            Your score and the information extracted
                            from your uploaded resume are summarized here.
                        </p>

                        <div className="score-facts">
                            <div>
                                <strong>{skills.length}</strong>
                                <span>Skills detected</span>
                            </div>
                            <div>
                                <strong>
                                    {analysis.text_length ?? 0}
                                </strong>
                                <span>Characters extracted</span>
                            </div>
                        </div>
                    </div>

                    <div className="score-card-result">
                        <ScoreVisual score={safeScore} />
                        <div>
                            <strong>Resume score</strong>
                            <span>Based on the current analysis</span>
                        </div>
                    </div>
                </section>

                <div className="analysis-section-heading">
                    <div>
                        <span className="analysis-eyebrow">THE DETAILS</span>
                        <h2>What we found</h2>
                    </div>
                </div>

                <div className="analysis-grid">
                    <SectionCard title="Contact information">
                        <div className="analysis-item">
                            <strong>Email address</strong>
                            <span>{analysis.email || "Not found"}</span>
                        </div>
                        <div className="analysis-item">
                            <strong>Phone number</strong>
                            <span>{analysis.phone || "Not found"}</span>
                        </div>
                    </SectionCard>

                    <SectionCard title="Resume details">
                        <div className="analysis-item">
                            <strong>Text extracted</strong>
                            <span>
                                {analysis.text_length ?? 0} characters
                            </span>
                        </div>
                        <div className="analysis-item">
                            <strong>Skills detected</strong>
                            <span>{skills.length}</span>
                        </div>
                        <div className="analysis-item">
                            <strong>Last analyzed</strong>
                            <span>
                                {analysis.analyzed_at
                                    ? new Date(
                                        analysis.analyzed_at
                                    ).toLocaleString()
                                    : "Not available"}
                            </span>
                        </div>
                    </SectionCard>
                </div>

                <SectionCard title="Your detected skills">
                    {skills.length ? (
                        <div className="skill-tags">
                            {skills.map((skill, index) => (
                                <span
                                    className="skill-tag"
                                    key={`${skill}-${index}`}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p>No supported skills were detected.</p>
                    )}
                </SectionCard>

                <div className="analysis-grid">
                    <SectionCard title="Education">
                        <DataDisplay value={analysis.education} />
                    </SectionCard>

                    <SectionCard title="Certifications">
                        <DataDisplay value={analysis.certifications} />
                    </SectionCard>
                </div>

                <SectionCard title="Resume sections detected">
                    <DataDisplay value={analysis.sections_found} />
                </SectionCard>

                <SectionCard title="Extracted section details">
                    <DataDisplay value={analysis.section_text} />
                </SectionCard>

                <SectionCard title="Score breakdown">
                    <DataDisplay value={analysis.score_details} />
                </SectionCard>

                <SectionCard title="Content analysis">
                    <DataDisplay value={analysis.content_analysis} />
                </SectionCard>

                <SectionCard title="Your improvement roadmap">
                    {recommendations.length ? (
                        <ol className="recommendations-list">
                            {recommendations.map((item, index) => (
                                <li key={index}>
                                    <DataDisplay value={item} />
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p>
                            No recommendations are available for this
                            resume yet.
                        </p>
                    )}
                </SectionCard>

                <div className="analysis-footer">
                    <span>Keep improving. Your next opportunity starts here.</span>
                    <Link to="/resume">Return to resumes →</Link>
                </div>

            </div>
        </div>
    );
}

export default ResumeAnalysis;
