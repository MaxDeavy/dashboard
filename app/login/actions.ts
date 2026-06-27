"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { establishAuthenticatedSession, validateLogin } from "@/lib/auth-login";
import { getClientIpFromHeaders } from "@/lib/login-rate-limit";
import { sanitizeNextPath } from "@/lib/safe-redirect";

export type LoginActionState = {
  error?: "invalid" | "rate-limit";
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNextPath(String(formData.get("next") ?? "/"));
  const ip = getClientIpFromHeaders(await headers());

  const error = await validateLogin(password, ip);
  if (error) return { error };

  await establishAuthenticatedSession();
  redirect(next);
}
