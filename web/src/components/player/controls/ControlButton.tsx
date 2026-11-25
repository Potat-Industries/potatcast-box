import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

export function ControlButton({
  label,
  children,
  className = "",
  ...buttonProps
}: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`player-drag-cancel relative inline-flex size-10 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40 ${className}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
