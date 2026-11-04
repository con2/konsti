import { resolvePortOffset } from "../../scripts/portOffset.ts";

// The same per-worktree offset the dev servers use, so the check targets the
// instance of the checkout it runs from
const portOffset = resolvePortOffset();

export const apiPort = 5000 + portOffset;
export const frontPort = 8000 + portOffset;

// On iOS devices BrowserStack Local maps this host to the tunnel, while
// 127.0.0.1 and localhost are the phone itself
const tunnelHost = "bs-local.com";

// The origin the phone loads the app from. The client build must bake the
// same origin in as its API URL, so the page and the API are one origin and
// the server's CORS allowlist is not involved.
export const frontOrigin = `http://${tunnelHost}:${frontPort}`;
