import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  const text: string = body?.text ?? "";
  if (!text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  // Fetch candidate for header
  const { data: candidate, error: fetchError } = await supabase
    .from("candidates")
    .select("company, role, url, found_date")
    .eq("id", params.id)
    .single();

  if (fetchError || !candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const markdown = `# ${candidate.company} — ${candidate.role}

**URL:** ${candidate.url}
**Updated:** ${new Date().toISOString().slice(0, 10)}

---

${text.trim()}
`;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const path = `${params.id}.md`;
  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/job-descriptions/${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "text/markdown; charset=utf-8",
      "x-upsert": "true",
    },
    body: markdown,
  });

  if (!uploadRes.ok) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/job-descriptions/${path}`;

  const { error: updateError } = await supabase
    .from("candidates")
    .update({ jd_storage_url: publicUrl, jd_complete: true })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, jd_storage_url: publicUrl });
}
