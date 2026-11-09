import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.js";

serveStdio(createServer, {
  onerror: (error) => console.error("MCP OSS Assistant Server error:", error),
});

console.error(`MCP OSS Assistant Server running on stdio`);
