import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Fetch the candidate
  const { data: candidate, error: fetchError } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  // Build new job ID: company-slug + today's date
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const companySlug = candidate.company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const jobId = `${companySlug}-${today}`;

  // Insert into jobs
  const newJob = {
    id: jobId,
    company: candidate.company,
    role: candidate.role,
    job_url: candidate.url,
    ranking: 3,
    status: "Research",
    pay_min: candidate.pay_min ?? null,
    pay_max: candidate.pay_max ?? null,
    pay_source: "listed",
    posting_status: "live",
    company_info: candidate.company_info ?? {},
    pursuing: true,
    jd_storage_url: candidate.jd_storage_url ?? null,
    jd_complete: candidate.jd_complete ?? false,
    date_added: new Date().toISOString().slice(0, 10),
    workflow_status: candidate.workflow_status ?? "pending",
    // Carry generated doc content forward so the Docs modal works post-promotion
    resume_html: candidate.resume_html ?? null,
    cover_letter_text: candidate.cover_letter_text ?? null,
    assessment_data: candidate.assessment_data ?? null,
    interview_tips: candidate.interview_tips ?? null,
    resume_pdf_b64: candidate.resume_pdf_b64 ?? null,
    storage_outreach_url: candidate.storage_outreach_url ?? null,
    outreach_text: candidate.outreach_text ?? null,
  };

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert([newJob])
    .select()
    .single();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  // Mark candidate as promoted
  const { error: updateError } = await supabase
    .from("candidates")
    .update({ promoted: true })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ job }, { status: 201 });
}
