import type { User } from "../models/User";

export interface AvatarProps {
  user: Pick<User, "name" | "avatar" | "initials">;
  size?: "sm" | "md" | "lg";
  className?: string;
}
