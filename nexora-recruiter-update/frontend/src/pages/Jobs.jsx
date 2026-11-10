
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
    const [appliedIds, setAppliedIds] = useState(() => new Set());

    // Fetch jobs from Django
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                setError("");

                const listUrl = `${API_URL}?search=${encodeURIComponent(search)}`;
                const savedToken = localStorage.getItem("access_token");

                // Send the login token so we know which jobs were already
                // applied for. If the token has expired, load the list anyway.
                let response = await fetch(
                    listUrl,
                    savedToken
                        ? { headers: { Authorization: `Bearer ${savedToken}` } }
                        : undefined
                );

                if (response.status === 401) {
                    response = await fetch(listUrl);
                }

                if (!response.ok) {
                    throw new Error("Unable to load jobs.");
                }

                const data = await response.json();

                const list = Array.isArray(data)
                    ? data
                    : data.results || [];

                setJobs(list);
                setAppliedIds(
                    new Set(
                        list
                            .filter((item) => item.already_applied)
                            .map((item) => item.id)
                    )
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

            setAppliedIds((current) => new Set(current).add(job.id));
            setApplyMessage(
                "Application submitted. The recruiter can now see your profile, skills and resume score. You can track it in My Applications."
            );
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
                                {appliedIds.has(job.id)
                                    ? "Applied ✓"
                                    : job.job_type || "Full Time"}
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

                        <div className="job-facts">
                            <div>
                                <span>Job type</span>
                                <strong>{selectedJob.job_type || "Not specified"}</strong>
                            </div>
                            {selectedJob.work_mode && (
                                <div>
                                    <span>Work mode</span>
                                    <strong>{selectedJob.work_mode}</strong>
                                </div>
                            )}
                            {selectedJob.experience && (
                                <div>
                                    <span>Experience</span>
                                    <strong>{selectedJob.experience}</strong>
                                </div>
                            )}
                            {selectedJob.salary && (
                                <div>
                                    <span>Salary</span>
                                    <strong>{selectedJob.salary}</strong>
                                </div>
                            )}
                            {selectedJob.vacancies > 0 && (
                                <div>
                                    <span>Openings</span>
                                    <strong>{selectedJob.vacancies}</strong>
                                </div>
                            )}
                            {selectedJob.application_deadline && (
                                <div>
                                    <span>Apply by</span>
                                    <strong>
                                        {new Date(
                                            selectedJob.application_deadline
                                        ).toLocaleDateString()}
                                    </strong>
                                </div>
                            )}
                        </div>

                        <h3>About the role</h3>

                        <p className="job-full-description">
                            {selectedJob.description || "No description available."}
                        </p>

                        {selectedJob.responsibilities && (
                            <>
                                <h3>Responsibilities</h3>
                                <p className="job-full-description">
                                    {selectedJob.responsibilities}
                                </p>
                            </>
                        )}

                        {selectedJob.requirements && (
                            <>
                                <h3>Requirements</h3>
                                <p className="job-full-description">
                                    {selectedJob.requirements}
                                </p>
                            </>
                        )}

                        <h3>Required skills</h3>

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

                        {selectedJob.benefits && (
                            <>
                                <h3>Benefits</h3>
                                <p className="job-full-description">
                                    {selectedJob.benefits}
                                </p>
                            </>
                        )}

                        <div className="job-apply-bar">
                            {appliedIds.has(selectedJob.id) ? (
                                <button
                                    type="button"
                                    className="job-details-button job-apply-link"
                                    disabled
                                >
                                    Applied ✓
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="job-details-button job-apply-link"
                                    onClick={() => handleApply(selectedJob)}
                                    disabled={applyingJobId === selectedJob.id}
                                >
                                    {applyingJobId === selectedJob.id
                                        ? "Submitting..."
                                        : "Apply now"}
                                </button>
                            )}

                            {selectedJob.application_url && (
                                <a
                                    className="job-secondary-link"
                                    href={selectedJob.application_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Company website ↗
                                </a>
                            )}
                        </div>

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
                    </div>
                </div>
            )}
        </div>
    );
}

export default Jobs;