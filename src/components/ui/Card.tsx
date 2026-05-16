import { forwardRef, type HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...props} />;
}

export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function GlassPanel({ className = "", ...props }, ref) {
    return <div ref={ref} className={`glass-panel ${className}`} {...props} />;
  }
);
