// Bootstrap loader kept for compatibility with project scripts that expect server.js at repo root.
// It simply forwards to the actual server implementation inside ./src.

try {
  require("./src/server.js");
} catch (err) {
  console.error("Failed to load ./src/server.js:", err);
  // Re-throw so the process exits with a useful error code when run under node --watch
  throw err;
}
