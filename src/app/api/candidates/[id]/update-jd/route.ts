import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-server";

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

  const path = `${params.id}.md`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("job-descriptions")
    .upload(path, Buffer.from(markdown, "utf-8"), {
      contentType: "text/markdown; charset=utf-8",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("job-descriptions")
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("candidates")
    .update({ jd_storage_url: publicUrl, jd_complete: true })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, jd_storage_url: publicUrl });
}
