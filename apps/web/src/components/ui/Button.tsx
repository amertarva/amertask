// components/ui/Button.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonProps } from "@/types";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const variantStyles = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-95",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-background-tertiary",
      ghost: "hover:bg-muted text-foreground",
      destructive: "bg-priority-urgent text-primary-foreground hover:bg-priority-urgent/90",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        suppressHydrationWarning
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded font-medium transition-all duration-150 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
