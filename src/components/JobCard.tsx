"use client";

import { useState } from "react";
import { Job, JobStatus, JOB_STATUSES, ApplicationType } from "@/lib/types";
import DocModal from "./DocModal";

interface JobCardProps {
  job: Job;
  onUpdate: (id: string, updates: Partial<Job>) => void;
  onDelete: (id: string) => void;
}

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="text-sm leading-none"
        >
          <span className={n <= (hover || value) ? "text-yellow-400" : "text-gray-200"}>★</span>
        </button>
      ))}
    </div>
  );
}

function WorkflowBadge({ status }: { status: string }) {
  if (status === "complete") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
      Done
    </span>
  );
  if (status === "running") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      Running
    </span>
  );
  if (status === "error") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      ⚠ Error
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
      ⏳ Pending
    </span>
  );
}

export default function JobCard({ job, onUpdate, onDelete }: JobCardProps) {
  const [lastAction, setLastAction] = useState(job.last_action ?? "");
  const [nextAction, setNextAction] = useState(job.next_action ?? "");
  const [docsOpen, setDocsOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const info = job.company_info ?? {};
  const isPublic = info.public_or_private === "public";
  const isReferral = job.application_type === "referral";

  const handleBlur = (field: "last_action" | "next_action", value: string) => {
    if (value !== (job[field] ?? "")) onUpdate(job.id, { [field]: value });
  };

  const formatPay = () => {
    if (!job.pay_min && !job.pay_max) return null;
    const fmt = (n: number) => `$${Math.round(n / 1000)}K`;
    if (job.pay_min && job.pay_max) return `${fmt(job.pay_min)} – ${fmt(job.pay_max)}`;
    if (job.pay_min) return `${fmt(job.pay_min)}+`;
    return `up to ${fmt(job.pay_max!)}`;
  };

  const pay = formatPay();
  const ACTIVE_STATUSES = JOB_STATUSES.filter((s) => s !== "Passed");

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow overflow-hidden ${isReferral ? "border-l-4 border-l-yellow-400" : ""}`}>
        {/* Card body */}
        <div className="px-4 pt-4 flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[#1F4E79] text-sm">{job.company}</span>
                {info.public_or_private && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isPublic ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {isPublic ? "Public" : "Private"}{isPublic && info.ticker ? ` · ${info.ticker}` : ""}
                  </span>
                )}
              </div>
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-800 hover:text-[#1F4E79] hover:underline block mt-0.5 leading-snug"
              >
                {job.role}
              </a>
            </div>
            <Stars value={job.ranking} onChange={(v) => onUpdate(job.id, { ranking: v })} />
          </div>

          {/* Pay */}
          {pay && <div className="text-sm font-semibold text-green-700">{pay}</div>}

          {/* Referral indicator */}
          {isReferral ? (
            <button
              onClick={() => onUpdate(job.id, { application_type: "online" as ApplicationType })}
              title="Click to remove referral tag"
              className="self-start text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
            >
              🤝 Referral
            </button>
          ) : (
            <button
              onClick={() => onUpdate(job.id, { application_type: "referral" as ApplicationType })}
              className="self-start text-xs text-gray-400 hover:text-yellow-600 transition-colors"
            >
              + referral
            </button>
          )}

          {/* Company insights */}
          {info.last_funding && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-snug">{info.last_funding}</div>
          )}
          {info.notes && (
            <p className="text-xs text-gray-400 italic leading-snug">{info.notes}</p>
          )}

          {/* Actions */}
          <div className="space-y-1">
            <input
              type="text"
              value={lastAction}
              onChange={(e) => setLastAction(e.target.value)}
              onBlur={(e) => handleBlur("last_action", e.target.value)}
              placeholder="Last action..."
              className="inline-edit text-xs text-gray-600 w-full"
            />
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              onBlur={(e) => handleBlur("next_action", e.target.value)}
              placeholder="Next action..."
              className="inline-edit text-xs text-gray-600 w-full"
            />
          </div>

          {/* Posting status warnings */}
          {job.posting_status === "down" && (
            <div className="text-xs text-orange-600 font-medium bg-orange-50 rounded px-2 py-1">⚠️ Posting removed — reassess</div>
          )}
          {job.posting_status === "closed" && (
            <div className="text-xs text-red-600 font-medium bg-red-50 rounded px-2 py-1">Posting closed</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 flex items-center justify-between gap-2 border-t border-gray-50 pt-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <WorkflowBadge status={job.workflow_status} />
            {job.jd_storage_url && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.jd_complete ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                {job.jd_complete ? "📄 JD" : "📄 Partial"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {job.workflow_status === "complete" && (
              <button
                onClick={() => setDocsOpen(true)}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#1F4E79] text-white hover:bg-[#2563a8] transition-colors"
              >
                Docs
              </button>
            )}
            {confirmArchive ? (
              <div className="flex gap-1">
                <button onClick={() => onUpdate(job.id, { pursuing: false })} className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded hover:bg-orange-600">Yes</button>
                <button onClick={() => setConfirmArchive(false)} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">No</button>
              </div>
            ) : confirmDelete ? (
              <div className="flex gap-1">
                <button onClick={() => onDelete(job.id)} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600">Delete</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">No</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setConfirmArchive(true)} className="text-xs text-gray-400 hover:text-orange-500 transition-colors">Archive</button>
                <button onClick={() => setConfirmDelete(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">✕</button>
              </div>
            )}
          </div>
        </div>

        {/* Move stage */}
        <div className="px-3 pb-3">
          <select
            value={job.status}
            onChange={(e) => onUpdate(job.id, { status: e.target.value as JobStatus })}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-600 cursor-pointer focus:outline-none focus:border-[#1F4E79]"
          >
            {ACTIVE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="Passed">Passed / Closed</option>
          </select>
        </div>
      </div>

      {docsOpen && <DocModal job={job} onClose={() => setDocsOpen(false)} />}
    </>
  );
}
