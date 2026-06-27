"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { sanitizeNextPath } from "@/lib/safe-redirect";
import { loginAction, type LoginActionState } from "./actions";

function resolveLoginError(
  error: LoginActionState["error"],
  t: ReturnType<typeof useTranslations<"login">>,
  tApi: ReturnType<typeof useTranslations<"api">>,
): string | null {
  if (error === "invalid") return t("invalidPassword");
  if (error === "rate-limit") return tApi("tooManyLoginAttempts");
  return null;
}

const initialState: LoginActionState = {};

export function LoginForm() {
  const t = useTranslations("login");
  const tApi = useTranslations("api");
  const searchParams = useSearchParams();
  const next = sanitizeNextPath(searchParams.get("next"));
  const isDashboardLogin = next === "/" || !next.startsWith("/admin");
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const displayError = resolveLoginError(state.error, t, tApi);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-aurora-drift absolute -top-1/4 left-1/4 size-[500px] rounded-full bg-orange-500/15 blur-[100px] dark:bg-orange-600/20" />
        <div className="animate-aurora-drift-reverse absolute right-0 bottom-0 size-[400px] rounded-full bg-amber-500/10 blur-[90px] dark:bg-amber-600/15" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(128,128,128,0.12) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="glass-panel-strong relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg ring-1 ring-foreground/10">
            <LayoutGrid className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {isDashboardLogin ? t("titleDashboard") : t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isDashboardLogin ? t("subtitleDashboard") : t("subtitle")}
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground/80">
              {t("password")}
            </Label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              required
              autoComplete="current-password"
              disabled={pending}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
            />
          </div>
          {displayError && (
            <p className="text-sm text-rose-500">{displayError}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-10 w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-400 hover:to-amber-500 disabled:opacity-70",
            )}
          >
            {pending ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
