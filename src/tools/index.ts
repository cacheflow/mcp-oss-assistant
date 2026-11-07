
import { getChangedFilesTool } from "./get-changed-files/index.js";
import { getChecksTool } from "./get-checks/index.js";
import { getPullRequestTool } from "./get-pull-request/index.js";

export const tools = {
  getChangedFiles: getChangedFilesTool,
  getChecks: getChecksTool,
  getPullRequest: getPullRequestTool,
}