"use client";

import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Job, JobStatus, isHiddenStatus } from "@/lib/types";
import JobCard from "./JobCard";
import { atsScore } from "./ScoreBadge";

interface PipelineProps {
  jobs: Job[];
  onJobsChange: Dispatch<SetStateAction<Job[]>>;
}

interface KanbanColumn {
  status: JobStatus;
  label: string;
  headerBg: string;
  headerText: string;
  dotColor: string;
}

const COLUMNS: KanbanColumn[] = [
  { status: "Research",             label: "Research",             headerBg: "bg-gray-100",   headerText: "text-gray-700",   dotColor: "bg-gray-400"   },
  { status: "Cold Apply",           label: "Cold Apply",           headerBg: "bg-amber-100",  headerText: "text-amber-800",  dotColor: "bg-amber-400"  },
  { status: "Applied with LinkedIn Outreach", label: "Applied with LinkedIn Outreach", headerBg: "bg-sky-100", headerText: "text-sky-800", dotColor: "bg-sky-400" },
  { status: "Referred",             label: "Referred",             headerBg: "bg-purple-100", headerText: "text-purple-800", dotColor: "bg-purple-400" },
  { status: "Recruiter Screen",     label: "Recruiter Screen",     headerBg: "bg-orange-100", headerText: "text-orange-800", dotColor: "bg-orange-400" },
  { status: "HM Screen",            label: "HM Screen",            headerBg: "bg-rose-100",   headerText: "text-rose-800",   dotColor: "bg-rose-400"   },
  { status: "Final / Offer",        label: "Final / Offer",        headerBg: "bg-green-100",  headerText: "text-green-800",  dotColor: "bg-green-400"  },
];

type Sort = "ranking" | "newest" | "oldest" | "score";

const SORT_LABELS: Record<Sort, string> = {
  ranking: "Ranking (stars)",
  newest: "Date added (newest)",
  oldest: "Date added (oldest)",
  score: "Assessment score",
};

type Notice = { tone: "success" | "error"; text: string };

/** date_added is the tracked add date; created_at is the reliable fallback. */
function addedTime(job: Job): number {
  const t = Date.parse(job.date_added ?? "");
  return Number.isNaN(t) ? Date.parse(job.created_at ?? "") || 0 : t;
}

export default function Pipeline({ jobs, onJobsChange: setJobs }: PipelineProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [sort, setSort] = useState<Sort>("ranking");
  const [confirmCloseDown, setConfirmCloseDown] = useState(false);
  const [closingDown, setClosingDown] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(
      () => setNotice(null),
      notice.tone === "error" ? 8000 : 4000
    );
    return () => clearTimeout(timer);
  }, [notice]);

  const handleUpdate = async (id: string, updates: Partial<Job>) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      if (updates.pursuing === false) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
      } else {
        const updated: Job = await res.json();
        setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
      }
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (res.ok) setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleAddJob = async () => {
    if (!newUrl.trim() || !newCompany.trim() || !newRole.trim()) return;
    setAdding(true);
    const slug = newCompany.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `${slug}-${dateStr}`,
        company: newCompany.trim(),
        role: newRole.trim(),
        job_url: newUrl.trim(),
        ranking: 3,
        status: "Research",
        date_added: new Date().toISOString().slice(0, 10),
      }),
    });
    if (res.ok) {
      const job: Job = await res.json();
      setJobs((prev) => [job, ...prev]);
      setNewCompany(""); setNewRole(""); setNewUrl("");
      setShowAddModal(false);
    }
    setAdding(false);
  };

  const sortJobs = (list: Job[]): Job[] =>
    list.slice().sort((a, b) => {
      if (sort === "score") {
        const sa = atsScore(a.assessment_data);
        const sb = atsScore(b.assessment_data);
        // Unscored jobs sink to the bottom rather than reading as zero
        if (sa == null && sb == null) return addedTime(b) - addedTime(a);
        if (sa == null) return 1;
        if (sb == null) return -1;
        return sb - sa || addedTime(b) - addedTime(a);
      }
      if (sort === "newest") return addedTime(b) - addedTime(a);
      if (sort === "oldest") return addedTime(a) - addedTime(b);
      return (b.ranking ?? 0) - (a.ranking ?? 0) || addedTime(b) - addedTime(a);
    });

  // Bucket every job into a column, skipping closed-out ones (Rejected, Passed).
  // Anything with an unrecognized status (e.g. a workflow_status value written
  // to status by an agent) lands in Research rather than disappearing.
  const jobsByColumn = new Map<JobStatus, Job[]>(
    COLUMNS.map((col) => [col.status, [] as Job[]])
  );
  for (const job of jobs) {
    if (isHiddenStatus(job.status)) continue;
    const bucket = jobsByColumn.get(job.status) ?? jobsByColumn.get("Research")!;
    bucket.push(job);
  }
  for (const col of COLUMNS) {
    jobsByColumn.set(col.status, sortJobs(jobsByColumn.get(col.status) ?? []));
  }

  // Count from what's actually rendered, so the stat can't drift from the board
  const activeCount = COLUMNS.reduce(
    (sum, col) => sum + (jobsByColumn.get(col.status)?.length ?? 0),
    0
  );
  const countIn = (statuses: JobStatus[]) =>
    statuses.reduce(
      (sum, status) => sum + (jobsByColumn.get(status)?.length ?? 0),
      0
    );
  // Everything past Research counts as an active application
  const inProgress = countIn(["Cold Apply", "Applied with LinkedIn Outreach", "Referred", "Recruiter Screen", "HM Screen", "Final / Offer"]);
  const interviews = countIn(["Recruiter Screen", "HM Screen"]);
  const offers = countIn(["Final / Offer"]);

  // Jobs on the board whose posting the checker could no longer find
  const downJobs = COLUMNS.flatMap(
    (col) => jobsByColumn.get(col.status) ?? []
  ).filter((j) => j.posting_status === "down");

  const handleCloseAllDown = async () => {
    setConfirmCloseDown(false);
    setClosingDown(true);
    const today = new Date().toISOString().slice(0, 10);

    const results = await Promise.all(
      downJobs.map(async (job) => {
        const res = await fetch(`/api/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Passed",
            // Don't clobber a note that's already there
            ...(job.last_action
              ? {}
              : { last_action: `Closed ${today} — posting not found` }),
          }),
        });
        return res.ok ? job.id : null;
      })
    );

    const closed = results.filter((id): id is string => id !== null);
    if (closed.length > 0) {
      setJobs((prev) =>
        prev.map((j) =>
          closed.includes(j.id) ? { ...j, status: "Passed" as JobStatus } : j
        )
      );
    }

    const failed = results.length - closed.length;
    setNotice(
      failed > 0
        ? {
            tone: "error",
            text: `Closed ${closed.length}, but ${failed} failed — try again`,
          }
        : {
            tone: "success",
            text: `Closed ${closed.length} ${
              closed.length === 1 ? "posting" : "postings"
            } not found`,
          }
    );
    setClosingDown(false);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Active Jobs" value={activeCount} color="text-[#1F4E79]" />
        <StatCard label="In Progress" value={inProgress} color="text-amber-600" />
        <StatCard label="Interviews" value={interviews} color="text-orange-600" />
        <StatCard label="Offers" value={offers} color="text-green-600" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          Sort cards
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

        {downJobs.length > 0 &&
          (confirmCloseDown ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">
                Mark {downJobs.length} as Passed / Closed?
              </span>
              <button
                onClick={handleCloseAllDown}
                className="font-medium px-2.5 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                Yes, close them
              </button>
              <button
                onClick={() => setConfirmCloseDown(false)}
                className="font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCloseDown(true)}
              disabled={closingDown}
              title="Mark every job whose posting was not found as Passed / Closed"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              {closingDown
                ? "Closing…"
                : `⚠️ Close all postings not found (${downJobs.length})`}
            </button>
          ))}
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: "60vh" }}>
        {COLUMNS.map((col) => {
          const colJobs = jobsByColumn.get(col.status) ?? [];
          return (
            <div key={col.status} className="flex-shrink-0 w-72 flex flex-col">
              {/* Column header */}
              <div className={`rounded-xl px-3 py-2.5 flex items-center justify-between mb-2 ${col.headerBg}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className={`font-semibold text-sm ${col.headerText}`}>{col.label}</span>
                </div>
                {colJobs.length > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/70 ${col.headerText}`}>
                    {colJobs.length}
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-3">
                {colJobs.map((job) => (
                  <JobCard key={job.id} job={job} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}

                {/* Add button only in Research column */}
                {col.status === "Research" && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-white/50"
                  >
                    + Add job
                  </button>
                )}

                {colJobs.length === 0 && col.status !== "Research" && (
                  <div className="py-8 text-center text-gray-300 text-xs">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add job modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Job to Pipeline</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Company</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Role</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Senior Product Manager"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Job URL</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleAddJob}
                disabled={adding || !newCompany.trim() || !newRole.trim() || !newUrl.trim()}
                className="flex-1 bg-[#1F4E79] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#2563a8] disabled:opacity-50 transition-colors"
              >
                {adding ? "Adding..." : "Add to Research"}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk close confirmation / error */}
      {notice && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg ${
            notice.tone === "success"
              ? "bg-[#1F4E79] text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {notice.tone === "success" ? "✓ " : "⚠ "}
          {notice.text}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
