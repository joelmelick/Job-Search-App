"use client";

import { AssessmentData } from "@/lib/types";

/** Pull the ATS score off assessment data, tolerating string values from the DB. */
export function atsScore(data: AssessmentData | null | undefined): number | null {
  const raw = data?.ats_score;
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function scoreTone(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700 hover:bg-green-200";
  if (score >= 65) return "bg-amber-100 text-amber-700 hover:bg-amber-200";
  return "bg-red-100 text-red-700 hover:bg-red-200";
}

interface ScoreBadgeProps {
  data: AssessmentData | null | undefined;
  onClick: () => void;
  /** Compact form omits the "ATS" label — used on dense card footers. */
  compact?: boolean;
}

/** Clickable ATS score chip that deep-links into the Docs modal's Assessment tab. */
export default function ScoreBadge({ data, onClick, compact }: ScoreBadgeProps) {
  const score = atsScore(data);
  if (score == null) return null;

  return (
    <button
      onClick={onClick}
      title="View assessment"
      className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${scoreTone(
        score
      )}`}
    >
      📊 {compact ? score : `ATS ${score}`}
    </button>
  );
}
