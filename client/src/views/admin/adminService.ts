import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const getSentryTest = async (): Promise<void> => {
  await api.get(ApiEndpoint.SENTRY_TEST);
};
