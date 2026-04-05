import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") || undefined;
  const specialty = searchParams.get("specialty") || undefined;
  const search = searchParams.get("search") || undefined;

  let query = supabase
    .from("therapists")
    .select("*")
    .order("name");

  if (state) {
    query = query.eq("state", state);
  }
  if (specialty) {
    query = query.ilike("specialties", `%${specialty}%`);
  }
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count: data?.length ?? 0 });
}
