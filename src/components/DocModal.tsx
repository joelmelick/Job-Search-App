"use client";

import { useState, useEffect, useMemo } from "react";
import { marked } from "marked";
import { AssessmentData, InterviewTip } from "@/lib/types";

marked.use({ gfm: true, breaks: true });

export type Tab = "resume" | "cover" | "assessment" | "tips" | "jd" | "outreach";

/** Minimal shape the modal needs — satisfied by both Job and Candidate. */
export interface DocSource {
  company: string;
  role: string;
  jd_storage_url?: string | null;
  jd_complete?: boolean;
  storage_outreach_url?: string | null;
  outreach_text?: string | null;
  resume_html: string | null;
  cover_letter_text: string | null;
  assessment_data: AssessmentData | null;
  interview_tips: InterviewTip[] | null;
  resume_pdf_b64?: string | null;
}

interface DocModalProps {
  doc: DocSource;
  onClose: () => void;
  /** Open straight to this tab (e.g. from a score badge). Falls back if unavailable. */
  initialTab?: Tab;
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

function Empty({ label }: { label: string }) {
  return <div className="py-16 text-center text-gray-400">No {label} available.</div>;
}

function MarkdownPane({
  url, html, loading, error,
}: {
  url?: string | null;
  html: string | null;
  loading: boolean;
  error: string | null;
}) {
  if (!url) return <Empty label="document" />;
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
  if (!url) return <Empty label="outreach document" />;
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

function ResumePane({ html, pdfB64 }: { html: string | null; pdfB64?: string | null }) {
  if (!html) return <Empty label="resume" />;
  const pdfHref = pdfB64 ? `data:application/pdf;base64,${pdfB64}` : null;
  return (
    <div>
      <div className="flex justify-end gap-2 mb-3">
        {pdfHref && (
          <a
            href={pdfHref}
            download="Joel_Melick_Resume.pdf"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1F4E79] text-white hover:bg-[#2563a8] transition-colors"
          >
            ↓ Download PDF
          </a>
        )}
      </div>
      <div
        className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function CoverPane({ text }: { text: string | null }) {
  if (!text) return <Empty label="cover letter" />;
  return (
    <div>
      <div className="flex justify-end mb-3">
        <CopyButton text={text} label="Copy cover letter" />
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function Chips({ items, tone }: { items?: string[]; tone: "green" | "amber" }) {
  if (!items || items.length === 0) return <span className="text-xs text-gray-400">None</span>;
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700"
      : "bg-amber-50 text-amber-700";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((k, i) => (
        <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
          {k}
        </span>
      ))}
    </div>
  );
}

function AssessmentPane({ data }: { data: AssessmentData | null }) {
  if (!data) return <Empty label="assessment" />;
  const score = data.ats_score;
  const scoreTone =
    score == null ? "bg-gray-100 text-gray-600"
      : score >= 80 ? "bg-green-100 text-green-700"
      : score >= 65 ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
  const leanTone = (data.hm_lean ?? "").toLowerCase().includes("yes")
    ? "bg-green-100 text-green-700"
    : (data.hm_lean ?? "").toLowerCase().includes("no")
    ? "bg-red-100 text-red-700"
    : "bg-gray-100 text-gray-600";

  return (
    <div className="space-y-5">
      {/* Score + lean */}
      <div className="flex flex-wrap items-center gap-3">
        {score != null && (
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${scoreTone}`}>
            ATS score: {score}/100
          </span>
        )}
        {data.hm_lean && (
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${leanTone}`}>
            Hiring manager: {data.hm_lean}
          </span>
        )}
      </div>

      {data.hm_compelling && (
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 text-sm mb-1.5">What's compelling</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{data.hm_compelling}</p>
        </div>
      )}
      {data.hm_concerns && (
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 text-sm mb-1.5">Concerns</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{data.hm_concerns}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Keywords present</h3>
          <Chips items={data.keywords_present} tone="green" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Keywords missing</h3>
          <Chips items={data.keywords_missing} tone="amber" />
        </div>
      </div>

      {(data.strongest_section || data.weakest_section) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.strongest_section && (
            <div className="border border-gray-100 rounded-xl p-4">
              <h3 className="font-semibold text-green-700 text-sm mb-1.5">Strongest section</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{data.strongest_section}</p>
            </div>
          )}
          {data.weakest_section && (
            <div className="border border-gray-100 rounded-xl p-4">
              <h3 className="font-semibold text-amber-700 text-sm mb-1.5">Weakest section</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{data.weakest_section}</p>
            </div>
          )}
        </div>
      )}

      {data.top_improvements && data.top_improvements.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Top improvements</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600">
            {data.top_improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {data.ats_improvements && data.ats_improvements.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 text-sm mb-2">ATS improvements</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600">
            {data.ats_improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function TipsPane({ tips }: { tips: InterviewTip[] | null }) {
  if (!tips || tips.length === 0) return <Empty label="interview tips" />;
  return (
    <div className="space-y-3">
      {tips.map((t, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-[#1F4E79] text-sm">{t.category}</h3>
            <CopyButton text={t.tip} label="Copy" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{t.tip}</p>
        </div>
      ))}
    </div>
  );
}

export default function DocModal({ doc, onClose, initialTab }: DocModalProps) {
  const jd = useMarkdownContent(doc.jd_storage_url);
  // Prefer inline outreach_text from the DB; only fetch a URL if no inline text.
  const outreach = useMarkdownContent(doc.outreach_text ? null : doc.storage_outreach_url);
  const hasOutreach = !!(doc.outreach_text || doc.storage_outreach_url);

  const TABS: { id: Tab; label: string; available: boolean }[] = useMemo(() => [
    { id: "resume", label: "📄 Resume", available: !!doc.resume_html },
    { id: "cover", label: "✉️ Cover Letter", available: !!doc.cover_letter_text },
    { id: "assessment", label: "📊 Assessment", available: !!doc.assessment_data },
    { id: "tips", label: "🎯 Interview Tips", available: !!(doc.interview_tips && doc.interview_tips.length) },
    { id: "jd", label: `📋 Job Description${doc.jd_complete === false && doc.jd_storage_url ? " ⚠" : ""}`, available: !!doc.jd_storage_url },
    { id: "outreach", label: "💼 Outreach", available: hasOutreach },
  ], [doc, hasOutreach]);

  const firstAvailable = TABS.find((t) => t.available)?.id ?? "resume";
  const requestedTab = TABS.find((t) => t.id === initialTab && t.available)?.id;
  const [tab, setTab] = useState<Tab>(requestedTab ?? firstAvailable);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
            <h2 className="text-lg font-bold text-[#1F4E79]">{doc.company}</h2>
            <p className="text-sm text-gray-500">{doc.role}</p>
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
          {tab === "resume" && <ResumePane html={doc.resume_html} pdfB64={doc.resume_pdf_b64} />}
          {tab === "cover" && <CoverPane text={doc.cover_letter_text} />}
          {tab === "assessment" && <AssessmentPane data={doc.assessment_data} />}
          {tab === "tips" && <TipsPane tips={doc.interview_tips} />}
          {tab === "jd" && (
            <>
              {doc.jd_complete === false && doc.jd_storage_url && (
                <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠ Partial JD — likely a LinkedIn job. Use the &quot;Paste JD&quot; button on the candidate card to add the full description.
                </div>
              )}
              <MarkdownPane url={doc.jd_storage_url} html={jd.html} loading={jd.loading} error={jd.error} />
            </>
          )}
          {tab === "outreach" && (
            doc.outreach_text ? (
              <OutreachPane
                url="inline"
                raw={doc.outreach_text}
                html={null}
                loading={false}
                error={null}
              />
            ) : (
              <OutreachPane
                url={doc.storage_outreach_url}
                raw={outreach.raw}
                html={outreach.html}
                loading={outreach.loading}
                error={outreach.error}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
