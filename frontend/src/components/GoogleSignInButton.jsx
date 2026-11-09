import { useEffect, useRef, useState } from "react";
import { googleLogin } from "../services/api";

const GOOGLE_SCRIPT_ID = "nexora-google-identity";

export default function GoogleSignInButton({ onSuccess }) {
    const buttonRef = useRef(null);
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;
    const [status, setStatus] = useState({ loading: true, error: "" });

    useEffect(() => {
        let cancelled = false;
        const initialize = async () => {
            try {
                const configResponse = await fetch("/api/auth/google/config/");
                const config = await configResponse.json();
                if (!configResponse.ok || !config.configured || !config.client_id) {
                    throw new Error("Google sign-in is not configured yet.");
                }

                const render = () => {
                    if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;
                    window.google.accounts.id.initialize({
                        client_id: config.client_id,
                        callback: async (response) => {
                            try {
                                setStatus({ loading: true, error: "" });
                                const result = await googleLogin(response.credential);
                                onSuccessRef.current?.(result);
                            } catch (error) {
                                setStatus({
                                    loading: false,
                                    error: error.response?.data?.detail || "Google sign-in failed. Please try again.",
                                });
                            }
                        },
                        auto_select: false,
                        cancel_on_tap_outside: true,
                    });
                    buttonRef.current.innerHTML = "";
                    window.google.accounts.id.renderButton(buttonRef.current, {
                        type: "standard",
                        theme: "outline",
                        size: "large",
                        shape: "rectangular",
                        text: "continue_with",
                        logo_alignment: "left",
                        width: Math.min(360, buttonRef.current.parentElement?.clientWidth || 360),
                    });
                    setStatus({ loading: false, error: "" });
                };

                if (window.google?.accounts?.id) {
                    render();
                    return;
                }

                let script = document.getElementById(GOOGLE_SCRIPT_ID);
                if (!script) {
                    script = document.createElement("script");
                    script.id = GOOGLE_SCRIPT_ID;
                    script.src = "https://accounts.google.com/gsi/client";
                    script.async = true;
                    script.defer = true;
                    document.head.appendChild(script);
                }
                script.addEventListener("load", render, { once: true });
                script.addEventListener("error", () => {
                    if (!cancelled) setStatus({ loading: false, error: "Could not load Google sign-in. Check your connection." });
                }, { once: true });
            } catch (error) {
                if (!cancelled) setStatus({ loading: false, error: error.message || "Google sign-in is unavailable." });
            }
        };
        initialize();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="google-signin-wrap">
            <div ref={buttonRef} className="google-signin-button" />
            {status.loading && <p className="google-signin-note">Loading Google sign-in…</p>}
            {status.error && <p className="google-signin-error" role="alert">{status.error}</p>}
        </div>
    );
}
