import React from "react";

// How many managers have voted, as a ring: "7 of 96" in the middle, the share filled in green.
// Counts only (voting_turnout): nobody can see who has voted or how.
export default function TurnoutMeter({ cast = 0, of = 0, size = 132, label = "managers have voted" }) {
  const share = of ? Math.min(1, cast / of) : 0;
  const stroke = Math.round(size / 11);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(share * 100);
  return (
    <figure className="flex items-center gap-4" aria-label={`${cast} of ${of} ${label} (${percent}%)`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#4ade80"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * share} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontWeight="800" fontSize={size / 4.2}>
          {cast}
        </text>
        <text x="50%" y="67%" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.7)" fontSize={size / 10}>
          of {of}
        </text>
      </svg>
      <figcaption>
        <p className="text-3xl font-extrabold text-green-300">{percent}%</p>
        <p className="text-sm text-gray-300">{label}</p>
      </figcaption>
    </figure>
  );
}
