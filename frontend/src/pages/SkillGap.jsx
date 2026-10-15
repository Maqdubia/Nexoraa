
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResumes, createSkillGap } from "../services/api";
import "./SkillGap.css";

const JOB_MATCHES_URL = "http://127.0.0.1:8000/api/jobs/matches/";
const RECOMMENDATIONS_URL =
    "http://127.0.0.1:8000/api/jobs/recommendations/";

function SkillGap() {
    const navigate = useNavigate();

    // Resume-based skill gap state
    const [resumes, setResumes] = useState([]);
    const [resumeId, setResumeId] = useState("");
    const [requiredSkills, setRequiredSkills] = useState("");
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Job matching state
    const [jobMatches, setJobMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesError, setMatchesError] = useState("");

    // Improvement recommendations state
    const [improvements, setImprovements] = useState([]);
    const [improvementsLoading, setImprovementsLoading] = useState(false);
    const [improvementsError, setImprovementsError] = useState("");

    // Get a useful error message from an API response
    const getErrorMessage = (data, fallback) => {
        if (typeof data?.detail === "string") {
            return data.detail;
        }

        if (typeof data?.message === "string") {
            return data.message;
        }

        if (data && typeof data === "object") {
            const firstKey = Object.keys(data)[0];
            const firstValue = data[firstKey];

            if (Array.isArray(firstValue) && firstValue.length > 0) {
                return String(firstValue[0]);
            }

            if (typeof firstValue === "string") {
                return firstValue;
            }
        }

        return fallback;
    };

    // Load resumes belonging to the logged-in user
    const loadResumes = async () => {
        try {
            const data = await getResumes();

            const resumeList = Array.isArray(data)
                ? data
                : Array.isArray(data?.results)
                    ? data.results
                    : [];

            setResumes(resumeList);
        } catch (error) {
            console.error("Resume loading error:", error);
            setMessage("Unable to load your resumes. Please try again.");
        }
    };

    // Load personalized job matches
    const loadJobMatches = async () => {
        setMatchesLoading(true);
        setMatchesError("");

        try {
            const token = localStorage.getItem("access_token")

            console.log(
                "Nexora access token exists:",
                Boolean(token)
            );

            if (!token) {
                setJobMatches([]);
                setMatchesError(
                    "No access token found. Please log in again, then reopen Skill Gap Analysis."
                );
                return;
            }

            const response = await fetch(JOB_MATCHES_URL, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                console.error("Job matches API response:", data);

                if (response.status === 401) {
                    setJobMatches([]);
                    setMatchesError(
                        "Your login session has expired or the token is invalid. Please log in again."
                    );
                    return;
                }

                if (response.status === 403) {
                    throw new Error(
                        "You do not have permission to view job matches."
                    );
                }

                throw new Error(
                    getErrorMessage(
                        data,
                        `Unable to load job matches (HTTP ${response.status}).`
                    )
                );
            }

            const matches = Array.isArray(data)
                ? data
                : Array.isArray(data?.results)
                    ? data.results
                    : Array.isArray(data?.jobs)
                        ? data.jobs
                        : Array.isArray(data?.matches)
                            ? data.matches
                            : [];

            matches.sort(
                (a, b) =>
                    (Number(b.match_percentage) || 0) -
                    (Number(a.match_percentage) || 0)
            );

            setJobMatches(matches);
        } catch (error) {
            console.error("Job matching error:", error);
            setJobMatches([]);
            setMatchesError(
                error.message || "Unable to load job matches."
            );
        } finally {
            setMatchesLoading(false);
        }
    };

    // Generate improvement recommendations
    const loadImprovements = async (missingSkills) => {
        setImprovements([]);
        setImprovementsError("");

        if (
            !Array.isArray(missingSkills) ||
            missingSkills.length === 0
        ) {
            return;
        }

        const token = localStorage.getItem("access");

        if (!token) {
            setImprovementsError(
                "Please log in to get improvement recommendations."
            );
            return;
        }

        try {
            setImprovementsLoading(true);

            const response = await fetch(RECOMMENDATIONS_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    missing_skills: missingSkills,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Your login session has expired. Please log in again."
                    );
                }

                throw new Error(
                    getErrorMessage(
                        data,
                        `Unable to load recommendations (HTTP ${response.status}).`
                    )
                );
            }

            setImprovements(
                Array.isArray(data?.recommendations)
                    ? data.recommendations
                    : []
            );
        } catch (error) {
            console.error(
                "Improvement recommendations error:",
                error
            );

            setImprovementsError(
                error.message ||
                    "Unable to load recommendations."
            );
        } finally {
            setImprovementsLoading(false);
        }
    };

    // Load page data when the page opens
    useEffect(() => {
        loadResumes();
        loadJobMatches();
    }, []);

    // Analyze required skills against the selected resume
    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setResult(null);
        setImprovements([]);
        setImprovementsError("");

        if (!resumeId) {
            setMessage("Please select a resume.");
            return;
        }

        if (!requiredSkills.trim()) {
            setMessage("Please enter the required job skills.");
            return;
        }

        try {
            setLoading(true);

            const skillsArray = [
                ...new Set(
                    requiredSkills
                        .split(",")
                        .map((skill) => skill.trim())
                        .filter(Boolean)
                ),
            ];

            const data = await createSkillGap({
                resume: Number(resumeId),
                required_skills: skillsArray,
            });

            setResult(data);

            await loadImprovements(
                Array.isArray(data?.missing_skills)
                    ? data.missing_skills
                    : []
            );
        } catch (error) {
            console.error("Skill gap analysis error:", error);

            setMessage(
                error.response?.data?.detail ||
                    error.message ||
                    "Unable to calculate skill gap. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const userSkills = Array.isArray(result?.user_skills)
        ? result.user_skills
        : [];

    const missingSkills = Array.isArray(result?.missing_skills)
        ? result.missing_skills
        : [];

    const resultRequiredSkills = Array.isArray(
        result?.required_skills
    )
        ? result.required_skills
        : [];

    return (
        <div className="skill-gap-page">
            <div className="skill-gap-container">

                {/* PAGE HEADER */}
                <header className="skill-gap-header">
                    <span className="skill-gap-eyebrow">
                        NEXORA CAREER PLATFORM
                    </span>

                    <h1>Skill Gap Analysis</h1>

                    <p>
                        Understand your skills, discover job
                        opportunities, and identify what you need
                        to learn next.
                    </p>
                </header>

                {/* SKILL GAP FORM */}
                <section className="skill-gap-form-card">
                    <h2>Analyze Your Skill Gap</h2>

                    <p className="section-description">
                        Select a resume and enter the skills required
                        for your target job.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="skill-gap-input">
                            <label htmlFor="resume-select">
                                Select Resume
                            </label>

                            <select
                                id="resume-select"
                                value={resumeId}
                                onChange={(e) =>
                                    setResumeId(e.target.value)
                                }
                            >
                                <option value="">
                                    Select your resume
                                </option>

                                {resumes.map((resume) => (
                                    <option
                                        key={resume.id}
                                        value={resume.id}
                                    >
                                        {resume.title ||
                                            `Resume ${resume.id}`}
                                    </option>
                                ))}
                            </select>

                            {resumes.length === 0 && (
                                <p className="skill-gap-help">
                                    Upload a resume first if you have
                                    none.
                                </p>
                            )}
                        </div>

                        <div className="skill-gap-input">
                            <label htmlFor="required-skills">
                                Required Job Skills
                            </label>

                            <textarea
                                id="required-skills"
                                placeholder="Example: Python, React, Django, FastAPI, SQL"
                                value={requiredSkills}
                                onChange={(e) =>
                                    setRequiredSkills(e.target.value)
                                }
                                rows={5}
                            />

                            <p className="skill-gap-help">
                                Enter skills separated by commas.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="skill-gap-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Analyzing..."
                                : "Analyze Skill Gap"}
                        </button>
                    </form>
                </section>

                {/* FORM MESSAGES */}
                {message && (
                    <p className="skill-gap-message" role="alert">
                        {message}
                    </p>
                )}

                {/* SKILL GAP RESULTS */}
                {result && (
                    <section className="skill-gap-result">
                        <div className="match-card">
                            <span className="result-label">
                                YOUR SKILL MATCH
                            </span>

                            <div className="match-percentage">
                                {Number(result.match_percentage) || 0}%
                            </div>

                            <div className="match-progress">
                                <div
                                    style={{
                                        width: `${Math.min(
                                            100,
                                            Math.max(
                                                0,
                                                Number(
                                                    result.match_percentage
                                                ) || 0
                                            )
                                        )}%`,
                                    }}
                                />
                            </div>

                            <p>Match with required job skills</p>
                        </div>

                        <div className="skills-result-card">
                            <h2>Your Skills</h2>

                            <div className="skill-tags">
                                {userSkills.length === 0 ? (
                                    <p>No skills found.</p>
                                ) : (
                                    userSkills.map((skill, index) => (
                                        <span
                                            key={`${skill}-${index}`}
                                            className="skill-tag"
                                        >
                                            {skill}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="skills-result-card">
                            <h2>Missing Skills</h2>

                            {missingSkills.length === 0 ? (
                                <p className="no-gap">
                                    You have all the listed required
                                    skills!
                                </p>
                            ) : (
                                <div className="skill-tags">
                                    {missingSkills.map(
                                        (skill, index) => (
                                            <span
                                                key={`${skill}-${index}`}
                                                className="missing-skill-tag"
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="skills-result-card">
                            <h2>Required Skills</h2>

                            <div className="skill-tags">
                                {resultRequiredSkills.map(
                                    (skill, index) => (
                                        <span
                                            key={`${skill}-${index}`}
                                            className="required-skill-tag"
                                        >
                                            {skill}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* RECOMMENDED IMPROVEMENTS */}
                {result && (
                    <section className="improvements-section">
                        <div className="improvements-header">
                            <span className="skill-gap-eyebrow">
                                YOUR LEARNING ROADMAP
                            </span>

                            <h2>Recommended Improvements</h2>

                            <p className="section-description">
                                Practical next steps based on the skills
                                missing from your analysis.
                            </p>
                        </div>

                        {improvementsLoading && (
                            <p className="improvements-empty">
                                Preparing your improvement
                                recommendations...
                            </p>
                        )}

                        {!improvementsLoading &&
                            improvementsError && (
                                <div
                                    className="improvements-error"
                                    role="alert"
                                >
                                    <p>{improvementsError}</p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            loadImprovements(
                                                missingSkills
                                            )
                                        }
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                        {!improvementsLoading &&
                            !improvementsError &&
                            missingSkills.length === 0 && (
                                <div className="improvements-empty">
                                    <h3>Great work!</h3>
                                    <p>
                                        No missing skills were reported.
                                        Keep practicing and building
                                        projects to strengthen your
                                        profile.
                                    </p>
                                </div>
                            )}

                        {!improvementsLoading &&
                            !improvementsError &&
                            missingSkills.length > 0 &&
                            improvements.length === 0 && (
                                <div className="improvements-empty">
                                    <p>
                                        No recommendations were returned.
                                        Please try again.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            loadImprovements(
                                                missingSkills
                                            )
                                        }
                                    >
                                        Load Recommendations
                                    </button>
                                </div>
                            )}

                        {!improvementsLoading &&
                            improvements.length > 0 && (
                                <div className="improvements-grid">
                                    {improvements.map((item, index) => (
                                        <article
                                            className="improvement-card"
                                            key={`${item.skill || "skill"}-${index}`}
                                        >
                                            <div className="improvement-card-top">
                                                <h3>{item.skill}</h3>

                                                {item.priority && (
                                                    <span
                                                        className={`improvement-priority priority-${String(
                                                            item.priority
                                                        ).toLowerCase()}`}
                                                    >
                                                        {item.priority}{" "}
                                                        priority
                                                    </span>
                                                )}
                                            </div>

                                            {item.reason && (
                                                <p className="improvement-reason">
                                                    {item.reason}
                                                </p>
                                            )}

                                            {Array.isArray(item.steps) &&
                                                item.steps.length > 0 && (
                                                    <div className="improvement-steps">
                                                        <h4>What to learn</h4>
                                                        <ol>
                                                            {item.steps.map(
                                                                (
                                                                    step,
                                                                    stepIndex
                                                                ) => (
                                                                    <li
                                                                        key={stepIndex}
                                                                    >
                                                                        {step}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ol>
                                                    </div>
                                                )}

                                            {item.project && (
                                                <div className="improvement-project">
                                                    <h4>Practice project</h4>
                                                    <strong>
                                                        {item.project}
                                                    </strong>

                                                    {item.project_description && (
                                                        <p>
                                                            {item.project_description}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {(item.resource ||
                                                item.url) && (
                                                <div className="improvement-resource">
                                                    <h4>Learning resource</h4>

                                                    {item.resource && (
                                                        <p>
                                                            {item.resource}
                                                        </p>
                                                    )}

                                                    {item.url && (
                                                        <a
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Open learning
                                                            resource →
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}
                    </section>
                )}

                {/* RECOMMENDED JOBS */}
                <section className="job-matches-section">
                    <div className="job-matches-header">
                        <div>
                            <span className="skill-gap-eyebrow">
                                CAREER OPPORTUNITIES
                            </span>

                            <h2>Recommended Jobs</h2>

                            <p className="section-description">
                                Explore jobs based on your saved profile
                                skills.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="refresh-matches-button"
                            onClick={loadJobMatches}
                            disabled={matchesLoading}
                        >
                            {matchesLoading
                                ? "Loading..."
                                : "↻ Refresh"}
                        </button>
                    </div>

                    {matchesLoading && (
                        <p className="job-matches-message">
                            Finding matching jobs...
                        </p>
                    )}

                    {!matchesLoading && matchesError && (
                        <div className="job-matches-error" role="alert">
                            <p>{matchesError}</p>

                            <button
                                type="button"
                                onClick={loadJobMatches}
                            >
                                Try Again
                            </button>

                            {matchesError.includes("log in") && (
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                >
                                    Go to Login
                                </button>
                            )}
                        </div>
                    )}

                    {!matchesLoading &&
                        !matchesError &&
                        jobMatches.length === 0 && (
                            <div className="job-matches-empty">
                                <h3>No job matches available yet</h3>

                                <p>
                                    Add skills to your profile and make
                                    sure jobs are available in Nexora.
                                </p>

                                <button
                                    type="button"
                                    className="job-match-view-button"
                                    onClick={() => navigate("/skills")}
                                >
                                    Update My Skills
                                </button>
                            </div>
                        )}

                    {!matchesLoading &&
                        !matchesError &&
                        jobMatches.length > 0 && (
                            <>
                                <p className="job-match-count">
                                    {jobMatches.length} jobs analyzed
                                </p>

                                <div className="job-matches-grid">
                                    {jobMatches.map((job) => {
                                        const matched = Array.isArray(
                                            job.matched_skills
                                        )
                                            ? job.matched_skills
                                            : [];

                                        const missing = Array.isArray(
                                            job.missing_skills
                                        )
                                            ? job.missing_skills
                                            : [];

                                        const percentage = Math.min(
                                            100,
                                            Math.max(
                                                0,
                                                Number(
                                                    job.match_percentage
                                                ) || 0
                                            )
                                        );

                                        return (
                                            <article
                                                className="job-match-card"
                                                key={job.id}
                                            >
                                                <div className="job-match-card-top">
                                                    <div className="job-company-avatar">
                                                        {job.company
                                                            ?.charAt(0)
                                                            .toUpperCase() ||
                                                            "J"}
                                                    </div>

                                                    <span className="job-match-badge">
                                                        {percentage}% match
                                                    </span>
                                                </div>

                                                <h3>{job.title}</h3>

                                                <p className="job-match-company">
                                                    {job.company}
                                                </p>

                                                <div className="job-match-meta">
                                                    <span>
                                                        📍{" "}
                                                        {job.location ||
                                                            "Not specified"}
                                                    </span>

                                                    {job.salary && (
                                                        <span>
                                                            ₹ {job.salary}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="job-match-progress">
                                                    <div
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    />
                                                </div>

                                                <div className="job-match-skills">
                                                    <h4>
                                                        Matching Skills (
                                                        {matched.length})
                                                    </h4>

                                                    <div className="skill-tags">
                                                        {matched.length > 0 ? (
                                                            matched.map(
                                                                (skill) => (
                                                                    <span
                                                                        className="skill-tag"
                                                                        key={skill}
                                                                    >
                                                                        {skill}
                                                                    </span>
                                                                )
                                                            )
                                                        ) : (
                                                            <p className="empty-skills">
                                                                No matching
                                                                skills yet.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="job-match-skills">
                                                    <h4>
                                                        Skills to Learn (
                                                        {missing.length})
                                                    </h4>

                                                    <div className="skill-tags">
                                                        {missing.length > 0 ? (
                                                            missing.map(
                                                                (skill) => (
                                                                    <span
                                                                        className="missing-skill-tag"
                                                                        key={skill}
                                                                    >
                                                                        {skill}
                                                                    </span>
                                                                )
                                                            )
                                                        ) : (
                                                            <p className="no-gap">
                                                                All listed
                                                                skills matched!
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="job-match-view-button"
                                                    onClick={() =>
                                                        navigate("/jobs")
                                                    }
                                                >
                                                    Explore Jobs →
                                                </button>
                                            </article>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                </section>
            </div>
        </div>
    );
}

export default SkillGap;