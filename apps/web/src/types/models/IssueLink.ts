export interface IssueLink {
  id: string;
  label: string;
  url: string;
  type: "slack" | "github" | "figma" | "other";
}
