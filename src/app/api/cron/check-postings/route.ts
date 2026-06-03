import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const CLOSED_SIGNALS = [
  "job is no longer available",
  "position has been filled",
  "this job has expired",
  "no longer accepting applications",
  "job not found",
  "this position is no longer",
  "job has been removed",
  "posting has expired",
  "position is closed",
  "this role is no longer",
  "application period has closed",
];

async function isJobLive(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobChecker/1.0)" },
      redirect: "follow",
    });

    clearTimeout(timer);

    if (response.status === 404 || response.status === 410) return false;
    if (!response.ok) return true; // transient server error — don't mark down

    // Detect redirect to generic careers page
    const finalUrl = response.url;
    if (finalUrl && finalUrl !== url) {
      const origPath = new URL(url).pathname;
      const finalPath = new URL(finalUrl).pathname;
      if (origPath.length > 20 && finalPath.length < origPath.length * 0.4) {
        return false;
      }
    }

    // Read first 50KB — enough to catch closed-job messaging
    const reader = response.body?.getReader();
    let text = "";
    if (reader) {
      let bytes = 0;
      while (bytes < 50_000) {
        const { done, value } = await reader.read();
        if (done) break;
        text += new TextDecoder().decode(value);
        bytes += value?.length ?? 0;
      }
      reader.cancel();
    }

    const lower = text.toLowerCase();
    for (const signal of CLOSED_SIGNALS) {
      if (lower.includes(signal)) return false;
    }

    return true;
  } catch {
    return true; // timeout or network error — assume live, retry tomorrow
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, job_url, posting_status")
    .neq("posting_status", "closed");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Check up to 10 URLs in parallel
  const results = await Promise.all(
    (jobs ?? []).map(async (job) => {
      const live = await isJobLive(job.job_url);
      const updates: Record<string, string> = { last_checked: today };

      if (!live) {
        updates.posting_status = "down";
        updates.next_action = "⚠️ Posting removed — reassess";
      }

      await supabase.from("jobs").update(updates).eq("id", job.id);
      return { id: job.id, live };
    })
  );

  const downed = results.filter((r) => !r.live).length;
  return NextResponse.json({ checked: results.length, downed, date: today });
}
