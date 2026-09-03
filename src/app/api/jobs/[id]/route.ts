import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("jobs")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// Soft archive instead of a hard delete.
// The board queries jobs with pursuing=true, so flipping this hides the row
// while preserving the resume, cover letter, assessment, and interview tips.
// Hard DELETE is intentionally revoked at the database level for this key.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from("jobs")
    .update({
      pursuing: false,
      status: "Archived",
      last_action: `Archived ${new Date().toISOString().slice(0, 10)}`,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
