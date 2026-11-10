// Circular score (0-100). Colour follows the score band.
function ScoreRing({ value = 0, size = 44 }) {
    const score = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    const band = score >= 75 ? "strong" : score >= 50 ? "good" : "low";
    const radius = 17;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);

    return (
        <span
            className={`hr-ring hr-ring-${band}`}
            style={{ width: size, height: size }}
            title={`ATS score ${score}/100`}
        >
            <svg viewBox="0 0 44 44" width={size} height={size}>
                <circle className="hr-ring-track" cx="22" cy="22" r={radius} />
                <circle
                    className="hr-ring-value"
                    cx="22"
                    cy="22"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 22 22)"
                />
            </svg>
            <b>{score}</b>
        </span>
    );
}

export default ScoreRing;
