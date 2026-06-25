import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "./LoginForm";

async function LoginLoading() {
  const t = await getTranslations("common");
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e] p-4 text-muted-foreground">
      {t("loading")}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
