import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "glass";
  icon?: ReactNode;
};

export function Button({ children, className = "", icon, variant = "primary", ...props }: ButtonProps) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {icon ? <span className="button-icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
