import type { CallToolResult } from "@modelcontextprotocol/server";
import type { Octokit } from "octokit";
import type { z } from "zod";

export type ToolInput<TSchema extends z.ZodObject> = z.output<TSchema> & {
  client: Octokit;
};

export interface ToolHandler<TSchema extends z.ZodObject> {
  name: string;
  description: string;
  schema: TSchema;
  handler: (args: ToolInput<TSchema>) => Promise<CallToolResult>;
}
