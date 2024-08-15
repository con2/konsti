import { ClientConfig, clientConfig } from "shared/config/clientConfig";
import { ServerConfig, serverConfig } from "shared/config/serverConfig";
import { SharedConfig, sharedConfig } from "shared/config/sharedConfig";
import { SentryConfig, sentryConfig } from "shared/config/sentryConfig";

export const config = {
  client: (): ClientConfig => clientConfig,
  server: (): ServerConfig => serverConfig,
  sentry: (): SentryConfig => sentryConfig,
  shared: (): SharedConfig => sharedConfig,
};
