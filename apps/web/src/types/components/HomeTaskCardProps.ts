export interface HomeTaskCardProps {
  id: string;
  title: string;
  tag: string;
  priority: "high" | "medium" | "low";
  active?: boolean;
  assignee?: {
    initials: string;
    color: string;
  };
}
