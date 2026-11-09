import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Exercise the compiled entry point, not just the factory. No live GitHub calls.
test("STDIO server discovers tools and rejects invalid calls", { timeout: 15000 }, async (t) => {
  const client = new Client({ name: "oss-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL("../build/index.js", import.meta.url))],
    env: { PATH: process.env.PATH ?? "" },
    stderr: "pipe",
  });
  t.after(() => client.close());
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(({ name }) => name).sort(), [
    "get_changed_files",
    "get_checks",
    "get_pull_request",
  ]);
  for (const tool of tools) {
    assert.equal(tool.inputSchema.type, "object");
    assert.deepEqual([...tool.inputSchema.required].sort(), ["owner", "pull_number", "repo"]);
    assert.equal(tool.inputSchema.properties.pull_number.type, "number");
    // SDKs may surface validation failures as an error result or an RPC exception.
    let rejected = false;
    try {
      const result = await client.callTool({ name: tool.name, arguments: {} });
      rejected = result.isError === true;
    } catch (error) {
      assert.match(String(error), /invalid|required|validation/i);
      rejected = true;
    }
    assert.equal(rejected, true, `${tool.name} must reject missing arguments`);
  }
});
