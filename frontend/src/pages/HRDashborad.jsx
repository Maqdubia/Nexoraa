import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HRLayout from "../components/HRLayout";
import ScoreRing from "../components/ScoreRing";
import { getRecruiterStats } from "../services/recruiterApi";
import "./HRDashboard.css";

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
          })
        : "";

const PIPELINE = [
    { key: "Applied", label: "Applied", color: "#b7bfa9" },
    { key: "Shortlisted", label: "Shortlisted", color: "#7f8d63" },
    { key: "Selected", label: "Selected", color: "#3a4726" },
    { key: "Rejected", label: "Rejected", color: "#c9877d" },
];

function HRDashboard() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        getRecruiterStats()
            .then((data) => {
                if (active) setStats(data);
            })
            .catch((err) => {
                if (active) {
                    setError(
                        err.response?.data?.detail ||
                            "Could not load your dashboard. Please refresh."
                    );
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const total = stats?.total_applications || 0;

    return (
        <HRLayout
            title="Dashboard"
            subtitle="Your hiring at a glance."
            actions={
                <>
                    <Link to="/hr/candidates" className="hr-btn">
                        View candidates
                    </Link>
                    <Link to="/hr/jobs?new=1" className="hr-btn hr-btn-primary">
                        + Post a job
                    </Link>
                </>
            }
        >
            {error && <div className="hr-error">{error}</div>}
            {!stats && !error && <div className="hr-loading">Loading…</div>}

            {stats && (
                <>
                    <section className="hrd-stats">
                        <div className="hr-card hrd-stat">
                            <span>Active jobs</span>
                            <strong>{stats.published_jobs}</strong>
                            <small>{stats.total_jobs} posted in total</small>
                        </div>
                        <div className="hr-card hrd-stat">
                            <span>Total applicants</span>
                            <strong>{stats.total_applications}</strong>
                            <small>{stats.new_this_week} new this week</small>
                        </div>
                        <div className="hr-card hrd-stat">
                            <span>Shortlisted</span>
                            <strong>{stats.by_status.Shortlisted}</strong>
                            <small>ready for outreach</small>
                        </div>
                        <div className="hr-card hrd-stat">
                            <span>Selected</span>
                            <strong>{stats.by_status.Selected}</strong>
                            <small>offers or hires</small>
                        </div>
                    </section>

                    <section className="hr-card hr-card-pad hrd-pipeline">
                        <h2>Hiring pipeline</h2>
                        <p className="hr-card-sub">
                            Where your applicants are right now.
                        </p>

                        <div className="hrd-bar" aria-hidden="true">
                            {total === 0 ? (
                                <span className="hrd-bar-empty" />
                            ) : (
                                PIPELINE.map((step) => (
                                    <span
                                        key={step.key}
                                        style={{
                                            width: `${
                                                (stats.by_status[step.key] / total) * 100
                                            }%`,
                                            background: step.color,
                                        }}
                                    />
                                ))
                            )}
                        </div>

                        <div className="hrd-legend">
                            {PIPELINE.map((step) => (
                                <span key={step.key}>
                                    <i style={{ background: step.color }} />
                                    {step.label}
                                    <b>{stats.by_status[step.key]}</b>
                                </span>
                            ))}
                        </div>
                    </section>

                    <div className="hrd-grid">
                        <section className="hr-card hr-card-pad">
                            <h2>Recent applicants</h2>
                            <p className="hr-card-sub">
                                The newest people who applied to your jobs.
                            </p>

                            {stats.recent_applications.length === 0 ? (
                                <div className="hr-empty">
                                    <h3>No applicants yet</h3>
                                    <p>
                                        Post a job and students who apply will
                                        appear here.
                                    </p>
                                </div>
                            ) : (
                                <ul className="hrd-list">
                                    {stats.recent_applications.map((item) => (
                                        <li key={item.id}>
                                            <div className="hrd-person">
                                                <strong>{item.candidate}</strong>
                                                <small>
                                                    {item.job_title} ·{" "}
                                                    {formatDate(item.applied_at)}
                                                </small>
                                            </div>
                                            <ScoreRing value={item.ats_score} size={40} />
                                            <span
                                                className={`hr-badge hr-badge-${item.status.toLowerCase()}`}
                                            >
                                                {item.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <Link to="/hr/candidates" className="hrd-more">
                                See all candidates →
                            </Link>
                        </section>

                        <section className="hr-card hr-card-pad">
                            <h2>Your jobs</h2>
                            <p className="hr-card-sub">
                                Jobs with the most applicants first.
                            </p>

                            {stats.top_jobs.length === 0 ? (
                                <div className="hr-empty">
                                    <h3>No jobs yet</h3>
                                    <p>Post your first job to start hiring.</p>
                                    <Link
                                        to="/hr/jobs?new=1"
                                        className="hr-btn hr-btn-primary"
                                    >
                                        + Post a job
                                    </Link>
                                </div>
                            ) : (
                                <ul className="hrd-list">
                                    {stats.top_jobs.map((job) => (
                                        <li key={job.id}>
                                            <div className="hrd-person">
                                                <strong>{job.title}</strong>
                                                <small>{job.location}</small>
                                            </div>
                                            <Link
                                                to={`/hr/candidates?job=${job.id}`}
                                                className="hrd-count"
                                            >
                                                {job.applications} applicant
                                                {job.applications === 1 ? "" : "s"}
                                            </Link>
                                            <span
                                                className={`hr-badge ${
                                                    job.is_published
                                                        ? "hr-badge-live"
                                                        : "hr-badge-draft"
                                                }`}
                                            >
                                                {job.is_published ? "Live" : "Draft"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <Link to="/hr/jobs" className="hrd-more">
                                Manage jobs →
                            </Link>
                        </section>
                    </div>
                </>
            )}
        </HRLayout>
    );
}

export default HRDashboard;
