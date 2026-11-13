
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getResumeAnalysis } from "../services/api";
import "./ResumeAnalysis.css";

function ScoreVisual({ score }) {
    const value = Number.isFinite(Number(score))
        ? Math.min(100, Math.max(0, Number(score)))
        : 0;

    const circumference = 2 * Math.PI * 48;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="score-visual">
            <svg viewBox="0 0 112 112">
                <circle className="score-track" cx="56" cy="56" r="48" />
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
                <strong>{value}</strong>
                <span>/100</span>
            </div>
        </div>
    );
}

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

function SectionCard({ title, children }) {
    return (
        <section className="analysis-card">
            <h2>{title}</h2>
            {children}
        </section>
    );
}

function DetailPanel({ title, children }) {
    return (
        <details className="analysis-detail-panel">
            <summary>
                <span>{title}</span>
                <span className="detail-toggle">View details</span>
            </summary>
            <div className="analysis-detail-content">{children}</div>
        </details>
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
                    setMessage("We couldn't load this analysis. Please try again.");
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

    const skills = Array.isArray(analysis.skills) ? analysis.skills : [];
    const recommendations = Array.isArray(analysis.recommendations)
        ? analysis.recommendations
        : [];

    const education = Array.isArray(analysis.education)
        ? analysis.education
        : [];

    const certifications = Array.isArray(analysis.certifications)
        ? analysis.certifications
        : [];

    const sections = Array.isArray(analysis.sections_found)
        ? analysis.sections_found
        : [];

    const priorityOrder = { high: 0, medium: 1, low: 2 };

    const sortedRecommendations = [...recommendations].sort(
        (a, b) =>
            (priorityOrder[String(a.priority || "").toLowerCase()] ?? 3) -
            (priorityOrder[String(b.priority || "").toLowerCase()] ?? 3)
    );

    const topRecommendations = sortedRecommendations.slice(0, 3);
    const remainingRecommendations = sortedRecommendations.slice(3);

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
                    <span className="analysis-eyebrow">YOUR CAREER DOCUMENT</span>
                    <h1>Resume Insights</h1>
                    <p>A clear snapshot of your resume strengths and next steps.</p>
                </header>

                <section className="score-card">
                    <div className="score-card-copy">
                        <span className="analysis-eyebrow">YOUR RESUME OVERVIEW</span>
                        <h2>Your career story, at a glance.</h2>
                        <p>
                            Your resume has been reviewed for its content,
                            skills and structure.
                        </p>

                        <div className="score-facts">
                            <div>
                                <strong>{skills.length}</strong>
                                <span>Skills detected</span>
                            </div>
                            <div>
                                <strong>{analysis.text_length ?? 0}</strong>
                                <span>Characters extracted</span>
                            </div>
                            <div>
                                <strong>{sections.length}</strong>
                                <span>Sections found</span>
                            </div>
                        </div>
                    </div>

                    <div className="score-card-result">
                        <ScoreVisual score={analysis.score} />
                        <div>
                            <strong>Resume score</strong>
                            <span>Rule-based checklist score</span>
                        </div>
                    </div>
                </section>

                <div className="analysis-section-heading">
                    <div>
                        <span className="analysis-eyebrow">THE HIGHLIGHTS</span>
                        <h2>What we found</h2>
                    </div>
                </div>

                <div className="analysis-grid">
                    <SectionCard title="Contact information">
                        <div className="analysis-item">
                            <strong>Email</strong>
                            <span>{analysis.email || "Not found"}</span>
                        </div>
                        <div className="analysis-item">
                            <strong>Phone</strong>
                            <span>{analysis.phone || "Not found"}</span>
                        </div>
                    </SectionCard>

                    <SectionCard title="Resume profile">
                        <div className="analysis-item">
                            <strong>Last analyzed</strong>
                            <span>
                                {analysis.analyzed_at
                                    ? new Date(analysis.analyzed_at).toLocaleString()
                                    : "Not available"}
                            </span>
                        </div>
                        <div className="analysis-item">
                            <strong>Document length</strong>
                            <span>{analysis.text_length ?? 0} characters</span>
                        </div>
                    </SectionCard>
                </div>

                <SectionCard title={`Your skills (${skills.length})`}>
                    {skills.length ? (
                        <div className="skill-tags">
                            {skills.map((skill, index) => (
                                <span className="skill-tag" key={`${skill}-${index}`}>
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
                        <DataDisplay value={education} />
                    </SectionCard>

                    <SectionCard title="Certifications">
                        <DataDisplay value={certifications} />
                    </SectionCard>
                </div>

                <SectionCard title="Resume sections">
                    {sections.length ? (
                        <div className="skill-tags">
                            {sections.map((section) => (
                                <span className="skill-tag" key={section}>
                                    {section.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p>No clearly labelled sections were detected.</p>
                    )}
                </SectionCard>

                <SectionCard title="Your improvement roadmap">
                    {topRecommendations.length ? (
                        <ol className="recommendations-list">
                            {topRecommendations.map((item, index) => (
                                <li key={index}>
                                    <DataDisplay value={item} />
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p>No recommendations are available yet.</p>
                    )}

                    {remainingRecommendations.length > 0 && (
                        <DetailPanel
                            title={`${remainingRecommendations.length} more recommendations`}
                        >
                            <ol className="recommendations-list" start={4}>
                                {remainingRecommendations.map((item, index) => (
                                    <li key={index}>
                                        <DataDisplay value={item} />
                                    </li>
                                ))}
                            </ol>
                        </DetailPanel>
                    )}
                </SectionCard>

                <div className="analysis-advanced">
                    <span className="analysis-eyebrow">ADVANCED REPORT</span>
                    <h2>Explore your detailed analysis</h2>
                    <p>
                        Open any section when you want to inspect the
                        information extracted from your document.
                    </p>

                    <DetailPanel title="Extracted section details">
                        <DataDisplay value={analysis.section_text} />
                    </DetailPanel>

                    <DetailPanel title="Score breakdown">
                        <DataDisplay value={analysis.score_details} />
                    </DetailPanel>

                    <DetailPanel title="Content analysis">
                        <DataDisplay value={analysis.content_analysis} />
                    </DetailPanel>
                </div>

                <div className="analysis-footer">
                    <span>Your next opportunity starts with a stronger resume.</span>
                    <Link to="/resume">Return to resumes →</Link>
                </div>

            </div>
        </div>
    );
}

export default ResumeAnalysis;
