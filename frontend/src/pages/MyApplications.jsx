
import { useEffect, useState } from "react";
import { getMyApplications } from "../services/api";
import "./MyApplications.css";

function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const data = await getMyApplications();

                // Support both an array and paginated API response
                const results = Array.isArray(data)
                    ? data
                    : data.results || [];

                setApplications(results);
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    "Unable to load applications. Please log in again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    if (loading) {
        return (
            <div className="applications-container">
                Loading applications...
            </div>
        );
    }

    return (
        <div className="applications-container">
            <h1>My Applications</h1>
            <p>Track the status of jobs you have applied for.</p>

            {error && (
                <p className="error-message">{error}</p>
            )}

            {!error && applications.length === 0 && (
                <div className="empty-applications">
                    <h3>No applications yet</h3>
                    <p>
                        Explore available jobs and apply to start
                        tracking them here.
                    </p>
                </div>
            )}

            <div className="applications-list">
                {applications.map((application) => (
                    <div
                        className="application-card"
                        key={application.id}
                    >
                        <h2>
                            {application.job_details?.title || "Job"}
                        </h2>

                        <p>
                            <strong>Company:</strong>{" "}
                            {application.job_details?.company || "Not available"}
                        </p>

                        <p>
                            <strong>Location:</strong>{" "}
                            {application.job_details?.location || "Not available"}
                        </p>

                        <p>
                            <strong>Applied on:</strong>{" "}
                            {application.applied_at
                                ? new Date(application.applied_at).toLocaleDateString()
                                : "Not available"}
                        </p>

                        <p>
                            <strong>Status:</strong>{" "}
                            <span
                                className={`application-status ${
                                    application.status?.toLowerCase() || ""
                                }`}
                            >
                                {application.status || "Applied"}
                            </span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MyApplications;
