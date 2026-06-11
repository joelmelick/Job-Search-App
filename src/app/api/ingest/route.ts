import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-server";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

function isLoginWall(url: string, text: string): boolean {
  if (url.includes("linkedin.com")) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes("join to see") ||
    lower.includes("sign in to view") ||
    lower.includes("log in to view") ||
    lower.includes("join linkedin") ||
    text.length < 600
  );
}

function buildJdMarkdown(company: string, role: string, url: string, date: string, pageText: string): string {
  return `# ${company} — ${role}

**URL:** ${url}
**Captured:** ${date}

---

${pageText.trim()}
`;
}

async function uploadJd(id: string, markdown: string): Promise<string | null> {
  const path = `${id}.md`;
  const { error } = await supabaseAdmin.storage
    .from("job-descriptions")
    .upload(path, Buffer.from(markdown, "utf-8"), {
      contentType: "text/markdown; charset=utf-8",
      upsert: true,
    });
  if (error) return null;
  const { data } = supabaseAdmin.storage.from("job-descriptions").getPublicUrl(path);
  return data.publicUrl;
}

async function handleIngest(request: NextRequest) {
  const secret = process.env.INGEST_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    const querySecret = request.nextUrl.searchParams.get("secret");
    if (auth !== `Bearer ${secret}` && querySecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let url: string | null = null;
  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    url = body?.url ?? null;
  } else {
    url = request.nextUrl.searchParams.get("url");
  }
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  // Fetch the job posting page
  let pageText = "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    pageText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to fetch URL: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 400 }
    );
  }

  const jdComplete = !isLoginWall(url, pageText);

  // Extract structured job data with Claude
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Extract job posting details from the text below. Return ONLY a valid JSON object with exactly these fields:

{
  "company": "Company name",
  "role": "Exact job title",
  "pay_range": "e.g. $150K – $200K or Pay not listed",
  "pay_min": 150000 or null,
  "pay_max": 200000 or null,
  "source": "linkedin" | "company" | "other",
  "attributes": ["remote_friendly", "publicly_traded"],
  "company_info": {
    "public_or_private": "public" or "private",
    "ticker": "TICKER (EXCHANGE)" or omit if private,
    "last_funding": "Series X, $Xm, Mon YYYY" or omit if public,
    "notes": "One sentence about the company"
  }
}

Attributes to pick from (include all that apply):
remote_friendly, hybrid, onsite, publicly_traded, private, ai_platform, security, iam, grc, siem, enterprise_saas, ml_infrastructure, agentic_ai, platform

Job posting URL: ${url}
Job posting text:
${pageText}`,
      },
    ],
  });

  let extracted: Record<string, unknown>;
  try {
    const content = message.content[0];
    if (content.type !== "text") throw new Error("unexpected response type");
    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no JSON in response");
    extracted = JSON.parse(match[0]);
  } catch (e) {
    return NextResponse.json(
      { error: `Extraction failed: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 500 }
    );
  }

  // Build unique candidate ID
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = today.replace(/-/g, "");
  const companySlug = String(extracted.company ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const roleSlug = String(extracted.role ?? "role").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  const id = `${companySlug}-${roleSlug}-${dateStr}`;

  // Upload JD markdown to Supabase Storage
  const jdMarkdown = buildJdMarkdown(
    String(extracted.company ?? "Unknown"),
    String(extracted.role ?? "Unknown"),
    url,
    today,
    pageText
  );
  const jdStorageUrl = await uploadJd(id, jdMarkdown);

  const { data, error } = await supabase
    .from("candidates")
    .insert([
      {
        id,
        company: extracted.company,
        role: extracted.role,
        url,
        source: extracted.source ?? "other",
        attributes: extracted.attributes ?? [],
        pay_range: extracted.pay_range ?? "Pay not listed",
        pay_min: extracted.pay_min ?? null,
        pay_max: extracted.pay_max ?? null,
        company_info: extracted.company_info ?? {},
        found_date: today,
        added_by: "joel",
        jd_storage_url: jdStorageUrl,
        jd_complete: jdComplete,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already in candidates", id }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, company: data.company, role: data.role, id: data.id, jd_complete: jdComplete },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  const res = await handleIngest(request);
  Object.entries(CORS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function POST(request: NextRequest) {
  const res = await handleIngest(request);
  Object.entries(CORS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
