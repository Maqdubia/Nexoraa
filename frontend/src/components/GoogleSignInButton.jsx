import { useEffect, useRef, useState } from "react";
import { googleLogin } from "../services/api";

const GOOGLE_SCRIPT_ID = "nexora-google-identity";
const SCRIPT_URL = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.getElementById(GOOGLE_SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    if (script.dataset.loaded === "true" && window.google?.accounts?.id) return resolve();
    const onLoad = () => { script.dataset.loaded = "true"; resolve(); };
    const onError = () => reject(new Error("Could not load Google sign-in. Check your connection."));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    // Handle a script that finished loading before these listeners were attached.
    if (window.google?.accounts?.id) resolve();
  });
}

export default function GoogleSignInButton({ onSuccess, disabled = false }) {
  const buttonRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const [status, setStatus] = useState({ loading: true, error: "" });
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      try {
        const response = await fetch("/api/auth/google/config/");
        const config = await response.json();
        if (!response.ok || !config.configured || !config.client_id) {
          throw new Error("Google sign-in is not configured yet.");
        }
        await loadGoogleScript();
        if (cancelled || !buttonRef.current) return;

        // GIS initialize is global. Reuse the same client instance across React mounts/StrictMode.
        window.__NEXORA_GOOGLE_CALLBACK__ = async (credentialResponse) => {
          try {
            setStatus({ loading: true, error: "" });
            const result = await googleLogin(credentialResponse.credential);
            window.__NEXORA_GOOGLE_CALLBACK__ && onSuccessRef.current?.(result);
          } catch (error) {
            setStatus({
              loading: false,
              error: error.response?.data?.detail || "Google sign-in failed. Please try again.",
            });
          }
        };

        if (window.__NEXORA_GSI_CLIENT_ID__ !== config.client_id) {
          window.google.accounts.id.initialize({
            client_id: config.client_id,
            callback: (credentialResponse) => window.__NEXORA_GOOGLE_CALLBACK__?.(credentialResponse),
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          window.__NEXORA_GSI_CLIENT_ID__ = config.client_id;
        }

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard", theme: "outline", size: "large", shape: "rectangular",
          text: "continue_with", logo_alignment: "left",
          width: Math.min(360, buttonRef.current.parentElement?.clientWidth || 360),
        });
        setStatus({ loading: false, error: "" });
      } catch (error) {
        if (!cancelled) setStatus({ loading: false, error: error.message || "Google sign-in is unavailable." });
      }
    };
    setup();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="google-signin-wrap" aria-busy={status.loading}>
      <div ref={buttonRef} className={`google-signin-button ${disabled ? "is-disabled" : ""}`} />
      {status.loading && <p className="google-signin-note">Loading Google sign-in…</p>}
      {status.error && <p className="google-signin-error" role="alert">{status.error}</p>}
    </div>
  );
}
