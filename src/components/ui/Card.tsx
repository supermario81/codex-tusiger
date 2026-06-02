import { forwardRef, type HTMLAttributes } from "react";

export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function GlassPanel({ className = "", ...props }, ref) {
    return <div ref={ref} className={`glass-panel ${className}`} {...props} />;
  }
);
