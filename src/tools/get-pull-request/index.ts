import type { CallToolResult } from "@modelcontextprotocol/server";
import { z } from 'zod';
import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

const getPullRequestHandler = async ({ client, owner, repo, pull_number }: {
  client: Octokit,
  owner: string,
  repo: string,
  pull_number: number
}): Promise<CallToolResult> => {
    try {
      const response = await client.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: Number(pull_number),
      headers: {
        'X-GitHub-Api-Version': '2026-03-10'
      }
    });

    if (!response) {
      return {
        content: [
            {
            type: "text",
            text: "Failed to retrieve pull request data",
            },
        ],
      };
    }

    const features = response?.data ?? [];

    if (!Object.keys(features).length) {
      return {
        content: [
            {
            type: "text",
            text: `No active pull requests for ${owner}/${repo} #${pull_number}`,
            },
        ],
      };
    }

    return {
        content: [
        {
          type: "text",
          text: JSON.stringify(features, null, 2),
        },
        ],
    };
    } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error fetching pull request: ${error}`,
        },
      ],
    };
    }
}

export const getPullRequestTool = {
  name: "get_pull_request",
  description: "Get a pull request from GitHub",
  schema:  z.object({
    owner: z.string().describe("Owner of the repository"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number"),
  }),
  handler: getPullRequestHandler
}