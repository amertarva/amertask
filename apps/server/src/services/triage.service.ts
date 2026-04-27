export { listUntriagedIssues } from "./triage/triage-query.service";
export { acceptIssue } from "./triage/triage-accept.service";
export { declineIssue } from "./triage/triage-decline.service";

import { listUntriagedIssues } from "./triage/triage-query.service";
import { acceptIssue } from "./triage/triage-accept.service";
import { declineIssue } from "./triage/triage-decline.service";

export const triageService = {
  getTriageIssues: listUntriagedIssues,
  acceptIssue,
  declineIssue,
};
