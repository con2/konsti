import { ClientConfig, clientConfig } from "shared/config/clientConfig";
import { ServerConfig, serverConfig } from "shared/config/serverConfig";
import { EventConfig, eventConfig } from "shared/config/eventConfig";
import { SentryConfig, sentryConfig } from "shared/config/sentryConfig";

export const config = {
  client: (): ClientConfig => clientConfig,
  server: (): ServerConfig => serverConfig,
  sentry: (): SentryConfig => sentryConfig,
  event: (): EventConfig => eventConfig,
};
