import { McpServer } from "@modelcontextprotocol/server";
import { Octokit } from "octokit";
import { tools } from "./tools/index.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export function createServer() {
  const server = new McpServer({ name: "my-server", version: "1.0.0" });

  const { getPullRequest, getChangedFiles, getChecks } = tools;

  server.registerTool(
    getPullRequest.name,
    {
      description: getPullRequest.description,
      inputSchema: getPullRequest.schema,
    },
    async ({ owner, repo, pull_number }) => {
      return getPullRequest.handler({
        client: octokit,
        owner,
        repo,
        pull_number,
      });
    },
  );

  server.registerTool(
    getChangedFiles.name,
    {
      description: getChangedFiles.description,
      inputSchema: getChangedFiles.schema,
    },
    async ({ owner, repo, pull_number }) => {
      return getChangedFiles.handler({
        client: octokit,
        owner,
        repo,
        pull_number,
      });
    },
  );

  server.registerTool(
    getChecks.name,
    {
      description: getChecks.description,
      inputSchema: getChecks.schema,
    },
    async ({ owner, repo, pull_number }) => {
      return getChecks.handler({ client: octokit, owner, repo, pull_number });
    },
  );

  return server;
}
