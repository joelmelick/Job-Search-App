import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view");

  const query =
    view === "dismissed"
      ? supabase
          .from("candidates")
          .select("*")
          .eq("dismissed", true)
          .order("dismissed_at", { ascending: false, nullsFirst: false })
      : supabase
          .from("candidates")
          .select("*")
          .eq("dismissed", false)
          .eq("promoted", false)
          .or("posting_status.is.null,posting_status.neq.down")
          .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("candidates")
    .insert([body])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
