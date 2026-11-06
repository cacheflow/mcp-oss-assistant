import { McpServer } from "@modelcontextprotocol/server";
import { z } from 'zod';
import { Octokit } from 'octokit';
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});
export function createServer() {
    const server = new McpServer({ name: 'my-server', version: '1.0.0' });
    server.registerTool("get_pull_request", {
        description: "Get a pull request from GitHub",
        inputSchema: z.object({
            owner: z.string().describe("Owner of the repository"),
            repo: z.string().describe("Repository name"),
            pull_number: z.number().describe("Pull request number"),
        }),
    }, async ({ owner, repo, pull_number }) => {
        const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
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
    });
}
