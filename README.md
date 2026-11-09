# MCP OSS Assistant

A TypeScript [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for working with open-source projects on GitHub. It currently provides a tool to fetch a pull request so an MCP-compatible assistant can inspect and summarize its details.

The server communicates over standard input/output (stdio) and uses Octokit to call the GitHub API, with Zod for tool input validation.

## Requirements

- Node.js 20 or newer
- npm
- An MCP client that supports local stdio servers
- A GitHub token with access to the repositories you want to query

## Setup

From the project directory, install dependencies and compile the server:

```sh
npm ci
npm run build
```

The compiled entry point is `build/index.js`.

Set `GITHUB_TOKEN` in the environment used to launch the server:

```sh
export GITHUB_TOKEN="YOUR_GITHUB_TOKEN"
```

The application reads `process.env.GITHUB_TOKEN`; it does not load `.env` files itself. Keep your real token out of source control.

## Connect an MCP client

For clients that use an `mcpServers` configuration, add an entry like this:

```json
{
  "mcpServers": {
    "oss-assistant": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-oss-assistant/build/index.js"],
      "env": {
        "GITHUB_TOKEN": "YOUR_GITHUB_TOKEN"
      }
    }
  }
}
```

Replace the path and token with your local values. If your client cannot find `node`, use the absolute path returned by `command -v node`. The configuration location and format depend on your MCP client.

You can also launch the server directly:

```sh
node build/index.js
```

It waits for MCP messages on stdin; it does not start an HTTP server or an interactive terminal prompt.

## Available tool

### `get_pull_request`

Fetches one GitHub pull request by repository owner, repository name, and pull request number.

| Argument      | Type     | Description                                          |
| ------------- | -------- | ---------------------------------------------------- |
| `owner`       | `string` | GitHub user or organization that owns the repository |
| `repo`        | `string` | Repository name                                      |
| `pull_number` | `number` | Pull request number                                  |

Example tool arguments:

```json
{
  "owner": "your-org",
  "repo": "your-repository",
  "pull_number": 42
}
```

Example prompt for your connected assistant:

> Fetch pull request #42 from your-org/your-repository and summarize its description and status.

The tool calls `GET /repos/{owner}/{repo}/pulls/{pull_number}` and returns the response data as formatted JSON in an MCP text content block. Request failures are returned as text beginning with `Error fetching pull request:`.

This tool retrieves pull request metadata. It does not separately fetch changed files, diffs, review comments, or checks, and it does not modify the repository.

## Development

```sh
# Compile TypeScript into build/
npm run build

# Check types without generating files
npx tsc --noEmit
```

### Tests

Run the automated suite:

```sh
npm test
```

This builds the TypeScript project and runs `node --test tests/*.test.mjs`. The tests use Node's built-in test runner (`node:test`), not Vitest. Although Vitest is currently installed, running these files with it produces `No test suite found`.

```sh
# Run the same checks used by the precommit test script
npm run test:precommit

# Watch tests after compiling the application
npm run build
node --test --watch tests/*.test.mjs
```

The tests import compiled files from `build/`. Rebuild after changing TypeScript source; when developing in watch mode, run `npm run watch` in a separate terminal.

- `tests/tools.test.mjs` checks tool output, GitHub error handling, input schemas, endpoint selection for pull requests and changed files, and empty changed-file results.
- `tests/server.test.mjs` launches the compiled server over STDIO, discovers all three tools, and checks that missing arguments are rejected. It exercises legacy MCP client compatibility.

GitHub requests in handler tests are mocked. The STDIO test uses discovery and invalid inputs only, so the suite requires no GitHub token or live network requests. It does not verify live GitHub authentication or API compatibility.

Two `test.todo` entries track checks-endpoint behavior and changed-files cursor pagination. TODOs are reminders, not passing coverage or test failures.

### Project structure

```text
src/
  index.ts                       # Starts the stdio transport
  server.ts                      # Creates the server and registers tools
  tools/
    get-pull-request/
      index.ts                   # Input schema and GitHub request handler
    types.ts                     # Shared tool handler types
tests/
  tools.test.mjs                 # Handler and schema tests
  server.test.mjs                # STDIO integration test
tsconfig.json                   # TypeScript compiler configuration
```

To add a tool, define its input schema and handler under `src/tools/`, then register it in `src/server.ts`. Use the MCP `CallToolResult` type for handler results and keep stdout reserved for protocol traffic; use stderr for diagnostic logs.

## Troubleshooting

- **Tests report “No test suite found”:** Run `npm test`, which uses Node's test runner. Do not run these `node:test` files with Vitest.
- **The client cannot launch the server:** Confirm that Node.js is available, run `npm run build`, and check the absolute path to `build/index.js`.
- **GitHub requests fail:** Confirm that the server process receives `GITHUB_TOKEN`, that the token can access the repository, and that the owner, repository name, and pull request number are correct. Inspect the returned error for details.
- **Changes are not taking effect:** Rebuild and restart the server through your MCP client.
- **Startup logs say “Weather MCP Server”:** Those messages are leftover labels in `src/index.ts`; the registered tool is `get_pull_request`.

## License

The package declares the ISC license in `package.json`.
