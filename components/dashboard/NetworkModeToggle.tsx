"use client";

import { useLayoutEffect, useState } from "react";
import { Globe, Wifi } from "lucide-react";
import {
  NETWORK_MODE_STORAGE_KEY,
  readStoredNetworkMode,
  writeStoredNetworkMode,
  type NetworkMode,
} from "@/lib/network-mode";
import { cn } from "@/lib/utils";

interface NetworkModeToggleProps {
  mode: NetworkMode;
  onChange: (mode: NetworkMode) => void;
  className?: string;
}

export function NetworkModeToggle({
  mode,
  onChange,
  className,
}: NetworkModeToggleProps) {
  return (
    <div
      className={cn(
        "relative flex rounded-xl border border-foreground/10 bg-foreground/[0.04] p-1 shadow-inner",
        className,
      )}
      title="Web = externe URL · LAN = lokale IP (Einstellung wird gespeichert)"
    >
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-foreground/10 shadow-sm transition-all duration-300 ease-out"
        style={{
          left: mode === "web" ? "4px" : "calc(50% + 0px)",
          width: "calc(50% - 4px)",
        }}
      />
      <button
        type="button"
        onClick={() => onChange("web")}
        className={cn(
          "relative z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
          mode === "web" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
        )}
      >
        <Globe className="size-3.5" />
        <span className="hidden sm:inline">Web</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("lan")}
        className={cn(
          "relative z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
          mode === "lan" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
        )}
      >
        <Wifi className="size-3.5" />
        <span className="hidden sm:inline">LAN</span>
      </button>
    </div>
  );
}

export function useNetworkMode(): [NetworkMode, (mode: NetworkMode) => void] {
  const [mode, setMode] = useState<NetworkMode>("web");

  useLayoutEffect(() => {
    setMode(readStoredNetworkMode());

    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key === NETWORK_MODE_STORAGE_KEY) {
        setMode(readStoredNetworkMode());
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function updateMode(next: NetworkMode) {
    setMode(next);
    writeStoredNetworkMode(next);
  }

  return [mode, updateMode];
}
