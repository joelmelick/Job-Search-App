"use client";

import { useEffect, useState } from "react";
import { Job, Candidate } from "@/lib/types";
import Pipeline from "@/components/Pipeline";
import Candidates from "@/components/Candidates";

type Tab = "pipeline" | "candidates";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [jobsRes, candidatesRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/candidates"),
        ]);
        if (!jobsRes.ok || !candidatesRes.ok) {
          throw new Error("Failed to load data");
        }
        const [jobsData, candidatesData] = await Promise.all([
          jobsRes.json(),
          candidatesRes.json(),
        ]);
        setJobs(jobsData);
        setCandidates(candidatesData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePromoted = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
    setTab("pipeline");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top nav */}
      <header className="bg-[#1F4E79] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Job Search Tracker
            </h1>
            <p className="text-blue-200 text-xs mt-0.5">
              Joel Melick — PM, 15+ yrs, AI/Security
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <span>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 pb-0">
          <TabButton
            active={tab === "pipeline"}
            onClick={() => setTab("pipeline")}
            badge={jobs.filter((j) => j.status !== "Passed").length}
          >
            Pipeline
          </TabButton>
          <TabButton
            active={tab === "candidates"}
            onClick={() => setTab("candidates")}
            badge={candidates.length}
            badgeColor="bg-orange-400"
          >
            Candidates
          </TabButton>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <svg
              className="animate-spin h-6 w-6 mr-3 text-[#1F4E79]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            <strong>Error loading data:</strong> {error}
            <p className="text-sm mt-1">
              Make sure your .env.local file is set up with valid Supabase
              credentials.
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {tab === "pipeline" && (
              <Pipeline initialJobs={jobs} />
            )}
            {tab === "candidates" && (
              <Candidates
                initialCandidates={candidates}
                onPromoted={handlePromoted}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
  badge,
  badgeColor = "bg-blue-400",
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
  badgeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-5 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
        active
          ? "bg-slate-100 text-[#1F4E79]"
          : "text-blue-200 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          className={`${badgeColor} text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
