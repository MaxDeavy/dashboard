import type { SessionOptions } from "iron-session";
import {
  getSessionCookieName,
  getSessionMaxAgeSeconds,
  getSessionSecret,
} from "@/lib/env";
import type { SessionData } from "@/lib/auth";
import { isSecureRequest } from "@/lib/request-origin";

export function getSessionOptionsForRequest(request: Request): SessionOptions {
  return {
    password: getSessionSecret(),
    cookieName: getSessionCookieName(),
    cookieOptions: {
      secure: isSecureRequest(request),
      httpOnly: true,
      sameSite: "lax",
      maxAge: getSessionMaxAgeSeconds(),
    },
  };
}

export type { SessionData };
