"use client";

import { useState } from "react";
import { Candidate } from "@/lib/types";
import DocModal from "./DocModal";

interface CandidateCardProps {
  candidate: Candidate;
  onPromote: (id: string) => Promise<void>;
  onDismiss: (id: string, reason: string) => Promise<void>;
}

const DISMISS_REASONS = [
  "Too junior / below level",
  "Too senior / above level",
  "Not the right domain",
  "Company not appealing",
  "Pay too low",
  "Location / relocation required",
  "Already applied / duplicate",
  "Other",
];

export default function CandidateCard({
  candidate,
  onPromote,
  onDismiss,
}: CandidateCardProps) {
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showJdModal, setShowJdModal] = useState(false);
  const [jdText, setJdText] = useState("");
  const [jdSaving, setJdSaving] = useState(false);
  const [jdUrl, setJdUrl] = useState(candidate.jd_storage_url ?? null);
  const [jdComplete, setJdComplete] = useState(candidate.jd_complete ?? false);
  const [dismissReason, setDismissReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveJd = async () => {
    if (!jdText.trim()) return;
    setJdSaving(true);
    const res = await fetch(`/api/candidates/${candidate.id}/update-jd`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: jdText }),
    });
    if (res.ok) {
      const { jd_storage_url } = await res.json();
      setJdUrl(jd_storage_url);
      setJdComplete(true);
      setShowJdModal(false);
      setJdText("");
    }
    setJdSaving(false);
  };

  const info = candidate.company_info ?? {};
  const isPublic = info.public_or_private === "public";
  const attrs = Array.isArray(candidate.attributes) ? candidate.attributes : [];

  const handlePromote = async () => {
    setLoading(true);
    try {
      await onPromote(candidate.id);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissSubmit = async () => {
    const reason = dismissReason === "Other" ? customReason : dismissReason;
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onDismiss(candidate.id, reason);
      setShowDismissModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[#1F4E79] text-base">
                {candidate.company}
              </h3>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isPublic
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {isPublic ? "Public" : "Private"}
                {isPublic && info.ticker ? ` · ${info.ticker}` : ""}
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {candidate.source}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {candidate.role}
            </p>
          </div>
          <a
            href={candidate.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#1F4E79] hover:underline whitespace-nowrap flex-shrink-0 mt-1"
          >
            View Job →
          </a>
        </div>

        {/* Pay range */}
        {candidate.pay_range && candidate.pay_range !== "Pay not listed" && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Pay:</span>
            <span className="text-sm font-semibold text-green-700">
              {candidate.pay_range}
            </span>
          </div>
        )}

        {/* Funding / company info */}
        {info.last_funding && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            <span className="font-medium text-gray-700">Funding: </span>
            {info.last_funding}
          </div>
        )}

        {info.notes && (
          <p className="text-xs text-gray-500 italic">{info.notes}</p>
        )}

        {/* Attributes */}
        {attrs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attrs.map((attr) => (
              <span
                key={attr}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
              >
                {attr.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Found date */}
        <div className="text-xs text-gray-400">
          Found: {candidate.found_date}
        </div>

        {/* JD status + paste button */}
        <div className="flex items-center gap-2">
          {jdComplete ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
              📄 JD Saved
            </span>
          ) : jdUrl ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
              📄 Partial JD
            </span>
          ) : null}
          <button
            onClick={() => setShowJdModal(true)}
            className="text-xs text-gray-400 hover:text-[#1F4E79] transition-colors underline"
          >
            {jdComplete ? "Update JD" : jdUrl ? "Paste full JD" : "Paste JD"}
          </button>
        </div>

        {/* Generated docs */}
        {candidate.workflow_status === "complete" && candidate.resume_html && (
          <button
            onClick={() => setShowDocsModal(true)}
            className="w-full text-sm font-medium py-2 px-4 rounded-lg bg-slate-100 text-[#1F4E79] hover:bg-slate-200 transition-colors"
          >
            📄 View Docs
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handlePromote}
            disabled={loading}
            className="flex-1 bg-[#1F4E79] text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-[#2563a8] transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Promote to Pipeline"}
          </button>
          <button
            onClick={() => setShowDismissModal(true)}
            disabled={loading}
            className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* JD paste modal */}
      {showJdModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Paste Job Description</h3>
            <p className="text-sm text-gray-500 mb-1">{candidate.company} — {candidate.role}</p>
            <p className="text-xs text-gray-400 mb-4">
              Copy the full job description from LinkedIn or the job board and paste it below. Plain text is fine.
            </p>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-[#1F4E79] resize-none"
              rows={12}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveJd}
                disabled={jdSaving || !jdText.trim()}
                className="flex-1 bg-[#1F4E79] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#2563a8] disabled:opacity-40 transition-colors"
              >
                {jdSaving ? "Saving..." : "Save JD"}
              </button>
              <button
                onClick={() => { setShowJdModal(false); setJdText(""); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss modal */}
      {showDismissModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Dismiss Candidate
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {candidate.company} — {candidate.role}
            </p>

            <div className="space-y-2 mb-4">
              {DISMISS_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="dismiss-reason"
                    value={r}
                    checked={dismissReason === r}
                    onChange={(e) => setDismissReason(e.target.value)}
                    className="accent-[#1F4E79]"
                  />
                  {r}
                </label>
              ))}
            </div>

            {dismissReason === "Other" && (
              <input
                type="text"
                placeholder="Describe reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-[#1F4E79]"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDismissSubmit}
                disabled={
                  !dismissReason ||
                  (dismissReason === "Other" && !customReason.trim()) ||
                  loading
                }
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {loading ? "Dismissing..." : "Dismiss"}
              </button>
              <button
                onClick={() => {
                  setShowDismissModal(false);
                  setDismissReason("");
                  setCustomReason("");
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Docs modal */}
      {showDocsModal && (
        <DocModal doc={candidate} onClose={() => setShowDocsModal(false)} />
      )}
    </>
  );
}
