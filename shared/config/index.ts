import { ClientConfig, clientConfig } from "shared/config/clientConfig";
import { ServerConfig, serverConfig } from "shared/config/serverConfig";
import { SentryConfig, sentryConfig } from "shared/config/sentryConfig";
import { eventConfig } from "shared/config/eventConfig";
import { EventConfig } from "shared/config/eventConfigTypes";

export const config = {
  client: (): ClientConfig => clientConfig,
  server: (): ServerConfig => serverConfig,
  sentry: (): SentryConfig => sentryConfig,
  event: (): EventConfig => eventConfig,
};
