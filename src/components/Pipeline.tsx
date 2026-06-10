"use client";

import { useState } from "react";
import { Job, JobStatus } from "@/lib/types";
import JobCard from "./JobCard";

interface PipelineProps {
  initialJobs: Job[];
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
  { status: "Docs Ready",           label: "Docs Ready",           headerBg: "bg-blue-100",   headerText: "text-blue-800",   dotColor: "bg-blue-400"   },
  { status: "Waiting on Referral",  label: "Waiting on Referral",  headerBg: "bg-purple-100", headerText: "text-purple-800", dotColor: "bg-purple-400" },
  { status: "Application Submitted",label: "Application Submitted",headerBg: "bg-amber-100",  headerText: "text-amber-800",  dotColor: "bg-amber-400"  },
  { status: "Recruiter Screen",     label: "Recruiter Screen",     headerBg: "bg-orange-100", headerText: "text-orange-800", dotColor: "bg-orange-400" },
  { status: "HM Screen",            label: "HM Screen",            headerBg: "bg-rose-100",   headerText: "text-rose-800",   dotColor: "bg-rose-400"   },
  { status: "Final / Offer",        label: "Final / Offer",        headerBg: "bg-green-100",  headerText: "text-green-800",  dotColor: "bg-green-400"  },
];

export default function Pipeline({ initialJobs }: PipelineProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);

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

  const activeJobs = jobs.filter((j) => j.status !== "Passed");
  const inProgress = jobs.filter((j) => ["Application Submitted", "Recruiter Screen", "HM Screen", "Final / Offer"].includes(j.status)).length;
  const interviews = jobs.filter((j) => ["Recruiter Screen", "HM Screen"].includes(j.status)).length;
  const offers = jobs.filter((j) => j.status === "Final / Offer").length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active Jobs" value={activeJobs.length} color="text-[#1F4E79]" />
        <StatCard label="In Progress" value={inProgress} color="text-amber-600" />
        <StatCard label="Interviews" value={interviews} color="text-orange-600" />
        <StatCard label="Offers" value={offers} color="text-green-600" />
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: "60vh" }}>
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.status);
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
