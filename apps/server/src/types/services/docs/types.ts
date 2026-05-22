// Export data types
export interface PlanningItem {
  id: string;
  number: number;
  teamSlug: string;
  title: string;
  description?: string;
  planInfo?: string;
  assignedUser?: string;
  status: string;
  priority: string;
  createdBy?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
}

export interface BacklogItem {
  id: string;
  number: number;
  teamSlug: string;
  title: string;
  description?: string;
  targetUser?: string;
  priority: string;
  reason?: string;
}

export interface ExecutionItem {
  id: string;
  number: number;
  teamSlug: string;
  title: string;
  assignedUser?: string;
  status: string;
  notes?: string;
  updatedAt: string;
}

export interface RequirementItem {
  id: string;
  type: "FR" | "NFR";
  description: string;
  priority: string;
  acceptanceCriteria?: string;
  nfrCategory?: string;
  createdAt: string;
  issue?: { id: string; number: number; title: string } | null;
}

// Document marker position
export interface MarkerPosition {
  found: boolean;
  contentStartIndex: number;
  contentEndIndex: number;
}

// Service account configuration
export interface ServiceAccountConfig {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
}

// Requirements Google Docs configuration
export interface RequirementsGoogleDocsConfig {
  teamId: string;
  googleDocsUrl: string | null;
}

// SRS Google Docs configuration
export interface SrsGoogleDocsConfig {
  teamId: string;
  googleDocsUrl: string | null;
}
