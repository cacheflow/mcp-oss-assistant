import type { CallToolResult } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { ToolHandler, ToolInput } from "../types.js";

const inputSchema = z.object({
  owner: z.string().describe("Owner of the repository"),
  repo: z.string().describe("Repository name"),
  pull_number: z.number().describe("Pull request number"),
});

const getChecks = async ({
  client,
  owner,
  repo,
  pull_number,
}: ToolInput<typeof inputSchema>): Promise<CallToolResult> => {
  try {
    const response = await client.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/check-runs",
      {
        owner,
        repo,
        pull_number: Number(pull_number),
        headers: {
          "X-GitHub-Api-Version": "2026-03-10",
        },
      },
    );

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
            text: `No checks for requested pull request ${owner}/${repo} #${pull_number}`,
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
};

export const getChecksTool = {
  name: "get_checks",
  description: "Get checks from a pull request on GitHub",
  schema: inputSchema,
  handler: getChecks,
} satisfies ToolHandler<typeof inputSchema>;
