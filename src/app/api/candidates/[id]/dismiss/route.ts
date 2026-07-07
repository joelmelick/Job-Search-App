import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const reason: string = body.reason ?? "";

  // Fetch candidate for logging
  const { data: candidate } = await supabase
    .from("candidates")
    .select("company, role")
    .eq("id", params.id)
    .single();

  // Mark as dismissed
  const { error: updateError } = await supabase
    .from("candidates")
    .update({
      dismissed: true,
      dismiss_reason: reason,
      dismissed_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log to dismissals table
  if (candidate) {
    await supabase.from("dismissals").insert([
      {
        candidate_id: params.id,
        company: candidate.company,
        role: candidate.role,
        reason,
      },
    ]);
  }

  return NextResponse.json({ success: true });
}
