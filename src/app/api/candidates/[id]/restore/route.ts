import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from("candidates")
    .update({
      dismissed: false,
      dismiss_reason: null,
      dismissed_at: null,
      down_since: null,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // `dismissals` is an append-only audit log and DELETE is revoked for this key,
  // so the historical entry stays. Restoring the candidate clears `dismissed`
  // above, and the finder agent should ignore any dismissals row whose candidate
  // is no longer dismissed rather than relying on the row being removed here.

  return NextResponse.json({ candidate: data });
}
