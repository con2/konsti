import { ClientConfig, clientConfig } from "shared/config/clientConfig";
import { eventConfig } from "shared/config/eventConfig";
import { EventConfig } from "shared/config/eventConfigTypes";
import { SentryConfig, sentryConfig } from "shared/config/sentryConfig";
import { ServerConfig, serverConfig } from "shared/config/serverConfig";

export const config = {
  client: (): ClientConfig => clientConfig,
  server: (): ServerConfig => serverConfig,
  sentry: (): SentryConfig => sentryConfig,
  event: (): EventConfig => eventConfig,
};
