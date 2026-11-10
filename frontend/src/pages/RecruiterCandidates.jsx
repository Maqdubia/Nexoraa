import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import HRLayout from "../components/HRLayout";
import ScoreRing from "../components/ScoreRing";
import {
    getRecruiterApplications,
    getRecruiterJobs,
    getApplicationDetail,
    updateApplicationStatus,
    bulkUpdateStatus,
} from "../services/recruiterApi";
import "./RecruiterCandidates.css";

const STATUSES = ["Applied", "Shortlisted", "Selected", "Rejected"];

const initials = (name = "") =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "C";

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "—";

const badgeClass = (status) => `hr-badge hr-badge-${(status || "Applied").toLowerCase()}`;

const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        const box = document.createElement("textarea");
        box.value = text;
        box.style.position = "fixed";
        box.style.opacity = "0";
        document.body.appendChild(box);
        box.select();
        let ok = false;
        try {
            ok = document.execCommand("copy");
        } catch (e) {
            ok = false;
        }
        document.body.removeChild(box);
        return ok;
    }
};

function RecruiterCandidates() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [applications, setApplications] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

    const [search, setSearch] = useState("");
    const [jobFilter, setJobFilter] = useState(searchParams.get("job") || "all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [minScore, setMinScore] = useState("0");
    const [sortBy, setSortBy] = useState("ats");

    const [selectedIds, setSelectedIds] = useState([]);
    const [busy, setBusy] = useState(false);

    const [drawerId, setDrawerId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showResumeText, setShowResumeText] = useState(false);

    const showToast = (message, type = "ok") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadAll = useCallback(async () => {
        try {
            const [apps, jobList] = await Promise.all([
                getRecruiterApplications(),
                getRecruiterJobs(),
            ]);

            setApplications(Array.isArray(apps) ? apps : apps.results || []);
            setJobs(Array.isArray(jobList) ? jobList : jobList.results || []);
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                    "Could not load candidates. Please refresh the page."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const changeJobFilter = (value) => {
        setJobFilter(value);
        setSelectedIds([]);

        if (value === "all") {
            setSearchParams({}, { replace: true });
        } else {
            setSearchParams({ job: value }, { replace: true });
        }
    };

    const visible = useMemo(() => {
        const q = search.toLowerCase().trim();
        const min = Number(minScore);

        const list = applications.filter((item) => {
            const matchesSearch =
                !q ||
                [item.candidate, item.email, item.job_title, item.location]
                    .concat(item.skills || [])
                    .some((value) => String(value || "").toLowerCase().includes(q));

            const matchesJob =
                jobFilter === "all" || String(item.job_id) === String(jobFilter);
            const matchesStatus =
                statusFilter === "all" || item.status === statusFilter;

            return matchesSearch && matchesJob && matchesStatus && item.ats_score >= min;
        });

        list.sort((a, b) => {
            if (sortBy === "newest") {
                return new Date(b.applied_at) - new Date(a.applied_at);
            }
            if (sortBy === "name") {
                return a.candidate.localeCompare(b.candidate);
            }
            return b.ats_score - a.ats_score;
        });

        return list;
    }, [applications, search, jobFilter, statusFilter, minScore, sortBy]);

    const selectedPeople = useMemo(
        () => applications.filter((item) => selectedIds.includes(item.id)),
        [applications, selectedIds]
    );

    const allVisibleSelected =
        visible.length > 0 && visible.every((item) => selectedIds.includes(item.id));

    const toggleOne = (id) =>
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id]
        );

    const toggleAll = () => {
        if (allVisibleSelected) {
            const visibleIds = visible.map((item) => item.id);
            setSelectedIds((current) =>
                current.filter((id) => !visibleIds.includes(id))
            );
        } else {
            setSelectedIds((current) => [
                ...new Set([...current, ...visible.map((item) => item.id)]),
            ]);
        }
    };

    const patchLocal = (id, changes) =>
        setApplications((current) =>
            current.map((item) => (item.id === id ? { ...item, ...changes } : item))
        );

    const setStatus = async (id, status) => {
        const previous = applications.find((item) => item.id === id)?.status;
        patchLocal(id, { status });

        if (detail && detail.id === id) {
            setDetail((current) => ({ ...current, status }));
        }

        try {
            await updateApplicationStatus(id, status);
            showToast(`Marked as ${status}.`);
        } catch (err) {
            patchLocal(id, { status: previous });
            if (detail && detail.id === id) {
                setDetail((current) => ({ ...current, status: previous }));
            }
            showToast("Could not update the status.", "error");
        }
    };

    const bulkSet = async (status) => {
        if (selectedIds.length === 0) return;

        setBusy(true);

        try {
            const result = await bulkUpdateStatus(selectedIds, status);
            setApplications((current) =>
                current.map((item) =>
                    selectedIds.includes(item.id) ? { ...item, status } : item
                )
            );
            showToast(`${result.updated} candidate(s) marked as ${status}.`);
        } catch (err) {
            showToast("Could not update the selected candidates.", "error");
        } finally {
            setBusy(false);
        }
    };

    const copyEmails = async () => {
        const emails = selectedPeople
            .map((item) => item.email)
            .filter(Boolean)
            .join(", ");

        const ok = await copyText(emails);
        showToast(ok ? "Email addresses copied." : "Could not copy. Select them manually.", ok ? "ok" : "error");
    };

    const mailtoHref = useMemo(() => {
        const emails = selectedPeople.map((item) => item.email).filter(Boolean);
        return `mailto:?bcc=${encodeURIComponent(emails.join(","))}&subject=${encodeURIComponent(
            "Regarding your application on Nexora"
        )}`;
    }, [selectedPeople]);

    const openDrawer = async (id) => {
        setDrawerId(id);
        setDetail(null);
        setShowResumeText(false);
        setDetailLoading(true);

        try {
            const data = await getApplicationDetail(id);
            setDetail(data);
        } catch (err) {
            showToast("Could not load this candidate.", "error");
            setDrawerId(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDrawer = () => {
        setDrawerId(null);
        setDetail(null);
    };

    const counts = {
        total: applications.length,
        shortlisted: applications.filter((item) => item.status === "Shortlisted").length,
    };

    return (
        <HRLayout
            title="Candidates"
            subtitle={`${counts.total} applied · ${counts.shortlisted} shortlisted`}
        >
            {error && <div className="hr-error">{error}</div>}

            <section className="hr-card rc-panel">
                <div className="rc-toolbar">
                    <input
                        className="hr-input rc-search"
                        placeholder="Search name, email, skill or location…"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <select className="hr-select" value={jobFilter}
                        onChange={(event) => changeJobFilter(event.target.value)}>
                        <option value="all">All jobs</option>
                        {jobs.map((job) => (
                            <option key={job.id} value={job.id}>
                                {job.title}
                            </option>
                        ))}
                    </select>

                    <select className="hr-select" value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value="all">All statuses</option>
                        {STATUSES.map((status) => (
                            <option key={status}>{status}</option>
                        ))}
                    </select>

                    <select className="hr-select" value={minScore}
                        onChange={(event) => setMinScore(event.target.value)}>
                        <option value="0">Any ATS score</option>
                        <option value="50">ATS 50+</option>
                        <option value="75">ATS 75+</option>
                    </select>

                    <select className="hr-select" value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}>
                        <option value="ats">Best ATS first</option>
                        <option value="newest">Newest first</option>
                        <option value="name">Name A–Z</option>
                    </select>
                </div>

                {selectedPeople.length > 0 && (
                    <div className="rc-tray">
                        <div className="rc-tray-top">
                            <strong>{selectedPeople.length} selected</strong>

                            <div className="rc-tray-actions">
                                <button type="button" className="hr-btn hr-btn-primary hr-btn-sm"
                                    disabled={busy} onClick={() => bulkSet("Shortlisted")}>
                                    Shortlist
                                </button>
                                <button type="button" className="hr-btn hr-btn-sm"
                                    disabled={busy} onClick={() => bulkSet("Selected")}>
                                    Mark selected
                                </button>
                                <button type="button" className="hr-btn hr-btn-sm hr-btn-danger"
                                    disabled={busy} onClick={() => bulkSet("Rejected")}>
                                    Reject
                                </button>
                                <button type="button" className="hr-btn hr-btn-sm" onClick={copyEmails}>
                                    Copy emails
                                </button>
                                <a className="hr-btn hr-btn-sm" href={mailtoHref}>
                                    Email them
                                </a>
                                <button type="button" className="hr-btn hr-btn-sm"
                                    onClick={() => setSelectedIds([])}>
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="rc-tray-names">
                            {selectedPeople.map((item) => (
                                <span className="rc-pill" key={item.id}>
                                    {item.candidate}
                                    <button type="button" aria-label={`Remove ${item.candidate}`}
                                        onClick={() => toggleOne(item.id)}>
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {loading && <div className="hr-loading">Loading candidates…</div>}

                {!loading && !error && applications.length === 0 && (
                    <div className="hr-empty">
                        <h3>No applications yet</h3>
                        <p>
                            When students apply to your jobs, they will appear here with
                            their ATS score.
                        </p>
                        <Link to="/hr/jobs" className="hr-btn hr-btn-primary">
                            Manage jobs
                        </Link>
                    </div>
                )}

                {!loading && applications.length > 0 && (
                    <div className="rc-table-wrap">
                        <table className="rc-table">
                            <thead>
                                <tr>
                                    <th className="rc-check">
                                        <input type="checkbox" checked={allVisibleSelected}
                                            onChange={toggleAll} aria-label="Select all candidates" />
                                    </th>
                                    <th>Candidate</th>
                                    <th>Applied for</th>
                                    <th>Status</th>
                                    <th>Applied on</th>
                                    <th>ATS score</th>
                                    <th>Skills match</th>
                                    <th className="rc-actions-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((item) => (
                                    <tr key={item.id}
                                        className={selectedIds.includes(item.id) ? "is-selected" : ""}>
                                        <td className="rc-check">
                                            <input type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleOne(item.id)}
                                                aria-label={`Select ${item.candidate}`} />
                                        </td>
                                        <td>
                                            <button type="button" className="rc-person"
                                                onClick={() => openDrawer(item.id)}>
                                                <span className="rc-avatar">{initials(item.candidate)}</span>
                                                <span>
                                                    <strong>{item.candidate}</strong>
                                                    <small>{item.location || item.email}</small>
                                                </span>
                                            </button>
                                        </td>
                                        <td className="rc-job">{item.job_title}</td>
                                        <td>
                                            <span className={badgeClass(item.status)}>{item.status}</span>
                                        </td>
                                        <td className="rc-date">{formatDate(item.applied_at)}</td>
                                        <td>
                                            <ScoreRing value={item.ats_score} />
                                        </td>
                                        <td className="rc-match">
                                            {item.skill_match === null
                                                ? "—"
                                                : `${item.matched_skills.length}/${
                                                      item.matched_skills.length +
                                                      item.missing_skills.length
                                                  }`}
                                        </td>
                                        <td className="rc-actions-col">
                                            <div className="rc-row-actions">
                                                <button type="button" className="hr-btn hr-btn-sm"
                                                    onClick={() => openDrawer(item.id)}>
                                                    View
                                                </button>
                                                {item.status !== "Shortlisted" && (
                                                    <button type="button" className="hr-btn hr-btn-sm hr-btn-primary"
                                                        onClick={() => setStatus(item.id, "Shortlisted")}>
                                                        Shortlist
                                                    </button>
                                                )}
                                                {item.status !== "Rejected" && (
                                                    <button type="button" className="hr-btn hr-btn-sm hr-btn-danger"
                                                        onClick={() => setStatus(item.id, "Rejected")}>
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {visible.length === 0 && (
                            <div className="hr-empty">
                                <h3>No candidates match these filters</h3>
                                <p>Try clearing the search or lowering the ATS score.</p>
                            </div>
                        )}
                    </div>
                )}

                <p className="rc-footnote">
                    ATS score = 60% match with the job's required skills + 40% resume
                    score. If a candidate has no resume, the skill match is used alone.
                </p>
            </section>

            {drawerId && (
                <div className="rc-drawer-overlay" onMouseDown={closeDrawer}>
                    <aside className="rc-drawer" onMouseDown={(event) => event.stopPropagation()}>
                        <button type="button" className="rc-drawer-close"
                            onClick={closeDrawer} aria-label="Close">
                            ×
                        </button>

                        {detailLoading && <div className="hr-loading">Loading…</div>}

                        {detail && (
                            <>
                                <div className="rc-d-head">
                                    <span className="rc-avatar rc-avatar-lg">
                                        {initials(detail.candidate)}
                                    </span>
                                    <div>
                                        <h2>{detail.candidate}</h2>
                                        <p>{detail.email}</p>
                                        <p>
                                            {[detail.phone, detail.location]
                                                .filter(Boolean)
                                                .join(" · ") || "No phone or location added"}
                                        </p>
                                    </div>
                                </div>

                                <div className="rc-d-apply">
                                    <span>Applied for <b>{detail.job_title}</b> on {formatDate(detail.applied_at)}</span>
                                    <span className={badgeClass(detail.status)}>{detail.status}</span>
                                </div>

                                <div className="rc-d-status">
                                    {STATUSES.map((status) => (
                                        <button type="button" key={status}
                                            className={`hr-btn hr-btn-sm ${
                                                detail.status === status ? "hr-btn-primary" : ""
                                            }`}
                                            onClick={() => setStatus(detail.id, status)}>
                                            {status}
                                        </button>
                                    ))}
                                </div>

                                <div className="rc-d-score">
                                    <ScoreRing value={detail.ats_score} size={64} />
                                    <div>
                                        <strong>ATS score {detail.ats_score}/100</strong>
                                        <p>
                                            Skill match:{" "}
                                            {detail.skill_match === null
                                                ? "job lists no skills"
                                                : `${detail.skill_match}%`}
                                            {" · "}
                                            Resume score:{" "}
                                            {detail.resume_score === null
                                                ? "no resume uploaded"
                                                : `${detail.resume_score}/100`}
                                        </p>
                                    </div>
                                </div>

                                <h4>Skills for this job</h4>
                                <div>
                                    {detail.matched_skills.map((skill) => (
                                        <span className="hr-chip" key={`m-${skill}`}>✓ {skill}</span>
                                    ))}
                                    {detail.missing_skills.map((skill) => (
                                        <span className="hr-chip hr-chip-miss" key={`x-${skill}`}>{skill}</span>
                                    ))}
                                    {detail.matched_skills.length + detail.missing_skills.length === 0 && (
                                        <p className="rc-muted">This job lists no required skills.</p>
                                    )}
                                </div>

                                <h4>All candidate skills</h4>
                                <div>
                                    {detail.skills.length === 0 ? (
                                        <p className="rc-muted">No skills added.</p>
                                    ) : (
                                        detail.skills.map((skill) => (
                                            <span className="hr-chip" key={skill}>{skill}</span>
                                        ))
                                    )}
                                </div>

                                {detail.bio && (
                                    <>
                                        <h4>About</h4>
                                        <p className="rc-text">{detail.bio}</p>
                                    </>
                                )}

                                <h4>Experience</h4>
                                {detail.experience.length === 0 ? (
                                    <p className="rc-muted">No experience added.</p>
                                ) : (
                                    detail.experience.map((item, index) => (
                                        <div className="rc-item" key={index}>
                                            <strong>{item.job_title}</strong>
                                            <span>
                                                {item.company} · {formatDate(item.start_date)} –{" "}
                                                {item.currently_working ? "Present" : formatDate(item.end_date)}
                                            </span>
                                            {item.description && <p>{item.description}</p>}
                                        </div>
                                    ))
                                )}

                                <h4>Education</h4>
                                {detail.education.length === 0 ? (
                                    <p className="rc-muted">No education added.</p>
                                ) : (
                                    detail.education.map((item, index) => (
                                        <div className="rc-item" key={index}>
                                            <strong>
                                                {item.degree}
                                                {item.field_of_study ? `, ${item.field_of_study}` : ""}
                                            </strong>
                                            <span>
                                                {item.institution} · {item.start_year}
                                                {item.end_year ? ` – ${item.end_year}` : ""}
                                            </span>
                                        </div>
                                    ))
                                )}

                                {detail.cover_letter && (
                                    <>
                                        <h4>Cover letter</h4>
                                        <p className="rc-text">{detail.cover_letter}</p>
                                    </>
                                )}

                                <h4>Resume</h4>
                                {!detail.has_resume ? (
                                    <p className="rc-muted">This candidate has not uploaded a resume.</p>
                                ) : (
                                    <>
                                        <p className="rc-muted">
                                            {detail.resume_title}
                                            {detail.resume_sections.length > 0 &&
                                                ` · sections: ${detail.resume_sections.join(", ")}`}
                                        </p>
                                        <div className="rc-resume-actions">
                                            {detail.resume_url && (
                                                <a className="hr-btn hr-btn-sm" href={detail.resume_url}
                                                    target="_blank" rel="noopener noreferrer">
                                                    Open resume file
                                                </a>
                                            )}
                                            {detail.resume_text && (
                                                <button type="button" className="hr-btn hr-btn-sm"
                                                    onClick={() => setShowResumeText((value) => !value)}>
                                                    {showResumeText ? "Hide resume text" : "Read resume text"}
                                                </button>
                                            )}
                                        </div>
                                        {showResumeText && (
                                            <pre className="rc-resume-text">{detail.resume_text}</pre>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </aside>
                </div>
            )}

            {toast && (
                <div className={`hr-toast ${toast.type === "error" ? "hr-toast-error" : ""}`}
                    role="status">
                    {toast.message}
                </div>
            )}
        </HRLayout>
    );
}

export default RecruiterCandidates;
