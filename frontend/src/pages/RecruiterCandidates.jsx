
import React, { useEffect, useMemo, useState } from "react";
import { getRecruiterApplications } from "../services/recruiterApi";
import "./RecruiterCandidates.css";

const Icon = ({ name }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    jobs: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    list: <path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>
  };

  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part[0]).join("").toUpperCase() || "C";

const formatDate = value =>
  value ? new Date(value).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric"
  }) : "—";

const statusClass = status =>
  (status || "Applied").toLowerCase().replace(/[^a-z]+/g, "-");

export default function RecruiterCandidates() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;

    getRecruiterApplications()
      .then(data => {
        if (active) {
          setApplications(
            Array.isArray(data) ? data : data.results || []
          );
        }
      })
      .catch(err => {
        if (active) {
          setError(
            err.response?.data?.detail ||
            "Unable to load candidates. Please check your recruiter login."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    return applications.filter(item => {
      const q = search.toLowerCase().trim();

      const matchesSearch = !q || [
        item.candidate,
        item.email,
        item.job_title,
        item.company
      ].some(value => String(value || "").toLowerCase().includes(q));

      const matchesStatus =
        status === "All statuses" || item.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, status]);

  const counts = {
    total: applications.length,
    applied: applications.filter(a => a.status === "Applied").length,
    shortlisted: applications.filter(a => a.status === "Shortlisted").length,
    selected: applications.filter(a => a.status === "Selected").length
  };

  return (
    <div className="nxc-page">
      <aside className="nxc-sidebar">
        <a href="/hr/dashboard" className="nxc-brand">
          <span className="nxc-brand-mark">N</span>
          <span>
            <strong>NEXORA</strong>
            <small>RECRUITER WORKSPACE</small>
          </span>
        </a>

        <div className="nxc-nav-label">MAIN MENU</div>

        <nav className="nxc-nav">
          <a href="/hr/dashboard" className="nxc-nav-link">
            <Icon name="dashboard"/> Dashboard
          </a>
          <a href="/hr/jobs" className="nxc-nav-link">
            <Icon name="jobs"/> Jobs
          </a>
          <a href="/hr/candidates" className="nxc-nav-link active">
            <Icon name="people"/> Candidates
          </a>
        </nav>

        <div className="nxc-sidebar-bottom">
          <div className="nxc-user">
            <span className="nxc-avatar">R</span>
            <span>
              <strong>Recruiter account</strong>
              <small>Nexora workspace</small>
            </span>
          </div>

          <button className="nxc-logout" onClick={() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.assign("/hr/login");
          }}>
            <Icon name="logout"/> Sign out
          </button>
        </div>
      </aside>

      <main className="nxc-main">
        <header className="nxc-topbar">
          <div className="nxc-breadcrumb">
            <a href="/hr/dashboard">Home</a>
            <span>/</span>
            Candidates
          </div>

          <div className="nxc-top-actions">
            <label className="nxc-global-search">
              <Icon name="search"/>
              <input
                placeholder="Search candidates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </label>
            <button className="nxc-icon-btn" aria-label="Notifications">
              <Icon name="bell"/>
            </button>
          </div>
        </header>

        <section className="nxc-content">
          <div className="nxc-heading">
            <div>
              <span className="nxc-eyebrow">TALENT MANAGEMENT</span>
              <h1>Candidates <small>({applications.length} applications)</small></h1>
              <p>Review applicants and manage your hiring pipeline.</p>
            </div>
          </div>

          <div className="nxc-stats">
            <div className="nxc-stat">
              <span>Total applicants</span>
              <strong>{counts.total}</strong>
              <small>Across your jobs</small>
            </div>
            <div className="nxc-stat">
              <span>New applications</span>
              <strong>{counts.applied}</strong>
              <small>Awaiting review</small>
            </div>
            <div className="nxc-stat">
              <span>Shortlisted</span>
              <strong>{counts.shortlisted}</strong>
              <small>Moving forward</small>
            </div>
            <div className="nxc-stat">
              <span>Selected</span>
              <strong>{counts.selected}</strong>
              <small>Selected candidates</small>
            </div>
          </div>

          <section className="nxc-table-card">
            <div className="nxc-toolbar">
              <label className="nxc-search">
                <Icon name="search"/>
                <input
                  placeholder="Search candidate or job..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </label>

              <div className="nxc-toolbar-right">
                <label className="nxc-filter">
                  <Icon name="filter"/>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option>All statuses</option>
                    <option>Applied</option>
                    <option>Shortlisted</option>
                    <option>Rejected</option>
                    <option>Selected</option>
                  </select>
                </label>

                <div className="nxc-view-toggle">
                  <button className={view === "list" ? "active" : ""}
                    onClick={() => setView("list")} aria-label="List view">
                    <Icon name="list"/>
                  </button>
                  <button className={view === "grid" ? "active" : ""}
                    onClick={() => setView("grid")} aria-label="Grid view">
                    <Icon name="grid"/>
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="nxc-state">Loading candidates...</div>
            ) : error ? (
              <div className="nxc-state nxc-error">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="nxc-state">
                <strong>No candidates found</strong>
                <span>
                  {applications.length
                    ? "Try changing your search or filters."
                    : "Applicants who apply to your jobs will appear here."}
                </span>
              </div>
            ) : view === "list" ? (
              <div className="nxc-table-wrap">
                <table className="nxc-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Applied for</th>
                      <th>Status</th>
                      <th>Applied on</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="nxc-candidate">
                            <span className="nxc-avatar">
                              {initials(item.candidate)}
                            </span>
                            <span>
                              <strong>{item.candidate || "Candidate"}</strong>
                              <small>{item.email || "—"}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <strong>{item.job_title || "—"}</strong>
                          <small className="nxc-company">
                            {item.company || ""}
                          </small>
                        </td>
                        <td>
                          <span className={`nxc-status ${statusClass(item.status)}`}>
                            <i/>{item.status || "Applied"}
                          </span>
                        </td>
                        <td>{formatDate(item.applied_at)}</td>
                        <td>
                          <button className="nxc-action"
                            onClick={() => setSelected(item)}
                            aria-label="View candidate">
                            <Icon name="eye"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="nxc-cards">
                {filtered.map(item => (
                  <button className="nxc-candidate-card"
                    key={item.id} onClick={() => setSelected(item)}>
                    <span className="nxc-avatar large">
                      {initials(item.candidate)}
                    </span>
                    <strong>{item.candidate || "Candidate"}</strong>
                    <small>{item.email || "—"}</small>
                    <span>{item.job_title || "—"}</span>
                    <span className={`nxc-status ${statusClass(item.status)}`}>
                      <i/>{item.status || "Applied"}
                    </span>
                    <small>Applied {formatDate(item.applied_at)}</small>
                  </button>
                ))}
              </div>
            )}

            <footer className="nxc-table-footer">
              <span>Showing {filtered.length} of {applications.length} applications</span>
              <span>Nexora Recruiter Workspace</span>
            </footer>
          </section>
        </section>
      </main>

      {selected && (
        <div className="nxc-modal-bg" onClick={() => setSelected(null)}>
          <section className="nxc-modal" role="dialog" aria-modal="true"
            onClick={e => e.stopPropagation()}>
            <button className="nxc-modal-close"
              onClick={() => setSelected(null)} aria-label="Close">
              <Icon name="close"/>
            </button>

            <span className="nxc-detail-avatar">
              {initials(selected.candidate)}
            </span>
            <span className="nxc-eyebrow">APPLICATION DETAILS</span>
            <h2>{selected.candidate || "Candidate"}</h2>
            <p>{selected.email || "No email provided"}</p>

            <div className="nxc-detail-list">
              <div><span>Applied for</span><strong>{selected.job_title || "—"}</strong></div>
              <div><span>Company</span><strong>{selected.company || "—"}</strong></div>
              <div><span>Applied on</span><strong>{formatDate(selected.applied_at)}</strong></div>
              <div>
                <span>Status</span>
                <strong>{selected.status || "Applied"}</strong>
              </div>
            </div>

            {selected.cover_letter && (
              <div className="nxc-cover-letter">
                <strong>Cover letter</strong>
                <p>{selected.cover_letter}</p>
              </div>
            )}

            <p className="nxc-note">
              Candidate status updates and interview scheduling will be connected
              in the next implementation step.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
