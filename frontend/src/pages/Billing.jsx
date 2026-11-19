
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Billing.css";

const PLAN_CATALOG = {
    student: [
        {
            id: "student-free",
            name: "Student Free",
            description: "Core Nexora career platform access.",
            amount: 0,
            billing: "Free forever",
            features: [
                "Access to the student workspace",
                "Explore available jobs",
                "Maintain your career profile",
            ],
            free: true,
        },
        {
            id: "student-starter",
            name: "Student Starter",
            description: "Monthly Starter membership for Nexora students.",
            amount: 499,
            billing: "per month",
            link: "https://rzp.io/rzp/PA73tGQ",
            features: [
                "Starter membership",
                "Monthly recurring billing",
            ],
        },
        {
            id: "student-pro",
            name: "Student Pro",
            description: "Annual Pro membership for Nexora students.",
            amount: 5739,
            billing: "per year",
            link: "https://rzp.io/rzp/di02cbs",
            popular: true,
            features: [
                "Pro membership",
                "Annual recurring billing",
            ],
        },
    ],
    recruiter: [
        {
            id: "recruiter-free",
            name: "Recruiter Free",
            description: "Core Nexora recruiter workspace access.",
            amount: 0,
            billing: "Free",
            features: [
                "Access to the recruiter workspace",
                "Explore the hiring dashboard",
            ],
            free: true,
        },
        {
            id: "recruiter-starter",
            name: "Recruiter Starter",
            description: "Monthly Starter membership for Nexora recruiters.",
            amount: 499,
            billing: "per month",
            link: "https://rzp.io/rzp/KgN01bO",
            features: [
                "Starter recruiter membership",
                "Monthly recurring billing",
            ],
        },
        {
            id: "recruiter-pro",
            name: "Recruiter Pro",
            description: "Annual Pro membership for Nexora recruiters.",
            amount: 5739,
            billing: "per year",
            link: "https://rzp.io/rzp/tqRSLjk8",
            popular: true,
            features: [
                "Pro recruiter membership",
                "Annual recurring billing",
            ],
        },
    ],
};

function getAccessToken() {
    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        ""
    );
}

async function apiRequest(path) {
    const token = getAccessToken();

    const response = await fetch(`/api/${path}`, {
        headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.detail || `Request failed (${response.status}).`
        );
    }

    return data;
}

function formatPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function Billing() {
    const navigate = useNavigate();

    const [role, setRole] = useState("");
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [historyError, setHistoryError] = useState("");

    const loadBillingData = useCallback(async () => {
        setLoading(true);
        setError("");
        setHistoryError("");

        try {
            const user = await apiRequest("auth/me/");

            if (!["student", "recruiter"].includes(user.role)) {
                throw new Error(
                    "Billing is available to student and recruiter accounts only."
                );
            }

            setRole(user.role);

            try {
                const data = await apiRequest(
                    "billing/subscriptions/me/"
                );

                setSubscriptions(
                    Array.isArray(data) ? data : []
                );
            } catch (err) {
                setHistoryError(
                    "Your subscription history is temporarily unavailable."
                );
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBillingData();
    }, [loadBillingData]);

    const continueFree = () => {
        navigate(
            role === "recruiter" ? "/hr/dashboard" : "/dashboard"
        );
    };

    if (loading) {
        return (
            <main className="billing-page">
                <div className="billing-container">
                    <div className="billing-loading">
                        Loading your Nexora plans...
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="billing-page">
                <div className="billing-container">
                    <div className="billing-alert billing-alert-error">
                        {error}
                    </div>
                    <button
                        type="button"
                        className="billing-refresh-button"
                        onClick={loadBillingData}
                    >
                        Try again
                    </button>
                </div>
            </main>
        );
    }

    const plans = PLAN_CATALOG[role] || [];

    return (
        <main className="billing-page">
            <div className="billing-container">
                <header className="billing-header">
                    <div>
                        <p className="billing-eyebrow">
                            NEXORA MEMBERSHIP
                        </p>

                        <h1>Choose your plan</h1>

                        <p className="billing-subtitle">
                            {role === "recruiter"
                                ? "Choose a membership for your recruitment journey."
                                : "Choose a membership for your career journey."}
                        </p>
                    </div>

                    <span className="billing-test-badge">
                        RAZORPAY TEST MODE
                    </span>
                </header>

                <section className="billing-plans">
                    {plans.map((plan) => (
                        <article
                            className={`billing-card ${
                                plan.popular ? "billing-card-popular" : ""
                            }`}
                            key={plan.id}
                        >
                            {plan.popular && (
                                <span className="billing-popular-label">
                                    PRO PLAN
                                </span>
                            )}

                            {plan.free && (
                                <span className="billing-free-label">
                                    FREE ACCESS
                                </span>
                            )}

                            <p className="billing-plan-cycle">
                                {plan.billing}
                            </p>

                            <h2>{plan.name}</h2>

                            <div className="billing-price">
                                {formatPrice(plan.amount)}
                                <span>
                                    {plan.amount > 0
                                        ? ` / ${plan.billing}`
                                        : ""}
                                </span>
                            </div>

                            <p className="billing-plan-description">
                                {plan.description}
                            </p>

                            <ul className="billing-features">
                                {plan.features.map((feature) => (
                                    <li key={feature}>
                                        <span aria-hidden="true">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {plan.free ? (
                                <button
                                    type="button"
                                    className="billing-button billing-button-free"
                                    onClick={continueFree}
                                >
                                    Continue with Free
                                </button>
                            ) : (
                                <a
                                    className="billing-button"
                                    href={plan.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Continue to Razorpay
                                </a>
                            )}

                            {plan.amount > 0 && (
                                <p className="billing-secure-note">
                                    Recurring subscription · Razorpay checkout
                                </p>
                            )}
                        </article>
                    ))}
                </section>

                <section className="billing-history">
                    <div className="billing-history-heading">
                        <div>
                            <h2>Your subscriptions</h2>
                            <p>
                                Subscription records currently associated
                                with your Nexora account.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="billing-refresh-button"
                            onClick={loadBillingData}
                        >
                            Refresh
                        </button>
                    </div>

                    {historyError ? (
                        <p className="billing-muted">
                            {historyError}
                        </p>
                    ) : subscriptions.length === 0 ? (
                        <p className="billing-muted">
                            No subscription records are linked to this
                            account yet.
                        </p>
                    ) : (
                        <div className="billing-table-wrap">
                            <table className="billing-table">
                                <thead>
                                    <tr>
                                        <th>Plan</th>
                                        <th>Billing</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {subscriptions.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                {item.target_role} {item.plan}
                                            </td>
                                            <td>{item.billing_cycle}</td>
                                            <td>
                                                {formatPrice(
                                                    item.amount / 100
                                                )}
                                            </td>
                                            <td>
                                                <span className="billing-status">
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <p className="billing-disclaimer">
                    Razorpay hosted checkout opens in a separate tab.
                    Completing checkout through these static links does
                    not yet automatically connect the payment to your
                    Nexora user account. Account verification and paid
                    feature activation require the subscription-sync
                    integration.
                </p>
            </div>
        </main>
    );
}

export default Billing;
