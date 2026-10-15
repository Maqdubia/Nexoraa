
import { useState } from "react";
import {
    createInterview,
    submitInterviewAnswer,
} from "../services/api";
import "../styles/InterviewPractice.css";

const questionBank = {
    Python: [
        "What is the difference between a list and a tuple?",
        "What is a Python dictionary?",
        "What is the difference between == and is?",
        "What are functions in Python?",
        "What is exception handling?",
    ],
    React: [
        "What is React?",
        "What is the difference between props and state?",
        "What is a React component?",
        "What is the useState hook?",
        "Why do we use keys in lists?",
    ],
    SQL: [
        "What is SQL?",
        "What is the difference between WHERE and HAVING?",
        "What is a primary key?",
        "What is the difference between DELETE and DROP?",
        "What is a JOIN?",
    ],
    HR: [
        "Tell me about yourself.",
        "Why should we hire you?",
        "What are your strengths?",
        "Describe a challenge you solved.",
        "Where do you see yourself in five years?",
    ],
};

function InterviewPractice() {
    const [interviewType, setInterviewType] = useState("Python");
    const [questions, setQuestions] = useState(questionBank.Python);
    const [answers, setAnswers] = useState(["", "", "", "", ""]);
    const [interviewId, setInterviewId] = useState(null);
    const [savedAnswers, setSavedAnswers] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(0);
    const [error, setError] = useState("");
    const [isStarted, setIsStarted] = useState(false);

    const startInterview = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await createInterview(interviewType);

            setInterviewId(data.id);
            setQuestions(questionBank[interviewType]);
            setAnswers(["", "", "", "", ""]);
            setSavedAnswers([]);
            setSubmitted(false);
            setScore(0);
            setIsStarted(true);
        } catch (err) {
            console.error("Could not create interview:", err);

            setError(
                err.response?.data?.detail ||
                "Could not start the interview. Please check your login and backend."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = (event) => {
        setInterviewType(event.target.value);
        setQuestions(questionBank[event.target.value]);
        setAnswers(["", "", "", "", ""]);
    };

    const handleAnswerChange = (index, value) => {
        setAnswers((previous) =>
            previous.map((answer, i) =>
                i === index ? value : answer
            )
        );
    };

    const submitInterview = async () => {
        if (!interviewId) {
            setError("Please start an interview first.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const results = [];

            // Save each answer to Django, one at a time.
            for (let i = 0; i < questions.length; i++) {
                const result = await submitInterviewAnswer(
                    interviewId,
                    questions[i],
                    answers[i]
                );

                results.push(result);
            }

            setSavedAnswers(results);

            const totalScore = results.reduce(
                (total, answer) => total + (answer.score || 0),
                0
            );

            setScore(totalScore);
            setSubmitted(true);
        } catch (err) {
            console.error("Could not save interview answers:", err);

            setError(
                err.response?.data?.detail ||
                "Could not save all answers. Please check the backend and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="interview-page">
            <div className="interview-header">
                <p className="interview-label">
                    NEXORA CAREER TOOLS
                </p>

                <h1>AI Interview Practice</h1>

                <p>
                    Practice common interview questions and improve
                    your confidence.
                </p>
            </div>

            <div className="interview-card">
                <label htmlFor="interviewType">
                    Choose your interview type
                </label>

                <select
                    id="interviewType"
                    value={interviewType}
                    disabled={isStarted && !submitted}
                    onChange={handleTypeChange}
                >
                    {Object.keys(questionBank).map((type) => (
                        <option key={type} value={type}>
                            {type} Interview
                        </option>
                    ))}
                </select>

                {!isStarted || submitted ? (
                    <button
                        className="start-button"
                        onClick={startInterview}
                        disabled={loading}
                    >
                        {loading
                            ? "Starting..."
                            : submitted
                            ? "Start New Interview"
                            : "Start Interview"}
                    </button>
                ) : (
                    <p>Interview started. Answer all five questions below.</p>
                )}
            </div>

            {error && (
                <div className="interview-result" role="alert">
                    <p>{error}</p>
                </div>
            )}

            <div className="questions-list">
                {questions.map((question, index) => (
                    <div
                        className="question-card"
                        key={`${interviewType}-${index}`}
                    >
                        <h3>Question {index + 1}</h3>

                        <p>{question}</p>

                        <textarea
                            rows="4"
                            placeholder={
                                isStarted
                                    ? "Type your answer here..."
                                    : "Start the interview to enter your answer."
                            }
                            value={answers[index]}
                            disabled={!isStarted || submitted || loading}
                            onChange={(event) =>
                                handleAnswerChange(
                                    index,
                                    event.target.value
                                )
                            }
                        />

                        {submitted && savedAnswers[index] && (
                            <p>
                                <strong>Feedback:</strong>{" "}
                                {savedAnswers[index].feedback}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {isStarted && !submitted && (
                <button
                    className="submit-button"
                    onClick={submitInterview}
                    disabled={loading}
                >
                    {loading ? "Saving Answers..." : "Submit Answers"}
                </button>
            )}

            {submitted && (
                <div className="interview-result">
                    <h2>Practice Summary</h2>

                    <p>
                        Your saved score: {score} out of {questions.length}.
                    </p>

                    <p>
                        Each answer currently receives a basic score
                        based on its length. This is not an AI assessment
                        of correctness.
                    </p>

                    <button
                        className="start-button"
                        onClick={startInterview}
                        disabled={loading}
                    >
                        Practice Again
                    </button>
                </div>
            )}
        </div>
    );
}

export default InterviewPractice;
