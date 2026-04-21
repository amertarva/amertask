import React from "react";

export interface TaskCardProps {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  priority: string;
  avatar: React.ReactNode;
  avatarColor: string;
}
