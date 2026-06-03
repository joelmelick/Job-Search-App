"use client";

import { useState } from "react";
import { Job } from "@/lib/types";
import JobRow from "./JobRow";

interface PipelineProps {
  initialJobs: Job[];
}

export default function Pipeline({ initialJobs }: PipelineProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJobUrl, setNewJobUrl] = useState("");
  const [newJobCompany, setNewJobCompany] = useState("");
  const [newJobRole, setNewJobRole] = useState("");
  const [adding, setAdding] = useState(false);

  const handleUpdate = async (id: string, updates: Partial<Job>) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated: Job = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (res.ok) {
      setJobs((prev) => prev.filter((j) => j.id !== id));
    }
  };

  const handleAddJob = async () => {
    if (!newJobUrl.trim() || !newJobCompany.trim() || !newJobRole.trim())
      return;
    setAdding(true);

    const slug = newJobCompany
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const newId = `${slug}-${today}`;

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newId,
        company: newJobCompany.trim(),
        role: newJobRole.trim(),
        job_url: newJobUrl.trim(),
        ranking: 3,
        status: "Research",
        date_added: new Date().toISOString().slice(0, 10),
      }),
    });

    if (res.ok) {
      const job: Job = await res.json();
      setJobs((prev) => [job, ...prev]);
      setNewJobUrl("");
      setNewJobCompany("");
      setNewJobRole("");
      setShowAddForm(false);
    }
    setAdding(false);
  };

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Jobs"
          value={jobs.length}
          color="text-[#1F4E79]"
        />
        <StatCard
          label="Applied"
          value={jobs.filter((j) => j.status === "Applied").length}
          color="text-yellow-600"
        />
        <StatCard
          label="Interviews"
          value={jobs.filter((j) => j.status === "Interview").length}
          color="text-orange-600"
        />
        <StatCard
          label="Offers"
          value={jobs.filter((j) => j.status === "Offer").length}
          color="text-green-600"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Active Pipeline
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({jobs.length} job{jobs.length !== 1 ? "s" : ""})
            </span>
          </h2>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="text-sm bg-[#1F4E79] text-white px-4 py-2 rounded-lg hover:bg-[#2563a8] transition-colors"
          >
            + Add Job
          </button>
        </div>

        {/* Add job form */}
        {showAddForm && (
          <div className="px-5 py-4 bg-blue-50/50 border-b border-blue-100 flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500">Company</label>
              <input
                type="text"
                value={newJobCompany}
                onChange={(e) => setNewJobCompany(e.target.value)}
                placeholder="Acme Corp"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
              />
            </div>
            <div className="flex flex-col gap-1 flex-[2] min-w-[200px]">
              <label className="text-xs text-gray-500">Role</label>
              <input
                type="text"
                value={newJobRole}
                onChange={(e) => setNewJobRole(e.target.value)}
                placeholder="Senior Product Manager"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
              />
            </div>
            <div className="flex flex-col gap-1 flex-[2] min-w-[200px]">
              <label className="text-xs text-gray-500">Job URL</label>
              <input
                type="url"
                value={newJobUrl}
                onChange={(e) => setNewJobUrl(e.target.value)}
                placeholder="https://..."
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
              />
            </div>
            <button
              onClick={handleAddJob}
              disabled={adding}
              className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2563a8] disabled:opacity-50 transition-colors"
            >
              {adding ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="py-3 px-4 font-medium">Company / Role</th>
                <th className="py-3 px-4 font-medium">Rank</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Pay</th>
                <th className="py-3 px-4 font-medium">Posting</th>
                <th className="py-3 px-4 font-medium">Last Action</th>
                <th className="py-3 px-4 font-medium">Next Action</th>
                <th className="py-3 px-4 font-medium">Added</th>
                <th className="py-3 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No jobs in pipeline yet. Add one above or promote a
                    candidate.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
