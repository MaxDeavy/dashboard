import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listCustomIcons } from "@/lib/custom-icons";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  return NextResponse.json(listCustomIcons());
}
