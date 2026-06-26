import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAdminPassword,
  getCookieSecure,
  getSessionCookieName,
  getSessionSecret,
} from "@/lib/env";

export interface SessionData {
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: getSessionCookieName(),
  cookieOptions: {
    secure: getCookieSecure(),
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export function getSessionFromRequest(
  request: Request,
  response: NextResponse,
) {
  return getIronSession<SessionData>(request, response, sessionOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function verifyPassword(password: string): Promise<boolean> {
  return password === getAdminPassword();
}
