import { cn } from "@/lib/utils";
import { isImageIcon } from "@/lib/service-icons";

interface ServiceIconDisplayProps {
  icon: string | null | undefined;
  name: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  imageSize?: number;
}

export function ServiceIconDisplay({
  icon,
  name,
  className,
  imageClassName,
  fallbackClassName,
  imageSize,
}: ServiceIconDisplayProps) {
  const imageStyle = imageSize
    ? { width: imageSize, height: imageSize }
    : undefined;

  if (icon && isImageIcon(icon)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt=""
        style={imageStyle}
        className={cn("rounded-md object-contain", imageClassName, className)}
      />
    );
  }

  if (icon) {
    return <span className={cn("drop-shadow-sm", className)}>{icon}</span>;
  }

  return (
    <span
      className={cn(
        "font-semibold text-foreground/75",
        fallbackClassName,
        className,
      )}
    >
      {name.charAt(0)}
    </span>
  );
}
