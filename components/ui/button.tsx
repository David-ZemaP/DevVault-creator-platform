import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 focus-visible:ring-blue-500 shadow-sm shadow-blue-500/10",
      secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-800/90 focus-visible:ring-slate-500 border border-slate-700/60",
      outline:
        "border border-slate-700/80 bg-transparent text-slate-200 hover:bg-slate-800/80 hover:text-white hover:border-slate-600 focus-visible:ring-blue-500",
      ghost: "bg-transparent text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 focus-visible:ring-blue-500",
      danger: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 focus-visible:ring-rose-500",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
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
