import { vi } from "vitest";

type NotificationQueueModule = typeof import("server/utils/notificationQueue");

// The vi.mock factory for the notification queue module: the real module with the global
// queue lookup replaced, for a test to point at a queue of its own. vi.mock is hoisted
// above a file's imports, so a test file loads this through vi.hoisted.
export const mockNotificationQueueModule = async (
  importOriginal: () => Promise<NotificationQueueModule>,
): Promise<NotificationQueueModule> => {
  return {
    ...(await importOriginal()),
    getGlobalNotificationQueueService: vi.fn(),
  };
};
