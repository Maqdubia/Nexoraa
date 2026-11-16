
import { useCallback, useEffect, useState } from "react";
import "./Billing.css";

const RAZORPAY_SCRIPT =
    "https://checkout.razorpay.com/v1/checkout.js";

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
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    return new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const existingScript = document.querySelector(
            `script[src="${RAZORPAY_SCRIPT}"]`
        );

        if (existingScript) {
            existingScript.addEventListener(
                "load",
                () => resolve(true),
                { once: true }
            );
            existingScript.addEventListener(
                "error",
                () => reject(new Error("Razorpay Checkout could not load.")),
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");
        script.src = RAZORPAY_SCRIPT;
        script.async = true;

        script.onload = () => resolve(true);
        script.onerror = () =>
            reject(new Error("Razorpay Checkout could not load."));

        document.body.appendChild(script);
    });
}

function formatPrice(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Number(amount || 0) / 100);
}

function Billing() {
    const [role, setRole] = useState("");
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyPlan, setBusyPlan] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [testMode, setTestMode] = useState(false);
    const [configured, setConfigured] = useState(false);

    const loadSubscriptions = useCallback(async () => {
        try {
            const data = await apiRequest("billing/subscriptions/me/");
            setSubscriptions(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        }
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
                Array.isArray(subscriptionData) ? subscriptionData : []
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

    const startSubscription = async (plan) => {
        setBusyPlan(plan.id);
        setError("");
        setNotice("");

        try {
            await loadRazorpayScript();

            const created = await apiRequest(
                "billing/subscriptions/create/",
                {
                    method: "POST",
                    body: JSON.stringify({ plan_id: plan.id }),
                }
            );

            if (!created.subscription_id || !created.key_id) {
                throw new Error(
                    "The server did not return valid checkout details."
                );
            }

            const checkout = new window.Razorpay({
                key: created.key_id,
                subscription_id: created.subscription_id,
                name: created.name || "Nexora",
                description: created.description || plan.display_name,
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
                                "Authorization verified. Razorpay will confirm subscription activation through its webhook."
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
                            "Checkout was closed. Your subscription has not been confirmed."
                        );
                    },
                },
            });

            checkout.on("payment.failed", (event) => {
                setError(
                    event.error?.description ||
                    "The payment authorization failed. Please try again."
                );
            });

            checkout.open();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyPlan(null);
        }
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

    return (
        <main className="billing-page">
            <div className="billing-container">
                <header className="billing-header">
                    <div>
                        <p className="billing-eyebrow">NEXORA MEMBERSHIP</p>
                        <h1>Choose your plan</h1>
                        <p className="billing-subtitle">
                            {role === "recruiter"
                                ? "Choose the plan that supports your hiring workflow."
                                : "Unlock more tools to move your career forward."}
                        </p>
                    </div>

                    {testMode && (
                        <span className="billing-test-badge">
                            TEST MODE
                        </span>
                    )}
                </header>

                {error && (
                    <div className="billing-alert billing-alert-error">
                        {error}
                    </div>
                )}

                {notice && (
                    <div className="billing-alert billing-alert-success">
                        {notice}
                    </div>
                )}

                {loading ? (
                    <div className="billing-loading">
                        Loading your billing options...
                    </div>
                ) : !configured ? (
                    <section className="billing-empty">
                        <h2>Payment setup is not finished</h2>
                        <p>
                            Razorpay Test Mode credentials must be configured
                            on the server before checkout can begin.
                        </p>
                    </section>
                ) : !testMode ? (
                    <section className="billing-empty">
                        <h2>Test Mode is required</h2>
                        <p>
                            This setup is restricted to Razorpay Test Mode.
                            Live credentials are not accepted.
                        </p>
                    </section>
                ) : plans.length === 0 ? (
                    <section className="billing-empty">
                        <h2>No plans available yet</h2>
                        <p>
                            Add an active Razorpay plan for your account type
                            in Django Admin before testing checkout.
                        </p>
                    </section>
                ) : (
                    <section className="billing-plans">
                        {plans.map((plan) => (
                            <article className="billing-card" key={plan.id}>
                                <p className="billing-plan-cycle">
                                    {plan.billing_cycle}
                                </p>

                                <h2>
                                    {plan.display_name || plan.plan}
                                </h2>

                                <div className="billing-price">
                                    {formatPrice(plan.amount, plan.currency)}
                                    <span>
                                        / {plan.billing_cycle === "annual"
                                            ? "year"
                                            : "month"}
                                    </span>
                                </div>

                                <p className="billing-plan-description">
                                    {role === "recruiter"
                                        ? "Tools and capacity for your recruitment workflow."
                                        : "Additional tools for your career preparation."}
                                </p>

                                <button
                                    type="button"
                                    className="billing-button"
                                    onClick={() => startSubscription(plan)}
                                    disabled={busyPlan !== null}
                                >
                                    {busyPlan === plan.id
                                        ? "Opening checkout..."
                                        : "Continue to payment"}
                                </button>

                                <p className="billing-secure-note">
                                    Secure checkout powered by Razorpay
                                </p>
                            </article>
                        ))}
                    </section>
                )}

                <section className="billing-history">
                    <div className="billing-history-heading">
                        <div>
                            <h2>Your subscriptions</h2>
                            <p>View the latest status of your plans.</p>
                        </div>

                        <button
                            type="button"
                            className="billing-refresh-button"
                            onClick={refreshStatus}
                            disabled={loading}
                        >
                            Refresh status
                        </button>
                    </div>

                    {subscriptions.length === 0 ? (
                        <p className="billing-muted">
                            No subscriptions found.
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
                                    {subscriptions.map((subscription) => (
                                        <tr key={subscription.id}>
                                            <td>
                                                {subscription.target_role}{" "}
                                                {subscription.plan}
                                            </td>
                                            <td>
                                                {subscription.billing_cycle}
                                            </td>
                                            <td>
                                                {formatPrice(
                                                    subscription.amount,
                                                    subscription.currency
                                                )}
                                            </td>
                                            <td>
                                                <span className="billing-status">
                                                    {subscription.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default Billing;
