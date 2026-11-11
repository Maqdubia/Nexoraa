
import "./NexoraBrand.css";

export default function NexoraBrand({
    className = "",
    markOnly = false,
    size = "regular",
}) {
    const hideBrokenImage = (event) => {
        event.currentTarget.style.display = "none";
        if (event.currentTarget.nextElementSibling) {
            event.currentTarget.nextElementSibling.style.display = "inline-flex";
        }
    };

    return (
        <span
            className={`nexora-brand nexora-brand--${size} ${
                markOnly ? "nexora-brand--mark-only" : ""
            } ${className}`.trim()}
            aria-label="Nexora"
            role="img"
        >
            <img
                className="nexora-brand__mark"
                src="/nexora-mark-transparent.png"
                alt=""
                onError={hideBrokenImage}
            />
            <span className="nexora-brand__fallback-mark">N</span>

            {!markOnly && (
                <>
                    <img
                        className="nexora-brand__wordmark"
                        src="/nexora-wordmark-transparent.png"
                        alt=""
                        onError={hideBrokenImage}
                    />
                    <span className="nexora-brand__fallback-text">
                        NEXORA
                    </span>
                </>
            )}
        </span>
    );
}
