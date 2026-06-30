"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isTypingTarget } from "@/lib/keyboard";

export function useAppNavigationShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.key.length !== 1) return;

      const key = event.key.toLowerCase();

      if (key === "d") {
        if (pathname === "/") return;
        event.preventDefault();
        router.push("/");
        return;
      }

      if (key === "s" || key === "e") {
        if (pathname.startsWith("/admin")) return;
        event.preventDefault();
        router.push("/admin");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);
}
