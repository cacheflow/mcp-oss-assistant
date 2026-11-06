import { McpServer } from "@modelcontextprotocol/server";
import { Octokit } from 'octokit';
import { getPullRequestTool } from './tools/get-pull-request/index.js';
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})


export function createServer() {
  const server = new McpServer({name: 'my-server', version: '1.0.0'})
  
  server.registerTool(
    getPullRequestTool.name,
    {
      description: getPullRequestTool.description,
      inputSchema: getPullRequestTool.schema,
    },
    async ({ owner, repo, pull_number }) => {
      return getPullRequestTool.handler({ client: octokit, owner, repo, pull_number });
    }
  );

  return server
}