"use client";

import { useState } from "react";
import { Candidate, Job } from "@/lib/types";
import CandidateCard from "./CandidateCard";

interface CandidatesProps {
  initialCandidates: Candidate[];
  onPromoted: (job: Job) => void;
}

export default function Candidates({
  initialCandidates,
  onPromoted,
}: CandidatesProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [filterAttr, setFilterAttr] = useState<string>("all");

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
      setCandidates((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Collect all unique attributes for filter
  const allAttrs = Array.from(
    new Set(
      candidates.flatMap((c) => (Array.isArray(c.attributes) ? c.attributes : []))
    )
  ).sort();

  const filtered =
    filterAttr === "all"
      ? candidates
      : candidates.filter(
          (c) =>
            Array.isArray(c.attributes) && c.attributes.includes(filterAttr)
        );

  return (
    <div>
      {/* Header + filter */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-gray-800">
            Candidate Queue
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({candidates.length} pending)
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Jobs found by AI agent — review and promote or dismiss
          </p>
        </div>

        {allAttrs.length > 0 && (
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

      {filtered.length === 0 ? (
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
      )}
    </div>
  );
}
