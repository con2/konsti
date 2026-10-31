import { vi } from "vitest";

// What vi.mock(import("server/utils/notificationQueue")) installs without a factory: the real
// module with the global queue lookup replaced, for a test to point at a queue of its own
const actual = await vi.importActual<
  typeof import("server/utils/notificationQueue")
>("server/utils/notificationQueue");

export const {
  NotificationTaskType,
  createNotificationQueueService,
  setGlobalNotificationQueueService,
} = actual;

export const getGlobalNotificationQueueService = vi.fn();
