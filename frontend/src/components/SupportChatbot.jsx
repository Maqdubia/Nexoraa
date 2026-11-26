
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./SupportChatbot.css";

const API_URL = "/api/chatbot/";
const feedbackReasons = {
    positive: [
        { value: "helpful", label: "Helpful" },
        { value: "clear", label: "Clear" },
        { value: "accurate", label: "Accurate" },
        { value: "solved_issue", label: "Solved my issue" },
    ],
    negative: [
        { value: "incorrect", label: "Incorrect" },
        { value: "not_relevant", label: "Not relevant" },
        { value: "incomplete", label: "Incomplete" },
        { value: "unclear", label: "Unclear" },
    ],
};
const categories = [
    {
        id: "account",
        name: "Account & Login",
        issues: [
            "Unable to create an account",
            "Unable to log in",
            "Account not found",
            "Incorrect password",
            "Other account issue",
        ],
    },
    {
        id: "verification",
        name: "OTP & Verification",
        issues: [
            "OTP not received",
            "Invalid OTP",
            "OTP verification failed",
            "Verification link not working",
            "Other verification issue",
        ],
    },
    {
        id: "resume",
        name: "Resume & ATS",
        issues: [
            "Unable to upload resume",
            "Resume upload failed",
            "ATS score not generating",
            "Resume analysis incorrect",
            "Other resume issue",
        ],
    },
    {
        id: "jobs",
        name: "Jobs & Applications",
        issues: [
            "Jobs are not loading",
            "Unable to apply for a job",
            "Apply button not working",
            "Application status not updating",
            "Other job issue",
        ],
    },
    {
        id: "interview",
        name: "Interview Practice",
        issues: [
            "Unable to start an interview",
            "Questions are not generating",
            "Unable to submit an answer",
            "Interview feedback not showing",
            "Other interview issue",
        ],
    },
    {
        id: "profile",
        name: "Profile & Settings",
        issues: [
            "Unable to update profile",
            "Profile picture not uploading",
            "Education details not saving",
            "Skills not updating",
            "Other profile issue",
        ],
    },
    {
        id: "technical",
        name: "Technical Issues",
        issues: [
            "Website not loading",
            "Page displaying an error",
            "Button or feature not working",
            "Website running slowly",
            "Other technical problem",
        ],
    },
    {
        id: "other",
        name: "Other Issues",
        issues: [
            "General website question",
            "Feature assistance",
            "Other issue not listed",
        ],
    },
];

function SupportChatbot() {
    const messagesEndRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);

    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Welcome to Nexora Support! How can I help you today?",
            type: "welcome",
        },
    ]);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [needsDescription, setNeedsDescription] = useState(false);
    const [ticketMode, setTicketMode] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [email, setEmail] = useState("");
    const [issue, setIssue] = useState("");
    const recognitionRef = useRef(null);
const speechBaseTextRef = useRef("");
const [isListening, setIsListening] = useState(false);
const [speechError, setSpeechError] = useState("");
const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
const speechUtteranceRef = useRef(null);

const [feedbackOpenFor, setFeedbackOpenFor] = useState(null);
const [feedbackRatings, setFeedbackRatings] = useState({});
const [feedbackReasonsByMessage, setFeedbackReasonsByMessage] = useState({});
const [feedbackSubmittingFor, setFeedbackSubmittingFor] = useState(null);
const [feedbackSubmittedFor, setFeedbackSubmittedFor] = useState({});
const [feedbackErrors, setFeedbackErrors] = useState({});
const stopVoiceInput = () => {
    const recognition = recognitionRef.current;

    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.warn("Voice input could not stop:", error);
        }

        recognitionRef.current = null;
    }

    setIsListening(false);
};

const handleVoiceInput = () => {
    if (isListening) {
        stopVoiceInput();
        return;
    }

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        setSpeechError(
            "Voice input is not supported here. Please try Google Chrome."
        );
        return;
    }

    if (!window.isSecureContext) {
        setSpeechError("Voice input requires a secure HTTPS connection.");
        return;
    }

    setSpeechError("");
    speechBaseTextRef.current = input;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        setIsListening(true);
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0]?.transcript || "")
            .join(" ")
            .trim();

        const base = speechBaseTextRef.current.trimEnd();

        setInput([base, transcript].filter(Boolean).join(" "));
    };

    recognition.onerror = (event) => {
        setIsListening(false);

        const errors = {
            "not-allowed": "Please allow microphone access for Nexora.",
            "audio-capture": "No microphone was found.",
            "no-speech": "No speech detected. Please try again.",
            network: "Voice input needs an internet connection.",
            "service-not-allowed": "Speech recognition service unavailable.",
        };

        if (event.error !== "aborted") {
            setSpeechError(
                errors[event.error] || "Voice input failed. Please try again."
            );
        }
    };

    recognition.onend = () => {
        setIsListening(false);

        if (recognitionRef.current === recognition) {
            recognitionRef.current = null;
        }
    };

    recognitionRef.current = recognition;

    try {
        recognition.start();
    } catch (error) {
        recognitionRef.current = null;
        setIsListening(false);
        setSpeechError("Could not start the microphone. Try again.");
    }
};
const stopSpeechOutput = () => {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    speechUtteranceRef.current = null;
    setSpeakingMessageIndex(null);
};

const handleSpeakMessage = (text, index) => {
    if (
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window)
    ) {
        setSpeechError("Read-aloud is not supported in this browser.");
        return;
    }

    if (speakingMessageIndex === index) {
        stopSpeechOutput();
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const englishVoice =
        voices.find((voice) => /^en-IN$/i.test(voice.lang)) ||
        voices.find((voice) => /^en-GB$/i.test(voice.lang)) ||
        voices.find((voice) => /^en-US$/i.test(voice.lang)) ||
        voices.find((voice) => /^en/i.test(voice.lang));

    if (englishVoice) {
        utterance.voice = englishVoice;
        utterance.lang = englishVoice.lang;
    } else {
        utterance.lang = "en-IN";
    }

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => {
        if (speechUtteranceRef.current === utterance) {
            speechUtteranceRef.current = null;
            setSpeakingMessageIndex(null);
        }
    };

    utterance.onerror = () => {
        if (speechUtteranceRef.current === utterance) {
            speechUtteranceRef.current = null;
            setSpeakingMessageIndex(null);
            setSpeechError("Could not play the voice response.");
        }
    };

    speechUtteranceRef.current = utterance;
    setSpeechError("");
    setSpeakingMessageIndex(index);

    window.speechSynthesis.speak(utterance);
};

const handleFeedbackRating = (index, rating) => {
    setFeedbackOpenFor(index);

    setFeedbackRatings((previous) => ({
        ...previous,
        [index]: rating,
    }));

    setFeedbackReasonsByMessage((previous) => ({
        ...previous,
        [index]: "",
    }));

    setFeedbackErrors((previous) => ({
        ...previous,
        [index]: "",
    }));
};

const submitFeedback = async (index) => {
    const rating = feedbackRatings[index];
    const reason = feedbackReasonsByMessage[index];

    if (!rating || !reason || feedbackSubmittingFor !== null) {
        return;
    }

    setFeedbackSubmittingFor(index);

    try {
        await axios.post(`${API_URL}feedback/`, {
            rating,
            reason,
            category: selectedCategory?.id || "other",
        });

        setFeedbackSubmittedFor((previous) => ({
            ...previous,
            [index]: true,
        }));

        setFeedbackOpenFor(null);
    } catch (error) {
        setFeedbackErrors((previous) => ({
            ...previous,
            [index]: "Feedback could not be sent. Please try again.",
        }));
    } finally {
        setFeedbackSubmittingFor(null);
    }
};
useEffect(() => {
    if (!isOpen && recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
        setIsListening(false);
    }
}, [isOpen]);

useEffect(() => {
    return () => {
        recognitionRef.current?.abort();
    };
}, []);

    // Automatically scroll to the newest message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        }
    }, [messages, loading, isOpen]);

    const addMessage = (sender, text, type = "text") => {
        setMessages((prev) => [
            ...prev,
            { sender, text, type },
        ]);
    };

    const chooseCategory = (category) => {
        setSelectedCategory(category);
        setIssue("");

        addMessage("user", category.name);
        addMessage(
            "bot",
            "Please select the issue you're experiencing:",
            "issues"
        );
    };

    const chooseIssue = (selectedIssue) => {
        setIssue(selectedIssue);
        addMessage("user", selectedIssue);

        if (selectedIssue.toLowerCase().startsWith("other")) {
            setNeedsDescription(true);
            addMessage(
                "bot",
                "Please describe your issue in the message box."
            );
            return;
        }

        sendToAI(selectedIssue);
    };

    const sendToAI = async (message) => {
        setLoading(true);

        addMessage(
            "bot",
            "Let me check that for you...",
            "loading"
        );

        try {
            const response = await axios.post(
                `${API_URL}chat/`,
                {
                    message: `Nexora support category: ${
                        selectedCategory?.name || "General"
                    }.
Selected issue: ${message}`,
                }
            );

            setMessages((prev) => [
                ...prev.filter(
                    (item) => item.type !== "loading"
                ),
                {
    sender: "bot",
    text: response.data.reply,
    type: "ai-reply",
},
                {
                    sender: "bot",
                    text: "Did this resolve your issue?",
                    type: "resolution",
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev.filter(
                    (item) => item.type !== "loading"
                ),
                {
                    sender: "bot",
                    text: "I'm unable to connect right now. You can try again or create a support ticket.",
                },
                {
                    sender: "bot",
                    text: "Would you like to create a support ticket?",
                    type: "ticketPrompt",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        const message = input.trim();

        if (!message || loading) return;

        setInput("");
        addMessage("user", message);

        if (ticketMode) {
            if (!customerName.trim()) {
                setCustomerName(message);
                addMessage(
                    "bot",
                    "Thank you. Now enter your email address."
                );
                return;
            }

            if (!email.trim()) {
                setEmail(message);
                addMessage(
                    "bot",
                    "Now describe your issue so our support team can help."
                );
                return;
            }

            createTicket(message);
            return;
        }

        if (needsDescription) {
            setNeedsDescription(false);
            sendToAI(message);
            return;
        }

        sendToAI(message);
    };

    const startTicket = () => {
        setTicketMode(true);
        setCustomerName("");
        setEmail("");

        addMessage(
            "bot",
            "Let's create a support ticket. First, please enter your name."
        );
    };

    const createTicket = async (description) => {
        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}tickets/`,
                {
                    customer_name: customerName,
                    email,
                    category: selectedCategory?.id || "other",
                    issue: issue || "Other issue not listed",
                    description,
                }
            );

            addMessage(
                "bot",
                `Your support ticket has been created successfully. Reference ID: ${response.data.reference_id}`
            );

            setTicketMode(false);
        } catch (error) {
            addMessage(
                "bot",
                "I couldn't create your ticket. Please check your details and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResolution = (resolved) => {
        addMessage(
            "user",
            resolved ? "Yes, resolved" : "No, still need help"
        );

        if (resolved) {
            addMessage(
                "bot",
                "Glad I could help! Thank you for using Nexora Support."
            );
        } else {
            startTicket();
        }
    };

    const resetChat = () => {
        setMessages([
            {
                sender: "bot",
                text: "Welcome to Nexora Support! How can I help you today?",
                type: "welcome",
            },
        ]);

        setSelectedCategory(null);
        setIssue("");
        setNeedsDescription(false);
        setTicketMode(false);
        setCustomerName("");
        setEmail("");
        setInput("");
        setLoading(false);stopSpeechOutput();
setFeedbackOpenFor(null);
setFeedbackRatings({});
setFeedbackReasonsByMessage({});
setFeedbackSubmittingFor(null);
setFeedbackSubmittedFor({});
setFeedbackErrors({});
    };

    return (
        <>
            <button
                className={`support-chat-toggle ${
                    isOpen ? "chat-is-open" : ""
                }`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={
                    isOpen
                        ? "Close Nexora support chat"
                        : "Open Nexora support chat"
                }
            >
                {isOpen ? (
                    <span className="chat-close-icon">×</span>
                ) : (
                    <svg
                        viewBox="0 0 100 100"
                        className="nexora-robot"
                    >
                        <path
                            d="M50 15 V8"
                            stroke="#E8EBCF"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />

                        <circle
                            cx="50"
                            cy="6"
                            r="4"
                            fill="#E8DFA5"
                            className="robot-light"
                        />

                        <rect
                            x="20"
                            y="23"
                            width="60"
                            height="48"
                            rx="17"
                            fill="#E9EBD9"
                        />

                        <rect
                            x="13"
                            y="39"
                            width="9"
                            height="19"
                            rx="4"
                            fill="#A8B79A"
                        />

                        <rect
                            x="78"
                            y="39"
                            width="9"
                            height="19"
                            rx="4"
                            fill="#A8B79A"
                        />

                        <rect
                            x="27"
                            y="31"
                            width="46"
                            height="32"
                            rx="11"
                            fill="#35463B"
                        />

                        <g
                            className="robot-eyes"
                            fill="none"
                            stroke="#F4F5E9"
                            strokeWidth="3"
                            strokeLinecap="round"
                        >
                            <path d="M36 43 Q41 37 46 43" />
                            <path d="M54 43 Q59 37 64 43" />
                        </g>

                        <path
                            d="M35 70 Q50 65 65 70 L70 86 Q50 94 30 86 Z"
                            fill="#DDE4CF"
                        />

                        <path
                            d="M50 75 Q62 70 59 81 Q53 86 47 81 Q45 77 50 75Z"
                            fill="none"
                            stroke="#647B5D"
                            strokeWidth="2"
                        />

                        <path
                            d="M48 83 L57 75"
                            stroke="#647B5D"
                            strokeWidth="1.5"
                        />

                        <g
                            className="robot-wave"
                            stroke="#A8B79A"
                            strokeWidth="5"
                            strokeLinecap="round"
                            fill="none"
                        >
                            <path d="M31 74 L22 64 L17 51" />
                            <path d="M17 51 L12 44" />
                        </g>
                    </svg>
                )}
            </button>

            {isOpen && (
                <section className="support-chat-window">
                    <header className="support-chat-header">
                        <div>
                            <strong>Nexora Support</strong>
                            <span>● Online Support Assistant</span>
                        </div>

                        <div className="support-header-actions">
                            <button
                                onClick={resetChat}
                                title="New chat"
                                type="button"
                            >
                                ↻
                            </button>

                            <button
                                onClick={() => setIsOpen(false)}
                                title="Close"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                    </header>

                    <div className="support-chat-messages">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`support-message ${message.sender}`}
                            >
                                <div className="support-message-bubble">
                                    {message.text}
                                <div className="support-message-tools">
    <button
        type="button"
        className={
            "support-speak-button" +
            (speakingMessageIndex === index ? " is-speaking" : "")
        }
        onClick={() => handleSpeakMessage(message.text, index)}
        aria-label={
            speakingMessageIndex === index
                ? "Stop reading response"
                : "Read response aloud"
        }
    >
        {speakingMessageIndex === index ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
        ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 10v4h3l5 4V6l-5 4H4z" />
                <path d="M16 9a5 5 0 0 1 0 6" />
                <path d="M18.5 6.5a9 9 0 0 1 0 11" />
            </svg>
        )}
        <span>
            {speakingMessageIndex === index ? "Stop" : "Listen"}
        </span>
    </button>

    <div className="support-feedback">
        <span>Was this helpful?</span>

        <div className="support-feedback-rating">
            <button
                type="button"
                className={feedbackRatings[index] === "positive" ? "is-selected" : ""}
                onClick={() => handleFeedbackRating(index, "positive")}
                disabled={Boolean(feedbackSubmittedFor[index])}
                aria-label="Thumbs up"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3z" />
                    <path d="M7 10l5-8c2 0 3 1 3 3l-1 5h5a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7z" />
                </svg>
            </button>

            <button
                type="button"
                className={feedbackRatings[index] === "negative" ? "is-selected" : ""}
                onClick={() => handleFeedbackRating(index, "negative")}
                disabled={Boolean(feedbackSubmittedFor[index])}
                aria-label="Thumbs down"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <g transform="rotate(180 12 12)">
                        <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3z" />
                        <path d="M7 10l5-8c2 0 3 1 3 3l-1 5h5a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7z" />
                    </g>
                </svg>
            </button>
        </div>
    </div>
</div>
            {feedbackOpenFor === index &&
                !feedbackSubmittedFor[index] && (
                    <div className="support-feedback-panel">
                        <strong>
                            {feedbackRatings[index] === "positive"
                                ? "What worked well?"
                                : "What could be improved?"}
                        </strong>

                        {feedbackReasons[feedbackRatings[index]].map(
                            (reason) => (
                                <button
                                    key={reason.value}
                                    type="button"
                                    className={
                                        feedbackReasonsByMessage[index] ===
                                        reason.value
                                            ? "is-selected"
                                            : ""
                                    }
                                    onClick={() =>
                                        setFeedbackReasonsByMessage(
                                            (previous) => ({
                                                ...previous,
                                                [index]: reason.value,
                                            })
                                        )
                                    }
                                >
                                    {reason.label}
                                </button>
                            )
                        )}

                        {feedbackErrors[index] && (
                            <p>{feedbackErrors[index]}</p>
                        )}

                        <button
                            type="button"
                            onClick={() => submitFeedback(index)}
                            disabled={
                                !feedbackReasonsByMessage[index] ||
                                feedbackSubmittingFor === index
                            }
                        >
                            {feedbackSubmittingFor === index
                                ? "Sending..."
                                : "Submit feedback"}
                        </button>
                    </div>
                )}

            {feedbackSubmittedFor[index] && (
                <small>Thank you for your feedback!</small>
            )}
        </>
    )}
                                {message.type === "welcome" && (
                                    <div className="support-options">
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() =>
                                                    chooseCategory(category)
                                                }
                                                type="button"
                                            >
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {message.type === "issues" &&
                                    selectedCategory && (
                                        <div className="support-options">
                                            {selectedCategory.issues.map(
                                                (item) => (
                                                    <button
                                                        key={item}
                                                        onClick={() =>
                                                            chooseIssue(item)
                                                        }
                                                        type="button"
                                                    >
                                                        {item}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}

                                {message.type === "resolution" && (
                                    <div className="support-action-buttons">
                                        <button
                                            onClick={() =>
                                                handleResolution(true)
                                            }
                                            type="button"
                                        >
                                            Yes, resolved
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleResolution(false)
                                            }
                                            type="button"
                                        >
                                            No, need help
                                        </button>
                                    </div>
                                )}

                                {message.type === "ticketPrompt" && (
                                    <div className="support-action-buttons">
                                        <button
                                            onClick={startTicket}
                                            type="button"
                                        >
                                            Create support ticket
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="support-typing">
                                Nexora is typing...
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                    <div className="support-chat-voice-status" role="status" aria-live="polite">
    {isListening
        ? "Listening... speak now."
        : speechError}
</div>
                    <form
                        className="support-chat-input"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSend();
                        }}
                    >
                        <input
                            value={input}
                            onChange={(event) =>
                                setInput(event.target.value)
                            }
                            placeholder={
                                ticketMode
                                    ? !customerName
                                        ? "Enter your name..."
                                        : !email
                                            ? "Enter your email..."
                                            : "Describe your issue..."
                                    : "Type your message..."
                            }
                            disabled={loading}
                        />

                       
<button
    type="button"
    className={
        "support-chat-mic-button" +
        (isListening ? " is-listening" : "")
    }
    onClick={handleVoiceInput}
    disabled={loading}
    aria-label={isListening ? "Stop voice input" : "Start voice input"}
    title={isListening ? "Stop voice input" : "Speak to Nexora"}
    aria-pressed={isListening}
>
    <svg
        viewBox="0 0 24 24"
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <path d="M12 17v5" />
        <path d="M8 22h8" />
    </svg>
</button>

<button
    type="submit"
    disabled={loading || !input.trim()}
>
    ➤
</button>

                    </form>

                    <footer className="support-chat-footer">
                        Powered by Nexora Support
                    </footer>
                </section>
            )}
        </>
    );
}

export default SupportChatbot;

