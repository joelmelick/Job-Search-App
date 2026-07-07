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

  // Remove auto-dismissal entries from the log so the finder agent
  // doesn't learn from a dismissal that was reversed
  await supabase.from("dismissals").delete().eq("candidate_id", params.id);

  return NextResponse.json({ candidate: data });
}
