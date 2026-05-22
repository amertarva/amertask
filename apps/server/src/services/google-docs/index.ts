// Main Google Docs Service - Re-exports all functionality

// Export types
export type {
  PlanningItem,
  BacklogItem,
  ExecutionItem,
  RequirementItem,
  MarkerPosition,
  ServiceAccountConfig,
  RequirementsGoogleDocsConfig,
  SrsGoogleDocsConfig,
} from "../../types/services/docs/types";

export type { ExportType } from "./constants";

// Export constants
export { MARKERS, BACKLOG_SUBSECTION_MARKERS, TABLE_COLORS } from "./constants";

// Export utilities
export {
  extractDocumentId,
  toIndonesianDateTime,
  toIndonesianDate,
  fmtStatus,
  fmtPriority,
} from "./utils";

// Export auth
export { getGoogleAuth } from "./auth";

// Export requirements management
export {
  getRequirementsGoogleDocsUrl,
  setRequirementsGoogleDocsUrl,
  getSrsGoogleDocsUrl,
  setSrsGoogleDocsUrl,
  copyRequirementsToGoogleDocs,
  copySrsToGoogleDocs,
} from "./requirements";

// Export tabs management
export {
  TAB_NAMES,
  getDocumentTabs,
  getOrCreateTab,
  clearTabContent,
  writeToTab,
} from "./tabs";

// Export document operations
export {
  getDocsClient,
  findMarkerPositions,
  ensureSectionMarkers,
} from "./document";

// Export main service object with export functions
import { exportPlanning } from "./export/planning";
import { exportBacklog } from "./export/backlog";
import { exportExecution } from "./export/execution";
import { exportRequirements } from "./export/requirements";
import { exportSrs } from "./export/srs";
import { extractDocumentId } from "./utils";

export const googleDocsService = {
  extractDocumentId,
  exportPlanning,
  exportBacklog,
  exportExecution,
  exportRequirements,
  exportSrs,
};
