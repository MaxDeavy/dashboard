"use client";

import Link from "next/link";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="glass-panel-strong mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl px-4 sm:px-5">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <div className="hidden h-5 w-px bg-foreground/10 sm:block" />
          <div className="hidden items-center gap-2 sm:flex">
            <Shield className="size-4 text-orange-500/80" />
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Administration
            </h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          <LogOut className="mr-2 size-4" />
          Abmelden
        </Button>
      </div>
    </header>
  );
}
