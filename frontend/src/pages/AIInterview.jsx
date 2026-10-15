

import { useState } from "react";
import "./AIInterview.css";

const API_BASE = "http://127.0.0.1:8000/api/interviews";

const TOTAL_QUESTIONS = 5;

function AIInterview() {
    const [role, setRole] = useState("Python Full Stack Developer");
    const [level, setLevel] = useState("Fresher");
    const [interviewType, setInterviewType] = useState("Technical");

    const [interviewId, setInterviewId] = useState(null);
    const [started, setStarted] = useState(false);
    const [finished, setFinished] = useState(false);

    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [previousQuestions, setPreviousQuestions] = useState([]);
    const [answer, setAnswer] = useState("");
    const [answers, setAnswers] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Send an authenticated request to the Django backend.
    async function apiRequest(endpoint, body) {
       const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access");

        if (!token) {
            throw new Error("Your login session has expired. Please log in again.");
        }

        const response = await fetch(`${API_BASE}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.detail ||
                `Request failed with status ${response.status}.`
            );
        }

        return data;
    }

    // Map the UI selection to the values accepted by the Interview model.
    function getDatabaseInterviewType() {
        if (interviewType === "Technical") return "Python";
        if (interviewType === "Behavioral") return "HR";
        return interviewType;
    }

    // Generate the next question with Ollama.
    async function generateNextQuestion(previous = previousQuestions) {
        const data = await apiRequest("generate-question/", {
            role,
            level,
            interview_type: interviewType,
            previous_questions: previous,
        });

        if (!data.question) {
            throw new Error("The AI did not return a question. Please try again.");
        }

        setCurrentQuestion({
            question: data.question,
            tip: data.tip || "",
        });

        setPreviousQuestions((oldQuestions) => [
            ...oldQuestions,
            data.question,
        ]);

        setAnswer("");
    }

    // Create the database record, then request the first AI question.
    async function startInterview() {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest("start/", {
                interview_type: getDatabaseInterviewType(),
                total_questions: TOTAL_QUESTIONS,
            });

            setInterviewId(data.id);
            setQuestionNumber(1);
            setPreviousQuestions([]);
            setAnswers([]);
            setAnswer("");
            setFinished(false);

            await generateNextQuestion([]);

            setStarted(true);
        } catch (err) {
            setError(err.message || "Could not start the interview.");
        } finally {
            setLoading(false);
        }
    }

    // Evaluate the answer and then move to the next question.
    async function submitAnswer() {
        if (!answer.trim() || !currentQuestion || loading) {
            return;
        }

        setLoading(true);
        setError("");

        const submittedAnswer = answer.trim();

        try {
            const evaluation = await apiRequest("evaluate-answer/", {
                interview_id: interviewId,
                role,
                level,
                interview_type: interviewType,
                question: currentQuestion.question,
                answer: submittedAnswer,
            });

            const result = {
                question: currentQuestion.question,
                answer: submittedAnswer,
                score: Number(evaluation.score ?? 0),
                strengths: Array.isArray(evaluation.strengths)
                    ? evaluation.strengths
                    : [],
                improvements: Array.isArray(evaluation.improvements)
                    ? evaluation.improvements
                    : [],
                sample_answer: evaluation.sample_answer || "",
            };

            const updatedAnswers = [...answers, result];
            setAnswers(updatedAnswers);

            if (questionNumber >= TOTAL_QUESTIONS) {
                setFinished(true);
                setStarted(false);
            } else {
                const nextNumber = questionNumber + 1;

                await generateNextQuestion(previousQuestions);
                setQuestionNumber(nextNumber);
            }
        } catch (err) {
            setError(err.message || "Could not evaluate your answer.");
        } finally {
            setLoading(false);
        }
    }

    function restartInterview() {
        setInterviewId(null);
        setStarted(false);
        setFinished(false);
        setCurrentQuestion(null);
        setQuestionNumber(0);
        setPreviousQuestions([]);
        setAnswers([]);
        setAnswer("");
        setError("");
    }

    const averageScore =
        answers.length > 0
            ? (
                answers.reduce((total, item) => total + item.score, 0) /
                answers.length
            ).toFixed(1)
            : "0.0";

    return (
        <div className="ai-interview-page">
            <header className="interview-header">
                <div>
                    <span className="interview-eyebrow">
                        NEXORA CAREER PLATFORM
                    </span>
                    <h1>AI Mock Interview</h1>
                    <p>
                        Practice with AI-generated questions and receive
                        feedback to improve your interview skills.
                    </p>
                </div>

                <div className="interview-icon">✦</div>
            </header>

            {error && (
                <div className="interview-note" role="alert">
                    <strong>Something went wrong</strong>
                    <p>{error}</p>
                    <p>
                        Check that Django and Ollama are running, and that
                        your interview API URLs are configured correctly.
                    </p>
                </div>
            )}

            {!started && !finished && (
                <section className="interview-setup">
                    <h2>Prepare for your interview</h2>

                    <p className="interview-muted">
                        Choose your preferences to begin an AI-powered session.
                    </p>

                    <div className="interview-form">
                        <label>
                            Target Job Role
                            <input
                                type="text"
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                                placeholder="e.g. Python Developer"
                            />
                        </label>

                        <label>
                            Experience Level
                            <select
                                value={level}
                                onChange={(event) => setLevel(event.target.value)}
                            >
                                <option value="Fresher">Fresher</option>
                                <option value="Entry Level">Entry Level</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Experienced">Experienced</option>
                            </select>
                        </label>

                        <label>
                            Interview Type
                            <select
                                value={interviewType}
                                onChange={(event) =>
                                    setInterviewType(event.target.value)
                                }
                            >
                                <option value="Technical">Technical</option>
                                <option value="HR">HR</option>
                                <option value="Behavioral">Behavioral</option>
                            </select>
                        </label>
                    </div>

                    <div className="interview-note">
                        <strong>How it works</strong>
                        <p>
                            You will answer {TOTAL_QUESTIONS} questions.
                            The AI will evaluate each answer and provide a
                            score, strengths, improvement suggestions, and
                            an example answer.
                        </p>
                    </div>

                    <button
                        className="interview-primary-button"
                        onClick={startInterview}
                        disabled={!role.trim() || loading}
                    >
                        {loading ? "Preparing interview..." : "Start Interview →"}
                    </button>
                </section>
            )}

            {started && !finished && currentQuestion && (
                <section className="interview-question-card">
                    <div className="question-top">
                        <span>{interviewType} Interview</span>
                        <span>
                            Question {questionNumber} of {TOTAL_QUESTIONS}
                        </span>
                    </div>

                    <div className="question-progress">
                        <div
                            style={{
                                width: `${
                                    (questionNumber / TOTAL_QUESTIONS) * 100
                                }%`,
                            }}
                        />
                    </div>

                    <p className="question-role">
                        {role} · {level}
                    </p>

                    <h2>{currentQuestion.question}</h2>

                    {currentQuestion.tip && (
                        <div className="question-tip">
                            <strong>Preparation tip</strong>
                            <p>{currentQuestion.tip}</p>
                        </div>
                    )}

                    <label
                        className="answer-label"
                        htmlFor="interview-answer"
                    >
                        Your Answer
                    </label>

                    <textarea
                        id="interview-answer"
                        rows="7"
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                        placeholder="Explain your answer clearly. Include an example when possible."
                        disabled={loading}
                    />

                    <div className="question-actions">
                        <button
                            className="interview-secondary-button"
                            onClick={restartInterview}
                            disabled={loading}
                        >
                            End Practice
                        </button>

                        <button
                            className="interview-primary-button"
                            onClick={submitAnswer}
                            disabled={!answer.trim() || loading}
                        >
                            {loading
                                ? "Evaluating..."
                                : questionNumber === TOTAL_QUESTIONS
                                    ? "Evaluate & Finish"
                                    : "Evaluate & Next →"}
                        </button>
                    </div>
                </section>
            )}

            {finished && (
                <section className="interview-results">
                    <div className="result-icon">✓</div>

                    <h2>Interview Completed!</h2>

                    <p>
                        You completed the {interviewType.toLowerCase()} interview
                        for {role}.
                    </p>

                    <div className="result-summary">
                        <strong>{averageScore}/10</strong>
                        <span>Average AI evaluation score</span>
                    </div>

                    <div className="result-summary">
                        <strong>{answers.length}</strong>
                        <span>Answers evaluated</span>
                    </div>

                    <h3>Your Feedback</h3>

                    {answers.map((item, index) => (
                        <article className="answer-review" key={index}>
                            <h4>
                                {index + 1}. {item.question}
                            </h4>

                            <p>
                                <strong>Your answer:</strong> {item.answer}
                            </p>

                            <p>
                                <strong>AI score:</strong> {item.score}/10
                            </p>

                            {item.strengths.length > 0 && (
                                <>
                                    <h4>Strengths</h4>
                                    <ul>
                                        {item.strengths.map((strength, i) => (
                                            <li key={i}>{strength}</li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {item.improvements.length > 0 && (
                                <>
                                    <h4>Areas to improve</h4>
                                    <ul>
                                        {item.improvements.map((improvement, i) => (
                                            <li key={i}>{improvement}</li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {item.sample_answer && (
                                <>
                                    <h4>Example of a stronger answer</h4>
                                    <p>{item.sample_answer}</p>
                                </>
                            )}
                        </article>
                    ))}

                    <p className="interview-muted">
                        AI scores are practice feedback, not a guarantee of
                        performance in a real interview.
                    </p>

                    <button
                        className="interview-primary-button"
                        onClick={restartInterview}
                    >
                        Start Another Interview
                    </button>
                </section>
            )}
        </div>
    );
}

export default AIInterview;
