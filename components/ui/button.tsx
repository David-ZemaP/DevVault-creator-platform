import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

    const variantStyles = {
      primary:
        "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700 shadow-sm dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 focus-visible:ring-zinc-400",
      secondary:
        "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:border-zinc-700/60 focus-visible:ring-zinc-500",
      outline:
        "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white focus-visible:ring-zinc-500",
      ghost:
        "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 focus-visible:ring-zinc-500",
      danger:
        "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/30 dark:text-rose-400 focus-visible:ring-rose-500",
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
