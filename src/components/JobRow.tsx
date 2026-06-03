"use client";

import { useState } from "react";
import { Job, JOB_STATUSES, JobStatus } from "@/lib/types";

interface JobRowProps {
  job: Job;
  onUpdate: (id: string, updates: Partial<Job>) => void;
  onDelete: (id: string) => void;
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
