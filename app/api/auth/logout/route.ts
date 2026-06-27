import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  const session = await getSessionFromRequest(request, response);

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  session.destroy();
  return response;
}
