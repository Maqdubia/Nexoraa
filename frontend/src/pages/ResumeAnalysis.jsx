
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getResumeAnalysis } from "../services/api";

import "./ResumeAnalysis.css";

// Display text, arrays, and JSON objects safely
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
        if (value.length === 0) {
            return <span>No information available.</span>;
        }

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

        if (entries.length === 0) {
            return <span>No information available.</span>;
        }

        return (
            <div>
                {entries.map(([key, item]) => (
                    <div className="analysis-item" key={key}>
                        <strong>
                            {key.replace(/_/g, " ")}
                        </strong>
                        <DataDisplay value={item} />
                    </div>
                ))}
            </div>
        );
    }

    return <span>Not available</span>;
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
            setAnalysis(null);

            try {
                const data = await getResumeAnalysis(id);

                if (active) {
                    setAnalysis(data);
                }
            } catch (error) {
                console.error("Resume analysis error:", error);

                if (active) {
                    setMessage(
                        "Unable to load resume analysis. Please check your login and try again."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
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
                    <p className="analysis-loading">
                        Loading analysis...
                    </p>
                </div>
            </div>
        );
    }

    if (message) {
        return (
            <div className="analysis-page">
                <div className="analysis-container">
                    <p className="analysis-error">
                        {message}
                    </p>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="analysis-page">
                <div className="analysis-container">
                    <p className="analysis-error">
                        No analysis data found.
                    </p>
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

    return (
        <div className="analysis-page">
            <div className="analysis-container">

                {/* Header */}
                <div className="analysis-header">
                    <h1>Resume Analysis</h1>
                    <p>
                        Here's what Nexora found in your resume.
                    </p>
                </div>

                {/* Resume Score */}
                <div className="score-card">
                    <h2>Resume Score</h2>

                    <div className="score">
                        {analysis.score ?? 0}
                        <span>/100</span>
                    </div>

                    <p>
                        Based on the information detected
                        in your resume.
                    </p>
                </div>

                {/* Contact and Resume Details */}
                <div className="analysis-grid">

                    <div className="analysis-card">
                        <h2>Contact Information</h2>

                        <div className="analysis-item">
                            <strong>Email</strong>
                            <span>
                                {analysis.email || "Not found"}
                            </span>
                        </div>

                        <div className="analysis-item">
                            <strong>Phone</strong>
                            <span>
                                {analysis.phone || "Not found"}
                            </span>
                        </div>
                    </div>

                    <div className="analysis-card">
                        <h2>Resume Details</h2>

                        <div className="analysis-item">
                            <strong>Text Length</strong>
                            <span>
                                {analysis.text_length ?? 0} characters
                            </span>
                        </div>

                        <div className="analysis-item">
                            <strong>Skills Found</strong>
                            <span>{skills.length}</span>
                        </div>

                        <div className="analysis-item">
                            <strong>Analysis Date</strong>
                            <span>
                                {analysis.analyzed_at
                                    ? new Date(
                                        analysis.analyzed_at
                                    ).toLocaleString()
                                    : "Not available"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div className="analysis-card skills-analysis">
                    <h2>Skills Detected</h2>

                    {skills.length === 0 ? (
                        <p>No supported skills detected.</p>
                    ) : (
                        <div className="skill-tags">
                            {skills.map((skill, index) => (
                                <span
                                    key={`${skill}-${index}`}
                                    className="skill-tag"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Education */}
                <div className="analysis-card">
                    <h2>Education</h2>
                    <DataDisplay value={analysis.education} />
                </div>

                {/* Certifications */}
                <div className="analysis-card">
                    <h2>Certifications</h2>
                    <DataDisplay value={analysis.certifications} />
                </div>

                {/* Sections Found */}
                <div className="analysis-card">
                    <h2>Resume Sections Found</h2>
                    <DataDisplay value={analysis.sections_found} />
                </div>

                {/* Section Text */}
                <div className="analysis-card">
                    <h2>Extracted Section Details</h2>
                    <DataDisplay value={analysis.section_text} />
                </div>

                {/* Score Breakdown */}
                <div className="analysis-card">
                    <h2>Score Breakdown</h2>
                    <DataDisplay value={analysis.score_details} />
                </div>

                {/* Content Analysis */}
                <div className="analysis-card">
                    <h2>Content Analysis</h2>
                    <DataDisplay value={analysis.content_analysis} />
                </div>

                {/* Recommendations */}
                <div className="analysis-card">
                    <h2>Resume Improvement Recommendations</h2>

                    {recommendations.length === 0 ? (
                        <p>
                            No recommendations are available for
                            this resume yet.
                        </p>
                    ) : (
                        <ul className="recommendations-list">
                            {recommendations.map((item, index) => (
                                <li key={index}>
                                    <DataDisplay value={item} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>
        </div>
    );
}

export default ResumeAnalysis;
