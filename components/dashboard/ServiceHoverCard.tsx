"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getLinkAnchorProps, type LinkOpenMode } from "@/lib/link-open-mode";
import { ServiceHoverWidget } from "./ServiceHoverWidget";

interface ServiceHoverCardProps {
  serviceId: number;
  hasWidget: boolean;
  url: string;
  linkOpenMode?: LinkOpenMode;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  layoutEditMode?: boolean;
}

export function ServiceHoverCard({
  serviceId,
  hasWidget,
  url,
  linkOpenMode = "same_tab",
  className,
  style,
  children,
  layoutEditMode = false,
}: ServiceHoverCardProps) {
  if (layoutEditMode) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const linkProps = {
    href: url,
    ...getLinkAnchorProps(linkOpenMode),
    className,
    style,
  };

  if (!hasWidget) {
    return <a {...linkProps}>{children}</a>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger render={<a {...linkProps} />}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        className="w-72 border-white/10 bg-[#12121a]/95 shadow-2xl backdrop-blur-xl"
        side="top"
        align="start"
      >
        <ServiceHoverWidget serviceId={serviceId} />
      </HoverCardContent>
    </HoverCard>
  );
}
