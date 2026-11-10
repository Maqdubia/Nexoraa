import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import HRLayout from "../components/HRLayout";
import {
    getRecruiterJobs,
    createRecruiterJob,
    updateRecruiterJob,
    deleteRecruiterJob,
} from "../services/recruiterApi";
import "./HRJobs.css";

const JOB_TYPES = ["Full Time", "Part Time", "Internship", "Contract", "Freelance"];
const WORK_MODES = ["On-site", "Hybrid", "Remote"];

const EMPTY_FORM = {
    title: "",
    company: "",
    location: "",
    job_type: "Full Time",
    work_mode: "On-site",
    experience: "",
    salary: "",
    vacancies: 1,
    application_deadline: "",
    description: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
    skills_text: "",
    application_url: "",
    is_published: true,
};

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "No deadline";

const jobToForm = (job) => ({
    title: job.title || "",
    company: job.company || "",
    location: job.location || "",
    job_type: job.job_type || "Full Time",
    work_mode: job.work_mode || "On-site",
    experience: job.experience || "",
    salary: job.salary || "",
    vacancies: job.vacancies || 1,
    application_deadline: job.application_deadline || "",
    description: job.description || "",
    responsibilities: job.responsibilities || "",
    requirements: job.requirements || "",
    benefits: job.benefits || "",
    skills_text: (job.required_skills || []).join(", "),
    application_url: job.application_url || "",
    is_published: job.is_published,
});

const formToPayload = (form) => ({
    title: form.title.trim(),
    company: form.company.trim(),
    location: form.location.trim(),
    job_type: form.job_type,
    work_mode: form.work_mode,
    experience: form.experience.trim(),
    salary: form.salary.trim(),
    vacancies: Number(form.vacancies) || 1,
    application_deadline: form.application_deadline || null,
    description: form.description.trim(),
    responsibilities: form.responsibilities.trim(),
    requirements: form.requirements.trim(),
    benefits: form.benefits.trim(),
    required_skills: form.skills_text
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    application_url: form.application_url.trim(),
    is_published: form.is_published,
});

function Field({ label, error, hint, children }) {
    return (
        <label className="hrj-field">
            <span>{label}</span>
            {children}
            {hint && !error && <em>{hint}</em>}
            {error && <b className="hrj-field-error">{error}</b>}
        </label>
    );
}

function HRJobs() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

    const [editing, setEditing] = useState(null); // null | "new" | job object
    const [form, setForm] = useState(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const showToast = (message, type = "ok") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3200);
    };

    const loadJobs = useCallback(async () => {
        try {
            const data = await getRecruiterJobs();
            setJobs(Array.isArray(data) ? data : data.results || []);
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                    "Could not load your jobs. Please refresh."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    const openNew = useCallback(() => {
        setForm(EMPTY_FORM);
        setFieldErrors({});
        setFormError("");
        setEditing("new");
    }, []);

    // "Post a job" buttons elsewhere link here with ?new=1
    useEffect(() => {
        if (searchParams.get("new") === "1") {
            openNew();
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams, openNew]);

    const openEdit = (job) => {
        setForm(jobToForm(job));
        setFieldErrors({});
        setFormError("");
        setEditing(job);
    };

    const closeForm = () => {
        if (!saving) setEditing(null);
    };

    const setField = (name) => (event) => {
        const value =
            event.target.type === "checkbox"
                ? event.target.checked
                : event.target.value;

        setForm((current) => ({ ...current, [name]: value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFieldErrors({});
        setFormError("");

        const payload = formToPayload(form);

        try {
            if (editing === "new") {
                await createRecruiterJob(payload);
                showToast("Job published. Students can see it now.");
            } else {
                await updateRecruiterJob(editing.id, payload);
                showToast("Job updated.");
            }

            setEditing(null);
            await loadJobs();
        } catch (err) {
            const data = err.response?.data;

            if (data && typeof data === "object" && !data.detail) {
                const flat = {};

                Object.entries(data).forEach(([key, value]) => {
                    flat[key] = Array.isArray(value) ? value[0] : String(value);
                });

                setFieldErrors(flat);
                setFormError("Please fix the highlighted fields.");
            } else {
                setFormError(data?.detail || "Could not save the job. Try again.");
            }
        } finally {
            setSaving(false);
        }
    };

    const togglePublished = async (job) => {
        try {
            await updateRecruiterJob(job.id, { is_published: !job.is_published });
            showToast(
                job.is_published
                    ? "Job hidden from students."
                    : "Job is live for students."
            );
            await loadJobs();
        } catch (err) {
            showToast("Could not change the job status.", "error");
        }
    };

    const confirmDelete = async () => {
        setDeleting(true);

        try {
            await deleteRecruiterJob(toDelete.id);
            setToDelete(null);
            showToast("Job deleted.");
            await loadJobs();
        } catch (err) {
            showToast("Could not delete the job.", "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <HRLayout
            title="Jobs"
            subtitle="Post, edit and manage your openings."
            actions={
                <button
                    type="button"
                    className="hr-btn hr-btn-primary"
                    onClick={openNew}
                >
                    + Post a job
                </button>
            }
        >
            {error && <div className="hr-error">{error}</div>}
            {loading && <div className="hr-loading">Loading your jobs…</div>}

            {!loading && !error && jobs.length === 0 && (
                <div className="hr-card hr-empty">
                    <h3>You have not posted any jobs yet</h3>
                    <p>
                        Post a job and it appears in the students' job
                        explorer right away.
                    </p>
                    <button
                        type="button"
                        className="hr-btn hr-btn-primary"
                        onClick={openNew}
                    >
                        + Post your first job
                    </button>
                </div>
            )}

            <div className="hrj-list">
                {jobs.map((job) => (
                    <article className="hr-card hrj-job" key={job.id}>
                        <div className="hrj-main">
                            <div className="hrj-title-row">
                                <h3>{job.title}</h3>
                                <span
                                    className={`hr-badge ${
                                        job.is_published
                                            ? "hr-badge-live"
                                            : "hr-badge-draft"
                                    }`}
                                >
                                    {job.is_published ? "Live" : "Hidden"}
                                </span>
                            </div>

                            <p className="hrj-meta">
                                {job.company} · {job.location}
                                {job.work_mode ? ` · ${job.work_mode}` : ""} ·{" "}
                                {job.job_type}
                            </p>

                            <p className="hrj-meta">
                                {job.vacancies} vacanc
                                {job.vacancies === 1 ? "y" : "ies"} · Apply by{" "}
                                {formatDate(job.application_deadline)}
                                {job.salary ? ` · ${job.salary}` : ""}
                            </p>

                            <div>
                                {(job.required_skills || []).slice(0, 6).map((skill) => (
                                    <span className="hr-chip" key={skill}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="hrj-side">
                            <Link
                                to={`/hr/candidates?job=${job.id}`}
                                className="hrj-applicants"
                            >
                                <strong>{job.applications_count}</strong>
                                <span>
                                    applicant{job.applications_count === 1 ? "" : "s"}
                                </span>
                            </Link>

                            <div className="hrj-buttons">
                                <button
                                    type="button"
                                    className="hr-btn hr-btn-sm"
                                    onClick={() => openEdit(job)}
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    className="hr-btn hr-btn-sm"
                                    onClick={() => togglePublished(job)}
                                >
                                    {job.is_published ? "Hide" : "Publish"}
                                </button>
                                <button
                                    type="button"
                                    className="hr-btn hr-btn-sm hr-btn-danger"
                                    onClick={() => setToDelete(job)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {editing && (
                <div className="hr-modal-overlay" onMouseDown={closeForm}>
                    <form
                        className="hr-modal"
                        onMouseDown={(event) => event.stopPropagation()}
                        onSubmit={submit}
                        noValidate
                    >
                        <h2>{editing === "new" ? "Post a new job" : "Edit job"}</h2>
                        <p className="hr-card-sub">
                            Clear details help the right students apply.
                        </p>

                        {formError && <div className="hr-error">{formError}</div>}

                        <div className="hrj-grid">
                            <Field label="Job title *" error={fieldErrors.title}>
                                <input className="hr-input" value={form.title}
                                    onChange={setField("title")} placeholder="e.g. Data Analyst" />
                            </Field>
                            <Field label="Company *" error={fieldErrors.company}>
                                <input className="hr-input" value={form.company}
                                    onChange={setField("company")} placeholder="Your company name" />
                            </Field>
                            <Field label="Location *" error={fieldErrors.location}>
                                <input className="hr-input" value={form.location}
                                    onChange={setField("location")} placeholder="e.g. Hyderabad" />
                            </Field>
                            <Field label="Job type" error={fieldErrors.job_type}>
                                <select className="hr-select" value={form.job_type}
                                    onChange={setField("job_type")}>
                                    {JOB_TYPES.map((item) => (
                                        <option key={item}>{item}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Work mode" error={fieldErrors.work_mode}>
                                <select className="hr-select" value={form.work_mode}
                                    onChange={setField("work_mode")}>
                                    {WORK_MODES.map((item) => (
                                        <option key={item}>{item}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Experience" error={fieldErrors.experience}>
                                <input className="hr-input" value={form.experience}
                                    onChange={setField("experience")} placeholder="e.g. 0-2 years" />
                            </Field>
                            <Field label="Salary" error={fieldErrors.salary}>
                                <input className="hr-input" value={form.salary}
                                    onChange={setField("salary")} placeholder="e.g. 4-6 LPA" />
                            </Field>
                            <Field label="Vacancies" error={fieldErrors.vacancies}>
                                <input className="hr-input" type="number" min="1"
                                    value={form.vacancies} onChange={setField("vacancies")} />
                            </Field>
                            <Field label="Apply before" error={fieldErrors.application_deadline}>
                                <input className="hr-input" type="date"
                                    value={form.application_deadline}
                                    onChange={setField("application_deadline")} />
                            </Field>
                        </div>

                        <Field
                            label="Required skills"
                            error={fieldErrors.required_skills}
                            hint="Separate with commas. Candidates are scored against these."
                        >
                            <input className="hr-input" value={form.skills_text}
                                onChange={setField("skills_text")}
                                placeholder="Python, SQL, Power BI" />
                        </Field>

                        <Field label="About the role *" error={fieldErrors.description}>
                            <textarea className="hr-textarea" value={form.description}
                                onChange={setField("description")}
                                placeholder="What will this person do and why does the role matter?" />
                        </Field>
                        <Field label="Responsibilities" error={fieldErrors.responsibilities}
                            hint="One point per line.">
                            <textarea className="hr-textarea" value={form.responsibilities}
                                onChange={setField("responsibilities")} />
                        </Field>
                        <Field label="Requirements" error={fieldErrors.requirements}
                            hint="One point per line. Qualifications, experience, must-haves.">
                            <textarea className="hr-textarea" value={form.requirements}
                                onChange={setField("requirements")} />
                        </Field>
                        <Field label="Benefits" error={fieldErrors.benefits}
                            hint="One point per line. Optional.">
                            <textarea className="hr-textarea" value={form.benefits}
                                onChange={setField("benefits")} />
                        </Field>
                        <Field label="External application link (optional)"
                            error={fieldErrors.application_url}
                            hint="Leave empty to receive applications inside Nexora.">
                            <input className="hr-input" value={form.application_url}
                                onChange={setField("application_url")}
                                placeholder="https://" />
                        </Field>

                        <label className="hrj-check">
                            <input type="checkbox" checked={form.is_published}
                                onChange={setField("is_published")} />
                            Publish now (visible to students)
                        </label>

                        <div className="hrj-form-actions">
                            <button type="button" className="hr-btn"
                                onClick={closeForm} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="hr-btn hr-btn-primary"
                                disabled={saving}>
                                {saving
                                    ? "Saving…"
                                    : editing === "new"
                                    ? "Publish job"
                                    : "Save changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {toDelete && (
                <div className="hr-modal-overlay"
                    onMouseDown={() => !deleting && setToDelete(null)}>
                    <div className="hr-modal hr-modal-sm"
                        onMouseDown={(event) => event.stopPropagation()}>
                        <h2>Delete this job?</h2>
                        <p className="hr-card-sub">
                            “{toDelete.title}” and its {toDelete.applications_count}{" "}
                            application{toDelete.applications_count === 1 ? "" : "s"} will be
                            removed. This cannot be undone. Use “Hide” if you only
                            want to pause it.
                        </p>
                        <div className="hrj-form-actions">
                            <button type="button" className="hr-btn"
                                onClick={() => setToDelete(null)} disabled={deleting}>
                                Cancel
                            </button>
                            <button type="button" className="hr-btn hr-btn-primary hrj-delete"
                                onClick={confirmDelete} disabled={deleting}>
                                {deleting ? "Deleting…" : "Yes, delete"}
                            </button>
                        </div>
                    </div>
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

export default HRJobs;
