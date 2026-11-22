
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Billing.css";

let razorpayScriptPromise = null;

const FREE_PLAN = {
    student: {
        id: "student-free",
        name: "Student Free",
        amount: 0,
        description: "Core Nexora career platform access.",
        features: ["Free access to the student workspace"],
    },
    recruiter: {
        id: "recruiter-free",
        name: "Recruiter Free",
        amount: 0,
        description: "Core Nexora recruiter workspace access.",
        features: ["Free access to the recruiter workspace"],
    },
};

function getAccessToken() {
    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        ""
    );
}

async function apiRequest(path, options = {}) {
    const token = getAccessToken();

    const response = await fetch(`/api/${path}`, {
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.error ||
            `Request failed (${response.status}).`
        );
    }

    return data;
}

function loadRazorpayScript() {
    if (window.Razorpay) {
        return Promise.resolve(true);
    }

    if (!razorpayScriptPromise) {
        razorpayScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");

            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;

            script.onload = () => resolve(true);

            script.onerror = () => {
                razorpayScriptPromise = null;
                reject(
                    new Error("Razorpay Checkout could not be loaded.")
                );
            };

            document.body.appendChild(script);
        });
    }

    return razorpayScriptPromise;
}

function formatPaise(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0) / 100);
}

function Billing() {
    const navigate = useNavigate();

    const [role, setRole] = useState("");
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyPlan, setBusyPlan] = useState(null);
    const [configured, setConfigured] = useState(false);
    const [testMode, setTestMode] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadSubscriptions = useCallback(async () => {
        const data = await apiRequest(
            "billing/subscriptions/me/"
        );

        setSubscriptions(Array.isArray(data) ? data : []);
    }, []);

    const loadBillingData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [user, config] = await Promise.all([
                apiRequest("auth/me/"),
                apiRequest("billing/config/"),
            ]);

            if (!["student", "recruiter"].includes(user.role)) {
                throw new Error(
                    "Billing is available to student and recruiter accounts only."
                );
            }

            setRole(user.role);
            setConfigured(Boolean(config.configured));
            setTestMode(Boolean(config.test_mode));

            const [planData, subscriptionData] = await Promise.all([
                apiRequest(
                    `billing/plans/?role=${encodeURIComponent(user.role)}`
                ),
                apiRequest("billing/subscriptions/me/"),
            ]);

            setPlans(Array.isArray(planData) ? planData : []);
            setSubscriptions(
                Array.isArray(subscriptionData)
                    ? subscriptionData
                    : []
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBillingData();
    }, [loadBillingData]);

    // Return to the correct Nexora dashboard.
    const goBack = () => {
        navigate(
            role === "recruiter"
                ? "/hr/dashboard"
                : "/dashboard"
        );
    };

    const startSubscription = async (plan) => {
        setBusyPlan(plan.id);
        setError("");
        setNotice("");

        try {
            if (!configured || !testMode) {
                throw new Error(
                    "Razorpay Test Mode is not configured."
                );
            }

            await loadRazorpayScript();

            const created = await apiRequest(
                "billing/subscriptions/create/",
                {
                    method: "POST",
                    body: JSON.stringify({
                        plan_id: plan.id,
                    }),
                }
            );

            if (
                !created.local_subscription_id ||
                !created.subscription_id ||
                !created.key_id
            ) {
                throw new Error(
                    "The server returned incomplete checkout details."
                );
            }

            const checkout = new window.Razorpay({
                key: created.key_id,
                subscription_id: created.subscription_id,
                name: created.name || "Nexora",
                description:
                    created.description || plan.display_name,
                prefill: created.prefill || {},
                theme: {
                    color: "#315b43",
                },

                handler: async (paymentResponse) => {
                    try {
                        const verified = await apiRequest(
                            "billing/subscriptions/verify/",
                            {
                                method: "POST",
                                body: JSON.stringify({
                                    local_subscription_id:
                                        created.local_subscription_id,
                                    razorpay_payment_id:
                                        paymentResponse.razorpay_payment_id,
                                    razorpay_subscription_id:
                                        paymentResponse.razorpay_subscription_id,
                                    razorpay_signature:
                                        paymentResponse.razorpay_signature,
                                }),
                            }
                        );

                        if (verified.verified) {
                            setNotice(
                                "Payment authorization verified. Your membership will become active after Razorpay confirms it through the webhook."
                            );

                            await loadSubscriptions();
                        }
                    } catch (err) {
                        setError(
                            `Payment verification failed: ${err.message}`
                        );
                    }
                },

                modal: {
                    ondismiss: () => {
                        setNotice(
                            "Checkout closed. Your subscription has not been confirmed."
                        );
                    },
                },
            });

            checkout.on("payment.failed", (event) => {
                setError(
                    event.error?.description ||
                    "Payment authorization failed. Please try again."
                );
            });

            checkout.open();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyPlan(null);
        }
    };

    const continueFree = () => {
        goBack();
    };

    const refreshStatus = async () => {
        setError("");
        setNotice("");

        try {
            await loadSubscriptions();
            setNotice("Subscription status refreshed.");
        } catch (err) {
            setError(err.message);
        }
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

    if (error && !role) {
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

    const freePlan = FREE_PLAN[role];

    const sortedPlans = [...plans].sort((a, b) => {
        const order = { starter: 1, pro: 2 };
        return (order[a.plan] || 99) - (order[b.plan] || 99);
    });

    return (
        <main className="billing-page">
            <div className="billing-container">

                <header className="billing-header">
                    <div>
                        <button
                            type="button"
                            className="billing-refresh-button"
                            onClick={goBack}
                        >
                            ← Back to Dashboard
                        </button>

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

                    {testMode && (
                        <span className="billing-test-badge">
                            RAZORPAY TEST MODE
                        </span>
                    )}
                </header>

                {error && (
                    <div
                        className="billing-alert billing-alert-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {notice && (
                    <div
                        className="billing-alert billing-alert-success"
                        role="status"
                    >
                        {notice}
                    </div>
                )}

                {!configured || !testMode ? (
                    <section className="billing-empty">
                        <h2>Payment setup is not ready</h2>
                        <p>
                            Razorpay Test Mode credentials need to be
                            configured on the server before payments
                            can be started.
                        </p>
                    </section>
                ) : (
                    <section className="billing-plans">

                        <article className="billing-card">
                            <span className="billing-free-label">
                                FREE ACCESS
                            </span>

                            <p className="billing-plan-cycle">
                                Free forever
                            </p>

                            <h2>{freePlan.name}</h2>

                            <div className="billing-price">
                                {formatPaise(0)}
                            </div>

                            <p className="billing-plan-description">
                                {freePlan.description}
                            </p>

                            <ul className="billing-features">
                                {freePlan.features.map((feature) => (
                                    <li key={feature}>
                                        <span aria-hidden="true">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                type="button"
                                className="billing-button billing-button-free"
                                onClick={continueFree}
                            >
                                Continue with Free
                            </button>
                        </article>

                        {sortedPlans.map((plan) => (
                            <article
                                className={`billing-card ${
                                    plan.plan === "pro"
                                        ? "billing-card-popular"
                                        : ""
                                }`}
                                key={plan.id}
                            >
                                {plan.plan === "pro" && (
                                    <span className="billing-popular-label">
                                        PRO PLAN
                                    </span>
                                )}

                                <p className="billing-plan-cycle">
                                    {plan.billing_cycle === "annual"
                                        ? "Annual membership"
                                        : "Monthly membership"}
                                </p>

                                <h2>
                                    {plan.display_name || plan.plan}
                                </h2>

                                <div className="billing-price">
                                    {formatPaise(
                                        plan.amount,
                                        plan.currency
                                    )}
                                    <span>
                                        {plan.billing_cycle === "annual"
                                            ? " / year"
                                            : " / month"}
                                    </span>
                                </div>

                                <p className="billing-plan-description">
                                    {plan.plan === "pro"
                                        ? "Annual Pro membership for your Nexora account."
                                        : "Monthly Starter membership for your Nexora account."}
                                </p>

                                <ul className="billing-features">
                                    <li>
                                        <span aria-hidden="true">✓</span>
                                        {plan.billing_cycle === "annual"
                                            ? "Annual recurring billing"
                                            : "Monthly recurring billing"}
                                    </li>
                                    <li>
                                        <span aria-hidden="true">✓</span>
                                        Checkout linked to your Nexora account
                                    </li>
                                </ul>

                                <button
                                    type="button"
                                    className="billing-button"
                                    onClick={() => startSubscription(plan)}
                                    disabled={busyPlan !== null}
                                >
                                    {busyPlan === plan.id
                                        ? "Opening checkout..."
                                        : "Continue to secure checkout"}
                                </button>

                                <p className="billing-secure-note">
                                    Secure recurring checkout powered by Razorpay
                                </p>
                            </article>
                        ))}

                        {sortedPlans.length === 0 && (
                            <div className="billing-empty">
                                <h2>No paid plans are registered</h2>
                                <p>
                                    The billing database plans have not
                                    been installed yet.
                                </p>
                            </div>
                        )}

                    </section>
                )}

                <section className="billing-history">
                    <div className="billing-history-heading">
                        <div>
                            <h2>Your subscriptions</h2>
                            <p>
                                Current subscription records associated
                                with your Nexora account.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="billing-refresh-button"
                            onClick={refreshStatus}
                        >
                            Refresh status
                        </button>
                    </div>

                    {subscriptions.length === 0 ? (
                        <p className="billing-muted">
                            No subscription records found.
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
                                                {formatPaise(
                                                    item.amount,
                                                    item.currency
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
                    Checkout is created by Nexora for your signed-in
                    account. Membership activation depends on successful
                    signature verification and Razorpay webhook
                    confirmation.
                </p>

            </div>
        </main>
    );
}

export default Billing;
