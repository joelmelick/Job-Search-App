"use client";

import { useState } from "react";
import { Job, JOB_STATUSES, JobStatus } from "@/lib/types";
import DocModal from "./DocModal";

interface JobRowProps {
  job: Job;
  onUpdate: (id: string, updates: Partial<Job>) => void;
  onDelete: (id: string) => void;
}

function WorkflowBadge({ status }: { status: string }) {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
        Done
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Running
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Error
      </span>
    );
  }
  // pending (default)
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      Pending
    </span>
  );
}

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className="star"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          title={`${n} star${n !== 1 ? "s" : ""}`}
        >
          <span
            className={
              n <= (hover || value) ? "text-yellow-400" : "text-gray-300"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Research: "bg-gray-100 text-gray-700",
  "LinkedIn Reach out": "bg-blue-100 text-blue-700",
  Referred: "bg-purple-100 text-purple-700",
  Applied: "bg-yellow-100 text-yellow-700",
  Interview: "bg-orange-100 text-orange-700",
  Offer: "bg-green-100 text-green-700",
  Passed: "bg-red-100 text-red-700",
};

export default function JobRow({ job, onUpdate, onDelete }: JobRowProps) {
  const [lastAction, setLastAction] = useState(job.last_action ?? "");
  const [nextAction, setNextAction] = useState(job.next_action ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  const handleBlur = (field: keyof Job, value: string) => {
    if (value !== (job[field] ?? "")) {
      onUpdate(job.id, { [field]: value });
    }
  };

  const formatPay = () => {
    if (!job.pay_min && !job.pay_max) return "—";
    const fmt = (n: number) =>
      n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
    if (job.pay_min && job.pay_max)
      return `${fmt(job.pay_min)} – ${fmt(job.pay_max)}`;
    if (job.pay_min) return `${fmt(job.pay_min)}+`;
    if (job.pay_max) return `up to ${fmt(job.pay_max)}`;
    return "—";
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
      {/* Company + Role */}
      <td className="py-3 px-4">
        <a
          href={job.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#1F4E79] hover:underline block"
        >
          {job.company}
        </a>
        <span className="text-sm text-gray-600">{job.role}</span>
      </td>

      {/* Ranking */}
      <td className="py-3 px-4">
        <Stars
          value={job.ranking}
          onChange={(v) => onUpdate(job.id, { ranking: v })}
        />
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <select
          value={job.status}
          onChange={(e) =>
            onUpdate(job.id, { status: e.target.value as JobStatus })
          }
          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-700"}`}
        >
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>

      {/* Pay */}
      <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
        {formatPay()}
      </td>

      {/* Posting status */}
      <td className="py-3 px-4">
        <select
          value={job.posting_status}
          onChange={(e) =>
            onUpdate(job.id, {
              posting_status: e.target.value as Job["posting_status"],
            })
          }
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
        >
          <option value="live">Live</option>
          <option value="down">⚠️ Down</option>
          <option value="closed">Closed</option>
          <option value="unknown">Unknown</option>
        </select>
      </td>

      {/* Last Action */}
      <td className="py-3 px-4 min-w-[180px]">
        <input
          type="text"
          value={lastAction}
          onChange={(e) => setLastAction(e.target.value)}
          onBlur={(e) => handleBlur("last_action", e.target.value)}
          placeholder="Last action..."
          className="inline-edit text-sm text-gray-700 w-full"
        />
      </td>

      {/* Next Action */}
      <td className="py-3 px-4 min-w-[180px]">
        <input
          type="text"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          onBlur={(e) => handleBlur("next_action", e.target.value)}
          placeholder="Next action..."
          className="inline-edit text-sm text-gray-700 w-full"
        />
      </td>

      {/* Date added */}
      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
        {job.date_added}
      </td>

      {/* Workflow status */}
      <td className="py-3 px-4">
        <WorkflowBadge status={job.workflow_status} />
      </td>

      {/* Document links */}
      <td className="py-3 px-4">
        {job.workflow_status === "complete" ? (
          <button
            onClick={() => setDocsOpen(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1F4E79] text-white hover:bg-[#2563a8] transition-colors whitespace-nowrap"
          >
            Docs
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
            ⏳ Processing
          </span>
        )}
        {docsOpen && <DocModal job={job} onClose={() => setDocsOpen(false)} />}
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={() => onDelete(job.id)}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-gray-400 hover:text-red-500 text-sm transition-colors"
            title="Remove from pipeline"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}
