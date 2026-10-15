

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getResumeAnalysis } from "../services/api";

import "./ResumeAnalysis.css";

function ResumeAnalysis() {
    const { id } = useParams();

    const [analysis, setAnalysis] = useState(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadAnalysis();
    }, [id]);

    const loadAnalysis = async () => {
        try {
            const data = await getResumeAnalysis(id);
            setAnalysis(data);
        } catch (error) {
            console.log(error);
            setMessage("Unable to load resume analysis.");
        }
    };

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
                    <p className="analysis-loading">
                        Loading analysis...
                    </p>
                </div>
            </div>
        );
    }

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
                        {analysis.score}
                        <span>/100</span>
                    </div>

                    <p>
                        Based on the information detected
                        in your resume.
                    </p>
                </div>

                {/* Resume Information */}
                <div className="analysis-grid">

                    {/* Contact Information */}
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

                    {/* Resume Details */}
                    <div className="analysis-card">

                        <h2>Resume Details</h2>

                        <div className="analysis-item">
                            <strong>Text Length</strong>

                            <span>
                                {analysis.text_length || 0} characters
                            </span>
                        </div>

                        <div className="analysis-item">
                            <strong>Skills Found</strong>

                            <span>
                                {analysis.skills?.length || 0}
                            </span>
                        </div>

                    </div>

                </div>

                {/* Skills */}
                <div className="analysis-card skills-analysis">

                    <h2>Skills Detected</h2>

                    {!analysis.skills ||
                    analysis.skills.length === 0 ? (

                        <p>
                            No supported skills detected.
                        </p>

                    ) : (

                        <div className="skill-tags">

                            {analysis.skills.map(
                                (skill, index) => (
                                    <span
                                        key={index}
                                        className="skill-tag"
                                    >
                                        {skill}
                                    </span>
                                )
                            )}

                        </div>

                    )}

                </div>

            </div>
        </div>
    );
}

export default ResumeAnalysis;