"use client";

import { useCallback, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useLongPress } from "@/hooks/useLongPress";
import { usePrefersTouch } from "@/hooks/usePrefersTouch";
import { getLinkAnchorProps, type LinkOpenMode } from "@/lib/link-open-mode";
import { ServiceHoverWidget } from "./ServiceHoverWidget";

interface ServiceHoverCardProps {
  serviceId: number;
  hasWidget: boolean;
  widgetType?: string | null;
  url: string;
  linkOpenMode?: LinkOpenMode;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  layoutEditMode?: boolean;
}

const widgetPanelClassName = (widgetType?: string | null) =>
  widgetType === "iframe"
    ? "w-[28rem] border-white/10 bg-[#12121a]/95 shadow-2xl backdrop-blur-xl"
    : "w-80 border-white/10 bg-[#12121a]/95 shadow-2xl backdrop-blur-xl";

export function ServiceHoverCard({
  serviceId,
  hasWidget,
  widgetType,
  url,
  linkOpenMode = "same_tab",
  className,
  style,
  children,
  layoutEditMode = false,
}: ServiceHoverCardProps) {
  const prefersTouch = usePrefersTouch();
  const [open, setOpen] = useState(false);

  const openWidget = useCallback(() => {
    setOpen(true);
    navigator.vibrate?.(12);
  }, []);

  const longPress = useLongPress({
    enabled: hasWidget && prefersTouch && !layoutEditMode,
    onLongPress: openWidget,
  });

  if (layoutEditMode) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const touchLinkProps = prefersTouch
    ? {
        ...(hasWidget
          ? {
              onTouchStart: longPress.onTouchStart,
              onTouchMove: longPress.onTouchMove,
              onTouchEnd: longPress.onTouchEnd,
              onTouchCancel: longPress.onTouchCancel,
              onClickCapture: longPress.onClickCapture,
            }
          : {}),
        onContextMenu: (event: React.MouseEvent | React.SyntheticEvent) =>
          event.preventDefault(),
      }
    : {};

  const linkProps = {
    href: url,
    ...getLinkAnchorProps(linkOpenMode),
    className,
    style,
    ...touchLinkProps,
  };

  if (!hasWidget) {
    return <a {...linkProps}>{children}</a>;
  }

  return (
    <HoverCard
      {...(prefersTouch ? { open, onOpenChange: setOpen } : {})}
    >
      <HoverCardTrigger render={<a {...linkProps} />}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        className={widgetPanelClassName(widgetType)}
        side="top"
        align="start"
      >
        <ServiceHoverWidget serviceId={serviceId} />
      </HoverCardContent>
    </HoverCard>
  );
}
