"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  getLinkOpenModeLabel,
  LINK_OPEN_MODE_OPTIONS,
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
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(parseLinkOpenMode(next))}
    >
      <SelectTrigger className={className}>
        <span className="flex flex-1 text-left text-sm">
          {getLinkOpenModeLabel(value)}
        </span>
      </SelectTrigger>
      <SelectContent>
        {LINK_OPEN_MODE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
