
import "./NexoraBrand.css";

/** Official Nexora brand component */
export default function NexoraBrand({
    className = "",
    markOnly = false,
    size = "regular",
}) {
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
                draggable="false"
            />

            {!markOnly && (
                <img
                    className="nexora-brand__wordmark"
                    src="/nexora-wordmark-transparent.png"
                    alt=""
                    draggable="false"
                />
            )}
        </span>
    );
}
