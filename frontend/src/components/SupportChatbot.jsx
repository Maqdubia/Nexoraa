
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./SupportChatbot.css";

const API_URL = "/api/chatbot/";

const categories = [
    { id: "account", name: "Account & Login", issues: ["Unable to create an account", "Unable to log in", "Account not found", "Incorrect password", "Other account issue"] },
    { id: "verification", name: "OTP & Verification", issues: ["OTP not received", "Invalid OTP", "OTP verification failed", "Verification link not working", "Other verification issue"] },
    { id: "resume", name: "Resume & ATS", issues: ["Unable to upload resume", "Resume upload failed", "ATS score not generating", "Resume analysis incorrect", "Other resume issue"] },
    { id: "jobs", name: "Jobs & Applications", issues: ["Jobs are not loading", "Unable to apply for a job", "Apply button not working", "Application status not updating", "Other job issue"] },
    { id: "interview", name: "Interview Practice", issues: ["Unable to start an interview", "Questions are not generating", "Unable to submit an answer", "Interview feedback not showing", "Other interview issue"] },
    { id: "profile", name: "Profile & Settings", issues: ["Unable to update profile", "Profile picture not uploading", "Education details not saving", "Skills not updating", "Other profile issue"] },
    { id: "technical", name: "Technical Issues", issues: ["Website not loading", "Page displaying an error", "Button or feature not working", "Website running slowly", "Other technical problem"] },
    { id: "other", name: "Other Issues", issues: ["General website question", "Feature assistance", "Other issue not listed"] },
];

function SupportChatbot() {
    const messagesEndRef = useRef(null);

useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
    });
}, [messages, loading]);
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

    const addMessage = (sender, text, type = "text") => {
        setMessages((prev) => [...prev, { sender, text, type }]);
    };

    const chooseCategory = (category) => {
        setSelectedCategory(category);
        addMessage("user", category.name);
        addMessage("bot", "Please select the issue you're experiencing:", "issues");
    };

    const chooseIssue = (selectedIssue) => {
        setIssue(selectedIssue);
        addMessage("user", selectedIssue);

        if (selectedIssue.toLowerCase().startsWith("other")) {
            setNeedsDescription(true);
            addMessage("bot", "Please describe your issue in the message box.");
            return;
        }

        sendToAI(selectedIssue);
    };

    const sendToAI = async (message) => {
        setLoading(true);
        addMessage("bot", "Let me check that for you...", "loading");

        try {
            const response = await axios.post(`${API_URL}chat/`, {
                message: `Nexora support category: ${selectedCategory?.name || "General"}.
Selected issue: ${message}`,
            });

            setMessages((prev) => [
                ...prev.filter((item) => item.type !== "loading"),
                { sender: "bot", text: response.data.reply },
                { sender: "bot", text: "Did this resolve your issue?", type: "resolution" },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev.filter((item) => item.type !== "loading"),
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
                addMessage("bot", "Thank you. Now enter your email address.");
                return;
            }

            if (!email.trim()) {
                setEmail(message);
                addMessage("bot", "Now describe your issue so our support team can help.");
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
        addMessage("bot", "Let's create a support ticket. First, please enter your name.");
    };

    const createTicket = async (description) => {
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}tickets/`, {
                customer_name: customerName,
                email,
                category: selectedCategory?.id || "other",
                issue: issue || "Other issue not listed",
                description,
            });

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
        addMessage("user", resolved ? "Yes, resolved" : "No, still need help");

        if (resolved) {
            addMessage("bot", "Glad I could help! Thank you for using Nexora Support.");
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
    };

    return (
        <>
            <button
                className={`support-chat-toggle ${isOpen ? "chat-is-open" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close Nexora support chat" : "Open Nexora support chat"}
            >
                {isOpen ? (
                    <span className="chat-close-icon">×</span>
                ) : (
                    <svg viewBox="0 0 100 100" className="nexora-robot">
                        <path d="M50 15 V8" stroke="#E8EBCF" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="50" cy="6" r="4" fill="#E8DFA5" className="robot-light" />

                        <rect x="20" y="23" width="60" height="48" rx="17" fill="#E9EBD9" />

                        <rect x="13" y="39" width="9" height="19" rx="4" fill="#A8B79A" />
                        <rect x="78" y="39" width="9" height="19" rx="4" fill="#A8B79A" />

                        <rect x="27" y="31" width="46" height="32" rx="11" fill="#35463B" />

                        <g className="robot-eyes" fill="none" stroke="#F4F5E9" strokeWidth="3" strokeLinecap="round">
                            <path d="M36 43 Q41 37 46 43" />
                            <path d="M54 43 Q59 37 64 43" />
                        </g>

                        <path d="M35 70 Q50 65 65 70 L70 86 Q50 94 30 86 Z" fill="#DDE4CF" />

                        <path
                            d="M50 75 Q62 70 59 81 Q53 86 47 81 Q45 77 50 75Z"
                            fill="none"
                            stroke="#647B5D"
                            strokeWidth="2"
                        />
                        <path d="M48 83 L57 75" stroke="#647B5D" strokeWidth="1.5" />

                        <g className="robot-wave" stroke="#A8B79A" strokeWidth="5" strokeLinecap="round" fill="none">
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
                            <button onClick={resetChat} title="New chat">↻</button>
                            <button onClick={() => setIsOpen(false)} title="Close">×</button>
                        </div>
                    </header>

                    <div className="support-chat-messages">
                        {messages.map((message, index) => (
                            <div key={index} className={`support-message ${message.sender}`}>
                                <div className="support-message-bubble">
                                    {message.text}
                                </div>

                                {message.type === "welcome" && (
                                    <div className="support-options">
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => chooseCategory(category)}
                                            >
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {message.type === "issues" && selectedCategory && (
                                    <div className="support-options">
                                        {selectedCategory.issues.map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => chooseIssue(item)}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {message.type === "resolution" && (
                                    <div className="support-action-buttons">
                                        <button onClick={() => handleResolution(true)}>
                                            Yes, resolved
                                        </button>
                                        <button onClick={() => handleResolution(false)}>
                                            No, need help
                                        </button>
                                    </div>
                                )}

                                {message.type === "ticketPrompt" && (
                                    <div className="support-action-buttons">
                                        <button onClick={startTicket}>
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
                    </div>
                    <div ref={messagesEndRef} />
                    <form
                        className="support-chat-input"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSend();
                        }}
                    >
                        <input
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
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

                        <button type="submit" disabled={loading || !input.trim()}>
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
