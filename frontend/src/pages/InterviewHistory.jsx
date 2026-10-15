
import { useEffect, useState } from "react";
import { getInterviewHistory } from "../services/api";
import "./InterviewHistory.css";

function InterviewHistory() {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getInterviewHistory();
                setInterviews(Array.isArray(data) ? data : data.results || []);
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    "Unable to load interview history. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return <div className="history-page">Loading interview history...</div>;
    }

    if (error) {
        return <div className="history-page history-error">{error}</div>;
    }

    return (
        <div className="history-page">
            <div className="history-header">
                <h1>Interview History</h1>
                <p>Review your previous AI mock interview sessions.</p>
            </div>

            {interviews.length === 0 ? (
                <div className="history-empty">
                    <h2>No interviews yet</h2>
                    <p>Complete an AI mock interview to see your history here.</p>
                </div>
            ) : (
                <div className="history-list">
                    {interviews.map((interview) => (
                        <div className="history-card" key={interview.id}>
                            <div className="history-card-header">
                                <h2>
                                    {interview.interview_type || "AI Interview"}
                                </h2>
                                <span className="history-badge">
                                    Completed
                                </span>
                            </div>

                            <p className="history-date">
                                Date:{" "}
                                {interview.created_at
                                    ? new Date(
                                          interview.created_at
                                      ).toLocaleString()
                                    : "Not available"}
                            </p>

                            <div className="history-score">
                                <span>Total Score</span>
                                <strong>
                                    {interview.total_score ?? 0}
                                </strong>
                            </div>

                            {interview.feedback && (
                                <div className="history-feedback">
                                    <h3>Feedback</h3>
                                    <p>{interview.feedback}</p>
                                </div>
                            )}

                            {Array.isArray(interview.answers) &&
                                interview.answers.length > 0 && (
                                    <div className="history-answers">
                                        <h3>Questions and Answers</h3>

                                        {interview.answers.map(
                                            (item, index) => (
                                                <div
                                                    className="history-answer"
                                                    key={item.id || index}
                                                >
                                                    <h4>
                                                        Question {index + 1}
                                                    </h4>
                                                    <p>
                                                        {item.question}
                                                    </p>

                                                    <h4>Your Answer</h4>
                                                    <p>
                                                        {item.answer ||
                                                            "No answer saved."}
                                                    </p>

                                                    <p>
                                                        Score:{" "}
                                                        {item.score ?? 0}
                                                    </p>

                                                    {item.feedback && (
                                                        <p>
                                                            Feedback:{" "}
                                                            {item.feedback}
                                                        </p>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default InterviewHistory;
