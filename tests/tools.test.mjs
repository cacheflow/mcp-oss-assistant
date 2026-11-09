import assert from "node:assert/strict";
import { test } from "node:test";
import { tools } from "../build/tools/index.js";

const args = { owner: "example", repo: "project", pull_number: 42 };
const cases = [
  [tools.getPullRequest, { number: 42, title: "Fix parsing", body: "Unicode: café" }],
  [tools.getChangedFiles, [{ filename: "src/index.ts", status: "modified", additions: 3 }]],
  [tools.getChecks, { total_count: 1, check_runs: [{ name: "test", conclusion: "success" }] }],
];

function text(result) {
  assert.ok(Array.isArray(result.content));
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, "text");
  assert.equal(typeof result.content[0].text, "string");
  return result.content[0].text;
}

for (const [tool, data] of cases) {
  test(`${tool.name}: returns GitHub data as valid MCP text`, async () => {
    let calls = 0;
    const client = {
      request: async (_route, params) => {
        calls++;
        assert.equal(params.owner, args.owner);
        assert.equal(params.repo, args.repo);
        assert.equal(params.pull_number, args.pull_number);
        return { data };
      },
    };
    const result = await tool.handler({ ...args, client });
    assert.deepEqual(JSON.parse(text(result)), data);
    assert.equal(calls, 1);
  });

  test(`${tool.name}: reports GitHub failures without throwing`, async () => {
    const client = {
      request: async () => {
        throw new Error("GitHub unavailable");
      },
    };
    const result = await tool.handler({ ...args, client });
    assert.match(text(result), /GitHub unavailable/);
  });

  test(`${tool.name}: rejects missing or incorrectly typed inputs`, () => {
    assert.equal(tool.schema.safeParse(args).success, true);
    for (const key of ["owner", "repo", "pull_number"]) {
      const missing = { ...args };
      delete missing[key];
      assert.equal(tool.schema.safeParse(missing).success, false, key);
    }
    assert.equal(tool.schema.safeParse({ ...args, pull_number: "42" }).success, false);
  });
}

for (const [tool, route] of [
  [tools.getPullRequest, "GET /repos/{owner}/{repo}/pulls/{pull_number}"],
  [tools.getChangedFiles, "GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
]) {
  test(`${tool.name}: uses the expected GitHub endpoint`, async () => {
    const client = {
      request: async (actual) => {
        assert.equal(actual, route);
        return { data: { ok: true } };
      },
    };
    // Assert outside the handler too, because handlers catch exceptions.
    assert.deepEqual(JSON.parse(text(await tool.handler({ ...args, client }))), { ok: true });
  });
}

test("get_changed_files: describes an empty file list", async () => {
  const client = { request: async () => ({ data: [] }) };
  assert.match(text(await tools.getChangedFiles.handler({ ...args, client })), /No changed files/);
});

test.todo("get_checks: resolve the PR head SHA and request commit check runs");
test.todo("get_changed_files: implement and verify cursor pagination");
