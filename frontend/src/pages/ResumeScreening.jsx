import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HRLayout from "../components/HRLayout";
import {
    getRecruiterJobs,
    getResumeScreening,
} from "../services/recruiterApi";
import "./ResumeScreening.css";

const asArray = (value) => Array.isArray(value) ? value : [];

const scoreTone = (score) => {
    if (score >= 75) return "strong";
    if (score >= 50) return "good";
    return "low";
};

const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

function ScoreBar({ label, value }) {
    const safeValue = value === null || value === undefined
        ? null
        : Math.max(0, Math.min(100, Number(value)));

    return (
        <div className="rs-score-row">
            <div className="rs-score-label">
                <span>{label}</span>
                <strong>{safeValue === null ? "N/A" : `${Math.round(safeValue)}%`}</strong>
            </div>
            <div className="rs-progress-track">
                <span style={{ width: `${safeValue ?? 0}%` }} />
            </div>
        </div>
    );
}

function EntityGroup({ title, items, renderItem }) {
    const values = asArray(items);
    if (values.length === 0) return null;

    return (
        <div className="rs-entity-group">
            <h5>{title}</h5>
            <ul>
                {values.map((item, index) => (
                    <li key={`${title}-${index}`}>{renderItem(item)}</li>
                ))}
            </ul>
        </div>
    );
}

function CandidateCard({ candidate }) {
    const score = candidate.score;
    const tone = score === null ? "none" : scoreTone(score);
    const entities = candidate.entities || {};
    const breakdown = candidate.score_breakdown || {};

    return (
        <article className="rs-candidate-card">
            <div className="rs-candidate-main">
                <div className="rs-rank">{candidate.rank}</div>

                <div className="rs-candidate-identity">
                    <div className="rs-candidate-heading">
                        <h3>{candidate.candidate_name}</h3>
                        <span className={`rs-status rs-status-${(candidate.application_status || "applied").toLowerCase()}`}>
                            {candidate.application_status}
                        </span>
                    </div>
                    <p>{candidate.email || "No email on record"}</p>
                    <small>Applied {formatDate(candidate.applied_at)}</small>
                    {candidate.resume_title && (
                        <small className="rs-resume-name">Resume: {candidate.resume_title}</small>
                    )}
                </div>

                <div className={`rs-score-bubble rs-score-${tone}`}>
                    <strong>{score === null ? "—" : score}</strong>
                    <span>{score === null ? "No resume" : "Match score"}</span>
                </div>
            </div>

            {candidate.has_resume ? (
                <>
                    <div className="rs-breakdown">
                        <ScoreBar label="Skill match" value={breakdown.skill_match} />
                        <ScoreBar label="Text similarity" value={breakdown.text_similarity} />
                        <ScoreBar label="JD keyword coverage" value={breakdown.keyword_coverage} />
                    </div>

                    <div className="rs-evidence-grid">
                        <section>
                            <h4>Matched skills</h4>
                            <div className="rs-tags">
                                {asArray(candidate.matched_skills).length ? candidate.matched_skills.map((item) => (
                                    <span className="rs-tag rs-tag-match" key={item}>{item}</span>
                                )) : <span className="rs-muted">No required skills matched yet.</span>}
                            </div>
                        </section>
                        <section>
                            <h4>Skills to verify</h4>
                            <div className="rs-tags">
                                {asArray(candidate.missing_skills).length ? candidate.missing_skills.map((item) => (
                                    <span className="rs-tag rs-tag-missing" key={item}>{item}</span>
                                )) : <span className="rs-muted">No missing required skills.</span>}
                            </div>
                        </section>
                    </div>

                    <details className="rs-details">
                        <summary>View extracted entities and keyword evidence</summary>
                        <div className="rs-details-content">
                            <EntityGroup title="Skills detected" items={entities.skills} renderItem={(item) => item} />
                            <EntityGroup title="Education detected" items={entities.education} renderItem={(item) => {
                                if (typeof item === "string") return item;
                                return [item.degree, item.field_of_study, item.institution, item.start_year].filter(Boolean).join(" · ");
                            }} />
                            <EntityGroup title="Certifications detected" items={entities.certifications} renderItem={(item) => typeof item === "string" ? item : JSON.stringify(item)} />
                            <EntityGroup title="Work history entities" items={entities.work_history} renderItem={(item) => [item.role, item.organization, item.start_date, item.currently_working ? "Present" : item.end_date].filter(Boolean).join(" · ")} />
                            <EntityGroup title="Resume sections found" items={entities.sections_found} renderItem={(item) => item} />

                            <div className="rs-keyword-evidence">
                                <h5>Job-description keywords found</h5>
                                <div className="rs-tags">
                                    {asArray(candidate.matched_keywords).length ? candidate.matched_keywords.map((item) => (
                                        <span className="rs-tag rs-tag-match" key={item}>{item}</span>
                                    )) : <span className="rs-muted">No extracted job keywords matched.</span>}
                                </div>
                                <h5>Job-description keywords not found</h5>
                                <div className="rs-tags">
                                    {asArray(candidate.missing_keywords).length ? candidate.missing_keywords.map((item) => (
                                        <span className="rs-tag rs-tag-missing" key={item}>{item}</span>
                                    )) : <span className="rs-muted">All extracted keywords were found.</span>}
                                </div>
                            </div>
                        </div>
                    </details>

                    <div className="rs-candidate-footer">
                        <span>Resume-based evidence · Review before deciding</span>
                        {candidate.resume_url && (
                            <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="rs-open-resume">
                                Open resume <span aria-hidden="true">↗</span>
                            </a>
                        )}
                    </div>
                </>
            ) : (
                <div className="rs-no-resume">
                    No resume was attached to this application. This candidate is not assigned a match score.
                </div>
            )}
        </article>
    );
}

function ResumeScreening() {
    const [searchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(searchParams.get("job") || "");
    const [data, setData] = useState(null);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [screeningLoading, setScreeningLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        getRecruiterJobs()
            .then((result) => {
                const list = Array.isArray(result) ? result : result.results || [];
                if (!active) return;
                setJobs(list);
                setSelectedJob((current) => {
                    if (current && list.some((job) => String(job.id) === String(current))) return current;
                    return list.length ? String(list[0].id) : "";
                });
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.detail || "Could not load your jobs.");
            })
            .finally(() => {
                if (active) setJobsLoading(false);
            });

        return () => { active = false; };
    }, []);

    const selectedJobDetails = useMemo(
        () => jobs.find((job) => String(job.id) === String(selectedJob)),
        [jobs, selectedJob]
    );

    const runScreening = async () => {
        if (!selectedJob) {
            setError("Create or select a job before screening resumes.");
            return;
        }

        setScreeningLoading(true);
        setError("");
        setData(null);

        try {
            const result = await getResumeScreening(selectedJob);
            setData(result);
        } catch (err) {
            setError(err.response?.data?.detail || "Resume screening could not be completed. Please try again.");
        } finally {
            setScreeningLoading(false);
        }
    };

    const candidates = data?.candidates || [];
    const rankedCandidates = candidates.filter((candidate) => candidate.score !== null);
    const topCandidate = rankedCandidates[0];

    return (
        <HRLayout
            title="Resume Screening"
            subtitle="Compare applicant resumes against your job requirements"
        >
            <div className="rs-page">
                <section className="rs-intro">
                    <div>
                        <span className="rs-eyebrow">RECRUITMENT INTELLIGENCE</span>
                        <h2>Find the strongest job-relevant matches.</h2>
                        <p>
                            Screen applicants against a specific job description using extracted resume entities,
                            required skills, job keywords and TF-IDF text similarity.
                        </p>
                    </div>
                    <div className="rs-intro-mark" aria-hidden="true">
                        <span>CV</span>
                        <i />
                        <i />
                        <i />
                    </div>
                </section>

                {error && <div className="rs-error" role="alert">{error}</div>}

                <section className="rs-control-card">
                    <div className="rs-control-copy">
                        <h3>Choose a job to screen against</h3>
                        <p>Only applications submitted to your own recruiter jobs are included.</p>
                    </div>
                    <div className="rs-control-row">
                        <select
                            className="rs-job-select"
                            value={selectedJob}
                            onChange={(event) => {
                                setSelectedJob(event.target.value);
                                setData(null);
                                setError("");
                            }}
                            disabled={jobsLoading || jobs.length === 0}
                        >
                            {jobs.length === 0 && <option value="">No jobs available</option>}
                            {jobs.map((job) => (
                                <option key={job.id} value={job.id}>{job.title} · {job.company}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="rs-run-button"
                            onClick={runScreening}
                            disabled={jobsLoading || screeningLoading || !selectedJob}
                        >
                            {screeningLoading ? "Screening resumes…" : "Run resume screening"}
                        </button>
                    </div>
                    {selectedJobDetails && (
                        <div className="rs-job-preview">
                            <strong>{selectedJobDetails.title}</strong>
                            <span>{selectedJobDetails.company} · {selectedJobDetails.location || "Location not specified"}</span>
                            <p>{selectedJobDetails.description}</p>
                            {asArray(selectedJobDetails.required_skills).length > 0 && (
                                <div className="rs-tags">
                                    {selectedJobDetails.required_skills.map((skill) => (
                                        <span className="rs-tag" key={skill}>{skill}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {!jobsLoading && jobs.length === 0 && (
                        <div className="rs-empty-inline">
                            You have no recruiter jobs yet. Publish a job first in <strong>Jobs</strong>.
                        </div>
                    )}
                </section>

                {screeningLoading && (
                    <div className="rs-loading">Analyzing resumes and ranking applicants…</div>
                )}

                {data && !screeningLoading && (
                    <>
                        <section className="rs-metrics">
                            <div className="rs-metric-card">
                                <span>Applications</span>
                                <strong>{data.total_applications}</strong>
                            </div>
                            <div className="rs-metric-card">
                                <span>Resumes analyzed</span>
                                <strong>{data.resumes_found}</strong>
                            </div>
                            <div className="rs-metric-card">
                                <span>Resumes missing</span>
                                <strong>{data.resumes_missing}</strong>
                            </div>
                            <div className="rs-metric-card rs-metric-highlight">
                                <span>Top match</span>
                                <strong>{topCandidate ? `${topCandidate.score}%` : "—"}</strong>
                                <small>{topCandidate?.candidate_name || "No scored resumes"}</small>
                            </div>
                        </section>

                        <section className="rs-method-card">
                            <div>
                                <h3>How the ranking works</h3>
                                <p>Scores are normalized to 100 and explainable for every applicant.</p>
                            </div>
                            <div className="rs-method-pills">
                                <span>Skills 45%</span>
                                <span>Text similarity 40%</span>
                                <span>JD keywords 15%</span>
                            </div>
                            <p className="rs-method-note">
                                Entity extraction surfaces skills, education, certifications and work history. These
                                extracted details are evidence for recruiter review; they do not automatically accept or reject candidates.
                            </p>
                        </section>

                        <div className="rs-results-heading">
                            <div>
                                <span className="rs-eyebrow">RANKED APPLICANTS</span>
                                <h3>{data.job.title}</h3>
                            </div>
                            <span>{rankedCandidates.length} scored · {data.resumes_missing} without a resume</span>
                        </div>

                        {asArray(data.keywords_used).length > 0 && (
                            <section className="rs-keyword-panel">
                                <h4>Keywords extracted from this job description</h4>
                                <div className="rs-tags">
                                    {data.keywords_used.map((keyword) => (
                                        <span className="rs-tag" key={keyword}>{keyword}</span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {candidates.length === 0 ? (
                            <div className="rs-empty-results">
                                <h3>No applications for this job yet</h3>
                                <p>Applicants will appear here after they apply to this published job.</p>
                            </div>
                        ) : (
                            <div className="rs-candidate-list">
                                {candidates.map((candidate) => (
                                    <CandidateCard key={candidate.application_id} candidate={candidate} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {!data && !screeningLoading && !jobsLoading && jobs.length > 0 && (
                    <div className="rs-empty-results rs-empty-prompt">
                        <h3>Ready to screen your applicants?</h3>
                        <p>Select one of your jobs and run screening to see a ranked, evidence-based candidate list.</p>
                    </div>
                )}

                <p className="rs-disclaimer">
                    Screening is decision support, not a hiring decision. Review the original resume, validate the extracted
                    information and assess each applicant fairly. Scores can be affected by resume formatting and text extraction quality.
                </p>
            </div>
        </HRLayout>
    );
}

export default ResumeScreening;
