"use client";

import { useState } from "react";
import { Candidate, Job } from "@/lib/types";
import CandidateCard from "./CandidateCard";
import { atsScore } from "./ScoreBadge";

interface CandidatesProps {
  initialCandidates: Candidate[];
  onPromoted: (job: Job) => void;
}

type View = "active" | "dismissed";
type Sort = "score" | "newest" | "oldest";

const SORT_LABELS: Record<Sort, string> = {
  score: "Assessment score",
  newest: "Date added (newest)",
  oldest: "Date added (oldest)",
};

const AUTO_DISMISS_PREFIX = "Posting removed";

/** found_date is the agent's discovery date; created_at is the reliable fallback. */
function addedTime(c: Candidate): number {
  const t = Date.parse(c.found_date ?? "");
  return Number.isNaN(t) ? Date.parse(c.created_at ?? "") || 0 : t;
}

export default function Candidates({
  initialCandidates,
  onPromoted,
}: CandidatesProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [dismissed, setDismissed] = useState<Candidate[] | null>(null);
  const [view, setView] = useState<View>("active");
  const [filterAttr, setFilterAttr] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadDismissed = async () => {
    const res = await fetch("/api/candidates?view=dismissed");
    if (res.ok) setDismissed(await res.json());
  };

  const showDismissed = () => {
    setView("dismissed");
    if (dismissed === null) loadDismissed();
  };

  const handlePromote = async (id: string) => {
    const res = await fetch(`/api/candidates/${id}/promote`, {
      method: "POST",
    });
    if (res.ok) {
      const { job } = await res.json();
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      onPromoted(job);
    }
  };

  const handleDismiss = async (id: string, reason: string) => {
    const res = await fetch(`/api/candidates/${id}/dismiss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      const dismissedCandidate = candidates.find((c) => c.id === id);
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      if (dismissedCandidate && dismissed !== null) {
        setDismissed((prev) => [
          {
            ...dismissedCandidate,
            dismissed: true,
            dismiss_reason: reason,
            dismissed_at: new Date().toISOString(),
          },
          ...(prev ?? []),
        ]);
      }
    }
  };

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      const res = await fetch(`/api/candidates/${id}/restore`, {
        method: "POST",
      });
      if (res.ok) {
        const { candidate } = await res.json();
        setDismissed((prev) => (prev ?? []).filter((c) => c.id !== id));
        setCandidates((prev) => [candidate, ...prev]);
      }
    } finally {
      setRestoringId(null);
    }
  };

  // Collect all unique attributes for filter
  const allAttrs = Array.from(
    new Set(
      candidates.flatMap((c) => (Array.isArray(c.attributes) ? c.attributes : []))
    )
  ).sort();

  const filtered = (
    filterAttr === "all"
      ? candidates
      : candidates.filter(
          (c) =>
            Array.isArray(c.attributes) && c.attributes.includes(filterAttr)
        )
  )
    .slice()
    .sort((a, b) => {
      if (sort === "score") {
        const sa = atsScore(a.assessment_data);
        const sb = atsScore(b.assessment_data);
        // Unscored candidates sink to the bottom rather than reading as zero
        if (sa == null && sb == null) return addedTime(b) - addedTime(a);
        if (sa == null) return 1;
        if (sb == null) return -1;
        return sb - sa || addedTime(b) - addedTime(a);
      }
      return sort === "newest"
        ? addedTime(b) - addedTime(a)
        : addedTime(a) - addedTime(b);
    });

  return (
    <div>
      {/* Header + view toggle + filter */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-gray-800">
            Candidate Queue
            <span className="ml-2 text-sm font-normal text-gray-400">
              {view === "active"
                ? `(${candidates.length} pending)`
                : `(${dismissed?.length ?? "…"} dismissed)`}
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {view === "active"
              ? "Jobs found by AI agent — review and promote or dismiss"
              : "Dismissed candidates — newest first, restore if a posting comes back"}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => setView("active")}
              className={`text-xs px-3 py-1.5 transition-colors ${
                view === "active"
                  ? "bg-[#1F4E79] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Active
            </button>
            <button
              onClick={showDismissed}
              className={`text-xs px-3 py-1.5 transition-colors ${
                view === "dismissed"
                  ? "bg-[#1F4E79] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Dismissed
            </button>
          </div>

          {view === "active" && (
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-[#1F4E79]"
              >
                {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {view === "active" && allAttrs.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterAttr("all")}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  filterAttr === "all"
                    ? "bg-[#1F4E79] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {allAttrs.slice(0, 8).map((attr) => (
                <button
                  key={attr}
                  onClick={() =>
                    setFilterAttr((v) => (v === attr ? "all" : attr))
                  }
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    filterAttr === attr
                      ? "bg-[#1F4E79] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {attr.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {view === "active" ? (
        filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center text-gray-400">
            {candidates.length === 0
              ? "No candidates in queue. The AI agent will add new ones here."
              : "No candidates match the selected filter."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                onPromote={handlePromote}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )
      ) : dismissed === null ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center text-gray-400">
          Loading dismissed candidates…
        </div>
      ) : dismissed.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center text-gray-400">
          No dismissed candidates yet.
        </div>
      ) : (
        <div className="space-y-2">
          {dismissed.map((c) => {
            const isAuto = c.dismiss_reason?.startsWith(AUTO_DISMISS_PREFIX);
            const backLive = isAuto && c.posting_status === "live";
            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between gap-4 flex-wrap ${
                  backLive ? "border-green-300 bg-green-50/50" : "border-gray-100"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#1F4E79]">{c.company}</span>
                    <span className="text-sm text-gray-700 truncate">
                      {c.role}
                    </span>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1F4E79] hover:underline whitespace-nowrap"
                    >
                      View Job →
                    </a>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isAuto
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isAuto ? "⚠️ " : ""}
                      {c.dismiss_reason || "No reason recorded"}
                    </span>
                    {backLive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        ● Posting back live
                      </span>
                    )}
                    {c.dismissed_at && (
                      <span className="text-xs text-gray-400">
                        Dismissed{" "}
                        {new Date(c.dismissed_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(c.id)}
                  disabled={restoringId === c.id}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-[#1F4E79] hover:text-white transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {restoringId === c.id ? "Restoring…" : "Restore"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
