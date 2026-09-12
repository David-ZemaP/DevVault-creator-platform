import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex max-w-full items-center justify-center text-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variantStyles = {
      primary: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
      secondary: "bg-neutral-800 text-white hover:bg-neutral-700 focus-visible:ring-neutral-600",
      outline:
        "border border-neutral-700 bg-transparent text-neutral-100 hover:bg-neutral-800 focus-visible:ring-neutral-500",
      ghost: "bg-transparent text-neutral-200 hover:bg-neutral-800/60 focus-visible:ring-neutral-500",
      danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "min-h-12 px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
