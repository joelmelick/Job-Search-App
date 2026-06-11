"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type State = "loading" | "success" | "duplicate" | "error";

function IngestContent() {
  const params = useSearchParams();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [jdComplete, setJdComplete] = useState(false);

  useEffect(() => {
    if (!params) return;
    // Trim whitespace from param keys in case browser mangled the bookmarklet
    const entries = [...params.entries()];
    const url = params.get("url") ?? entries.find(([k]) => k.trim() === "url")?.[1] ?? null;
    const secret = params.get("secret") ?? entries.find(([k]) => k.trim() === "secret")?.[1] ?? null;
    if (!url) { setState("error"); setMessage("No URL provided."); return; }

    fetch(`/api/ingest?secret=${encodeURIComponent(secret ?? "")}&url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setState("success");
          setMessage(`${d.company} — ${d.role}`);
          setJdComplete(d.jd_complete);
          setTimeout(() => window.close(), 3000);
        } else if (d.error === "Already in candidates") {
          setState("duplicate");
          setMessage("Already in your candidates list.");
          setTimeout(() => window.close(), 2500);
        } else {
          setState("error");
          setMessage(d.error ?? "Unknown error");
        }
      })
      .catch(() => { setState("error"); setMessage("Could not reach job tracker."); });
  }, [params]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 text-center">
        <div className="mb-3">
          {state === "loading" && (
            <>
              <svg className="animate-spin h-8 w-8 text-[#1F4E79] mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-500 text-sm">Adding job to candidates...</p>
            </>
          )}
          {state === "success" && (
            <>
              <div className="text-4xl mb-3">✓</div>
              <p className="font-bold text-green-700 text-base mb-1">Added to Candidates</p>
              <p className="text-gray-600 text-sm mb-2">{message}</p>
              <p className="text-xs text-gray-400">
                {jdComplete ? "📄 JD captured" : "📄 Partial JD — paste full description in app"}
              </p>
              <p className="text-xs text-gray-300 mt-3">Closing in 3 seconds...</p>
            </>
          )}
          {state === "duplicate" && (
            <>
              <div className="text-4xl mb-3">↩</div>
              <p className="font-semibold text-gray-700 text-sm">{message}</p>
              <p className="text-xs text-gray-300 mt-3">Closing...</p>
            </>
          )}
          {state === "error" && (
            <>
              <div className="text-4xl mb-3">✕</div>
              <p className="font-semibold text-red-600 text-sm mb-1">Error</p>
              <p className="text-gray-500 text-xs">{message}</p>
              <button
                onClick={() => window.close()}
                className="mt-4 text-xs text-gray-400 underline"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IngestPage() {
  return (
    <Suspense>
      <IngestContent />
    </Suspense>
  );
}
