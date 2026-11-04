import { execSync } from "node:child_process";
import { frontOrigin } from "./utils/ports.ts";

// Builds the client for the real-device check with the front server's origin
// as its API URL. The build is a plain development build otherwise, so the
// dev-only test settings and endpoints the check seeds through are included.
execSync("yarn workspace client build:dev", {
  stdio: "inherit",
  // A PORT_OFFSET from the shell or a .env file would make the client config
  // bake in its own 127.0.0.1 API URL instead, which on the phone is the
  // phone itself
  env: { ...process.env, API_SERVER_URL: frontOrigin, PORT_OFFSET: "0" },
});
