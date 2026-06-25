import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e] p-4 text-muted-foreground">
          Lade...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
