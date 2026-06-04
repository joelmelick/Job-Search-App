"use client";

import { useState, useEffect } from "react";
import { marked } from "marked";
import { Job } from "@/lib/types";

marked.use({ gfm: true, breaks: true });

type Tab = "notes" | "outreach" | "resume" | "cover";

interface DocModalProps {
  job: Job;
  onClose: () => void;
}

function useMarkdownContent(url: string | null | undefined) {
  const [html, setHtml] = useState<string | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        setRaw(text);
        const result = marked.parse(text);
        setHtml(result instanceof Promise ? "" : result);
        if (result instanceof Promise) result.then(setHtml);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { html, raw, loading, error };
}

// Split raw markdown into sections by ## headings
function parseSections(raw: string): { heading: string; body: string }[] {
  const parts = raw.split(/^## /m);
  return parts
    .filter((p) => p.trim())
    .map((part) => {
      const nl = part.indexOf("\n");
      if (nl === -1) return null;
      return { heading: part.slice(0, nl).trim(), body: part.slice(nl + 1).trim() };
    })
    .filter(Boolean) as { heading: string; body: string }[];
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <svg className="animate-spin h-5 w-5 mr-2 text-[#1F4E79]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Loading...
    </div>
  );
}

function MarkdownPane({
  url, html, loading, error,
}: {
  url?: string | null;
  html: string | null;
  loading: boolean;
  error: string | null;
}) {
  if (!url) return <div className="py-16 text-center text-gray-400">No document available.</div>;
  if (loading) return <Spinner />;
  if (error) return <div className="py-8 text-center text-red-500 text-sm">Error: {error}</div>;
  return <div className="md-content" dangerouslySetInnerHTML={{ __html: html ?? "" }} />;
}

function OutreachPane({
  url, raw, html, loading, error,
}: {
  url?: string | null;
  raw: string | null;
  html: string | null;
  loading: boolean;
  error: string | null;
}) {
  if (!url) return <div className="py-16 text-center text-gray-400">No outreach document available.</div>;
  if (loading) return <Spinner />;
  if (error) return <div className="py-8 text-center text-red-500 text-sm">Error: {error}</div>;

  const sections = raw ? parseSections(raw) : [];

  if (sections.length === 0) {
    return <div className="md-content" dangerouslySetInnerHTML={{ __html: html ?? "" }} />;
  }

  return (
    <div className="space-y-5">
      {sections.map((s, i) => {
        const sectionHtml = marked.parse(s.body);
        return (
          <div key={i} className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="font-semibold text-gray-800 text-sm">{s.heading}</h3>
              <CopyButton text={s.body} label="Copy message" />
            </div>
            <div
              className="md-content text-sm"
              dangerouslySetInnerHTML={{
                __html: sectionHtml instanceof Promise ? "" : sectionHtml,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function DocPane({ url, label }: { url: string | null | undefined; label: string }) {
  const [copied, setCopied] = useState(false);
  if (!url) return <div className="py-16 text-center text-gray-400">No {label.toLowerCase()} available.</div>;
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="text-center bg-gray-50 rounded-xl px-8 py-5 max-w-sm">
        <p className="font-semibold text-gray-700 mb-1">.docx format</p>
        <p className="text-sm text-gray-500">Open in Microsoft Word or upload to Google Docs to view and edit.</p>
      </div>
      <a
        href={url}
        download
        className="bg-[#1F4E79] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2563a8] transition-colors"
      >
        ↓ Download {label}
      </a>
      <div className="w-full max-w-lg">
        <p className="text-xs text-gray-400 mb-1.5">Public URL</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-500 font-mono truncate"
          />
          <button
            onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            {copied ? "✓ Copied" : "Copy URL"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocModal({ job, onClose }: DocModalProps) {
  const [tab, setTab] = useState<Tab>("notes");

  const notes = useMarkdownContent(job.storage_notes_url);
  const outreach = useMarkdownContent(job.storage_outreach_url);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const TABS: { id: Tab; label: string; available: boolean }[] = [
    { id: "notes", label: "📋 Notes", available: !!job.storage_notes_url },
    { id: "outreach", label: "💼 LinkedIn Outreach", available: !!job.storage_outreach_url },
    { id: "resume", label: "📄 Resume", available: !!job.storage_resume_url },
    { id: "cover", label: "✉️ Cover Letter", available: !!job.storage_cover_url },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "80vw", height: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#1F4E79]">{job.company}</h2>
            <p className="text-sm text-gray-500">{job.role}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none font-light mt-0.5 ml-4 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-100 shrink-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => t.available && setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "bg-slate-100 text-[#1F4E79] border-b-2 border-[#1F4E79]"
                  : t.available
                  ? "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  : "text-gray-300 cursor-default"
              }`}
            >
              {t.label}
              {!t.available && <span className="ml-1 text-xs opacity-60">(none)</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "notes" && (
            <MarkdownPane url={job.storage_notes_url} html={notes.html} loading={notes.loading} error={notes.error} />
          )}
          {tab === "outreach" && (
            <OutreachPane
              url={job.storage_outreach_url}
              raw={outreach.raw}
              html={outreach.html}
              loading={outreach.loading}
              error={outreach.error}
            />
          )}
          {tab === "resume" && <DocPane url={job.storage_resume_url} label="Resume" />}
          {tab === "cover" && <DocPane url={job.storage_cover_url} label="Cover Letter" />}
        </div>
      </div>
    </div>
  );
}
