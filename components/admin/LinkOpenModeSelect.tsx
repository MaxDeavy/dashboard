"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  getLinkOpenModeLabel,
  LINK_OPEN_MODE_VALUES,
  parseLinkOpenMode,
  type LinkOpenMode,
} from "@/lib/link-open-mode";

interface LinkOpenModeSelectProps {
  value: LinkOpenMode;
  onChange: (mode: LinkOpenMode) => void;
  className?: string;
}

export function LinkOpenModeSelect({
  value,
  onChange,
  className,
}: LinkOpenModeSelectProps) {
  const t = useTranslations("linkOpenMode");

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(parseLinkOpenMode(next))}
    >
      <SelectTrigger className={className}>
        <span className="flex flex-1 text-left text-sm">
          {getLinkOpenModeLabel(value, t)}
        </span>
      </SelectTrigger>
      <SelectContent>
        {LINK_OPEN_MODE_VALUES.map((mode) => (
          <SelectItem key={mode} value={mode}>
            {getLinkOpenModeLabel(mode, t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
