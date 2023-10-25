import { ClientConfig, clientConfig } from "shared/config/clientConfig";
import { ServerConfig, serverConfig } from "shared/config/serverConfig";
import { SharedConfig, sharedConfig } from "shared/config/sharedConfig";

export const config = {
  client: (): ClientConfig => clientConfig,
  server: (): ServerConfig => serverConfig,
  shared: (): SharedConfig => sharedConfig,
};
