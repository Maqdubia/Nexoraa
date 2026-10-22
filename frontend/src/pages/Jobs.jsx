
import { useEffect, useState } from "react";
import "./Jobs.css";

const API_URL = "/api/jobs/";

function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);

    const [applyingJobId, setApplyingJobId] = useState(null);
    const [applyMessage, setApplyMessage] = useState("");
    const [applyError, setApplyError] = useState(false);

    // Fetch jobs from Django
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}?search=${encodeURIComponent(search)}`
                );

                if (!response.ok) {
                    throw new Error("Unable to load jobs.");
                }

                const data = await response.json();

                setJobs(
                    Array.isArray(data)
                        ? data
                        : data.results || []
                );
            } catch (err) {
                setError(
                    "Could not load jobs. Please check whether the Django server is running."
                );
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchJobs, 300);

        return () => clearTimeout(timer);
    }, [search]);

    // Save application in Nexora, then open the employer's website
    const handleApply = async (job) => {
        const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");

        if (!token) {
            setApplyError(true);
            setApplyMessage("Please log in before applying.");
            return;
        }

        try {
            setApplyingJobId(job.id);
            setApplyMessage("");
            setApplyError(false);

            const response = await fetch(
                `${API_URL}apply/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        job: job.id,
                        cover_letter: "",
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                let message =
                    data.detail ||
                    data.job?.[0] ||
                    "Could not save your application.";

                if (response.status === 401) {
                    message = "Your login session may have expired. Please log in again.";
                }

                throw new Error(message);
            }

            setApplyMessage(
                "Your application has been recorded in Nexora. Continue to the employer's website to complete the application."
            );

            if (job.application_url) {
                window.open(
                    job.application_url,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        } catch (err) {
            setApplyError(true);
            setApplyMessage(err.message);
        } finally {
            setApplyingJobId(null);
        }
    };

    return (
        <div className="jobs-page">
            <div className="jobs-header">
                <div>
                    <p className="jobs-eyebrow">
                        NEXORA CAREER PLATFORM
                    </p>

                    <h1>Explore Jobs</h1>

                    <p className="jobs-subtitle">
                        Find opportunities that match your skills
                        and career goals.
                    </p>
                </div>
            </div>

            <div className="jobs-search">
                <span>⌕</span>

                <input
                    type="text"
                    placeholder="Search by job title, company, or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="jobs-results-heading">
                <h2>Available Opportunities</h2>

                {!loading && (
                    <span>{jobs.length} jobs found</span>
                )}
            </div>

            {loading && (
                <p className="jobs-message">Loading jobs...</p>
            )}

            {error && (
                <p className="jobs-error">{error}</p>
            )}

            {!loading && !error && jobs.length === 0 && (
                <div className="jobs-empty">
                    <h3>No jobs found</h3>
                    <p>
                        Try another keyword or add jobs to your database.
                    </p>
                </div>
            )}

            <div className="jobs-grid">
                {jobs.map((job) => (
                    <article className="job-card" key={job.id}>
                        <div className="job-card-top">
                            <div className="job-company-icon">
                                {job.company?.charAt(0)?.toUpperCase() || "J"}
                            </div>

                            <span className="job-type">
                                {job.job_type || "Full Time"}
                            </span>
                        </div>

                        <h3>{job.title}</h3>

                        <p className="job-company">
                            {job.company}
                        </p>

                        <div className="job-meta">
                            <span>
                                📍 {job.location || "Location not specified"}
                            </span>

                            {job.salary && (
                                <span>💰 {job.salary}</span>
                            )}

                            {job.experience && (
                                <span>
                                    Experience: {job.experience}
                                </span>
                            )}
                        </div>

                        <p className="job-description">
                            {job.description?.length > 140
                                ? `${job.description.slice(0, 140)}...`
                                : job.description}
                        </p>

                        <div className="job-skills">
                            {(Array.isArray(job.required_skills)
                                ? job.required_skills
                                : []
                            ).map((skill, index) => (
                                <span key={`${job.id}-${index}`}>
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="job-details-button"
                            onClick={() => {
                                setSelectedJob(job);
                                setApplyMessage("");
                                setApplyError(false);
                            }}
                        >
                            View Details →
                        </button>
                    </article>
                ))}
            </div>

            {selectedJob && (
                <div
                    className="job-modal-overlay"
                    onClick={() => setSelectedJob(null)}
                >
                    <div
                        className="job-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="job-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="job-modal-close"
                            onClick={() => setSelectedJob(null)}
                            aria-label="Close job details"
                        >
                            ×
                        </button>

                        <h2 id="job-modal-title">
                            {selectedJob.title}
                        </h2>

                        <p className="job-company">
                            {selectedJob.company} · {selectedJob.location}
                        </p>

                        {selectedJob.salary && (
                            <p>
                                <strong>Salary:</strong>{" "}
                                {selectedJob.salary}
                            </p>
                        )}

                        <p>
                            <strong>Job type:</strong>{" "}
                            {selectedJob.job_type || "Not specified"}
                        </p>

                        {selectedJob.experience && (
                            <p>
                                <strong>Experience:</strong>{" "}
                                {selectedJob.experience}
                            </p>
                        )}

                        <h3>Job Description</h3>

                        <p className="job-full-description">
                            {selectedJob.description || "No description available."}
                        </p>

                        <h3>Required Skills</h3>

                        <div className="job-skills">
                            {(Array.isArray(selectedJob.required_skills)
                                ? selectedJob.required_skills
                                : []
                            ).map((skill, index) => (
                                <span key={`${selectedJob.id}-${index}`}>
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="job-details-button job-apply-link"
                            onClick={() => handleApply(selectedJob)}
                            disabled={applyingJobId === selectedJob.id}
                        >
                            {applyingJobId === selectedJob.id
                                ? "Saving application..."
                                : "Apply on company website →"}
                        </button>

                        {applyMessage && (
                            <p
                                role="status"
                                className={
                                    applyError
                                        ? "jobs-error"
                                        : "jobs-message"
                                }
                            >
                                {applyMessage}
                            </p>
                        )}

                        {!selectedJob.application_url && (
                            <p className="jobs-message">
                                No external application link is available
                                for this job.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Jobs;