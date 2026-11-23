
import { useEffect, useState } from "react";
import "./InstallAppButton.css";

function isIOSDevice() {
    return (
        /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
        (
            navigator.platform === "MacIntel" &&
            navigator.maxTouchPoints > 1
        )
    );
}

function isInstalled() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true
    );
}

function InstallAppButton() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [installed, setInstalled] = useState(isInstalled);
    const [message, setMessage] = useState("");

    const ios = isIOSDevice();

    useEffect(() => {
        // Register the root-scoped service worker.
        if (
            import.meta.env.PROD &&
            "serviceWorker" in navigator &&
            window.isSecureContext
        ) {
            navigator.serviceWorker
                .register("/service-worker.js", { scope: "/" })
                .then((registration) => {
                    console.log(
                        "NEXORA service worker registered:",
                        registration.scope
                    );
                })
                .catch((error) => {
                    console.error(
                        "NEXORA service worker registration failed:",
                        error
                    );
                });
        }

        // Listen for the browser's native installation prompt.
        const handleInstallPrompt = (event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };

        const handleInstalled = () => {
            setInstalled(true);
            setInstallPrompt(null);
            setIsOpen(false);
            setMessage("");
        };

        window.addEventListener(
            "beforeinstallprompt",
            handleInstallPrompt
        );

        window.addEventListener(
            "appinstalled",
            handleInstalled
        );

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleInstallPrompt
            );

            window.removeEventListener(
                "appinstalled",
                handleInstalled
            );
        };
    }, []);

    const handleInstall = async () => {
        if (ios) {
            setMessage(
                "Open NEXORA in Safari. Tap Share, choose Add to Home Screen, then tap Add."
            );
            return;
        }

        if (!installPrompt) {
            setMessage(
                "Open your browser menu and look for Install app or Add to Home screen. The native prompt appears when your browser confirms NEXORA is installable."
            );
            return;
        }

        try {
            const prompt = installPrompt;

            // The browser prompt can only be used once.
            setInstallPrompt(null);

            await prompt.prompt();

            const choice = await prompt.userChoice;

            if (choice.outcome === "accepted") {
                setMessage(
                    "NEXORA installation was accepted. Follow the browser instructions to finish."
                );
            } else {
                setMessage(
                    "Installation was cancelled. You can try again later."
                );
            }
        } catch (error) {
            console.error("NEXORA installation error:", error);

            setMessage(
                "Unable to open the installation prompt. Please try the browser's Install app option."
            );
        }
    };

    if (installed) {
        return null;
    }

    return (
        <div className="nexora-install-container">
            <button
                type="button"
                className="nexora-install-icon"
                onClick={() => {
                    setIsOpen((current) => !current);
                    setMessage("");
                }}
                aria-label="Install NEXORA"
                aria-expanded={isOpen}
                title="Install NEXORA"
            >
                <svg
                    viewBox="0 0 24 24"
                    width="21"
                    height="21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <rect
                        x="6"
                        y="2"
                        width="12"
                        height="20"
                        rx="2.5"
                    />
                    <path d="M10 5h4" />
                    <path d="M11 18h2" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="nexora-install-popover"
                    role="dialog"
                    aria-label="Install NEXORA"
                >
                    <div className="nexora-install-heading">
                        <div>
                            <h3>Install NEXORA</h3>
                            <p>
                                Your career platform, one tap away.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="nexora-install-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    <div className="nexora-install-content">
                        <p role="status">
                            {message ||
                                (ios
                                    ? "Add NEXORA to your iPhone home screen using Safari."
                                    : "Install NEXORA on your phone or computer for quick access.")}
                        </p>

                        <button
                            type="button"
                            className="nexora-install-action"
                            onClick={handleInstall}
                        >
                            {ios ? "How to install" : "Install NEXORA"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InstallAppButton;
