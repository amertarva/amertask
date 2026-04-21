// components/ui/Avatar.tsx
import React from "react";
import { cn } from "@/lib/utils";
import type { User } from "@/types";
import type { AvatarProps } from "@/types";

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = "md",
  className,
}) => {
  const sizeStyles = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={cn("rounded-full object-cover", sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
        sizeStyles[size],
        className,
      )}
    >
      {user.initials}
    </div>
  );
};
