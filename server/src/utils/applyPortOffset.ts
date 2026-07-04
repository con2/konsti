import { resolvePortOffset } from "scripts/portOffset";

// Preloaded via --import in the dev/test start scripts and the dev database
// scripts, before any module reads shared/config/serverConfig.ts. Materializes
// the per-worktree port offset into the env so the server port, dev database
// name, and runtime readers (e.g. the Kompassi mock base URL) agree with the
// client and Playwright of the same worktree. The resolver can't be called
// from serverConfig itself because shared config is also bundled into the
// client, where Node builtins don't exist
process.env.PORT_OFFSET = String(resolvePortOffset());
