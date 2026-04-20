import { cn } from "@/lib/utils";

const CHIP_STYLES: Record<number, { bg: string; ring: string; text: string }> = {
  1: { bg: "oklch(0.95 0.02 90)", ring: "oklch(0.4 0.02 90)", text: "oklch(0.2 0 0)" },
  5: { bg: "oklch(0.55 0.22 25)", ring: "oklch(0.95 0.02 90)", text: "oklch(0.98 0 0)" },
  25: { bg: "oklch(0.45 0.14 150)", ring: "oklch(0.95 0.02 90)", text: "oklch(0.98 0 0)" },
  100: { bg: "oklch(0.2 0.02 270)", ring: "oklch(0.78 0.15 85)", text: "oklch(0.78 0.15 85)" },
  500: { bg: "oklch(0.4 0.18 300)", ring: "oklch(0.95 0.02 90)", text: "oklch(0.98 0 0)" },
};

interface Props {
  value: number;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export function Chip({ value, selected, size = "md", onClick, className }: Props) {
  const style = CHIP_STYLES[value] ?? CHIP_STYLES[1];
  const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-12 h-12 text-xs",
    lg: "w-14 h-14 text-sm",
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full font-bold flex items-center justify-center shadow-chip transition-all",
        "hover:scale-110 active:scale-95",
        selected && "ring-4 ring-gold scale-110 -translate-y-1",
        sizeClasses,
        className,
      )}
      style={{
        background: `radial-gradient(circle, ${style.bg} 60%, ${style.bg} 60%)`,
        border: `3px dashed ${style.ring}`,
        color: style.text,
        boxShadow: selected
          ? "var(--shadow-gold)"
          : "0 4px 8px oklch(0 0 0 / 40%), inset 0 -2px 0 oklch(0 0 0 / 20%), inset 0 1px 0 oklch(1 0 0 / 20%)",
      }}
    >
      {value}
    </button>
  );
}
