export type ExportType =
  | "planning"
  | "backlog"
  | "execution"
  | "requirements"
  | "srs";

export const MARKERS: Record<
  ExportType,
  {
    start: string;
    end: string;
  }
> = {
  planning: {
    start: "[TASKOPS-PLANNING-START]",
    end: "[TASKOPS-PLANNING-END]",
  },
  backlog: {
    start: "[TASKOPS-BACKLOG-START]",
    end: "[TASKOPS-BACKLOG-END]",
  },
  execution: {
    start: "[TASKOPS-EXECUTION-START]",
    end: "[TASKOPS-EXECUTION-END]",
  },
  requirements: {
    start: "[TASKOPS-REQUIREMENTS-START]",
    end: "[TASKOPS-REQUIREMENTS-END]",
  },
  srs: {
    start: "[TASKOPS-SRS-START]",
    end: "[TASKOPS-SRS-END]",
  },
};

export const BACKLOG_SUBSECTION_MARKERS = {
  productStart: "[TASKOPS-BACKLOG-PRODUCT-START]",
  productEnd: "[TASKOPS-BACKLOG-PRODUCT-END]",
  priorityStart: "[TASKOPS-BACKLOG-PRIORITY-START]",
  priorityEnd: "[TASKOPS-BACKLOG-PRIORITY-END]",
};

export const TABLE_COLORS = {
  headerBg: { red: 0.102, green: 0.451, blue: 0.914 },
  headerText: { red: 1, green: 1, blue: 1 },
  rowAlt: { red: 0.91, green: 0.941, blue: 0.996 },
  rowNormal: { red: 1, green: 1, blue: 1 },
  border: { red: 0.827, green: 0.851, blue: 0.914 },
  titleText: { red: 0.067, green: 0.133, blue: 0.267 },
  subtitleText: { red: 0.4, green: 0.4, blue: 0.4 },
};
