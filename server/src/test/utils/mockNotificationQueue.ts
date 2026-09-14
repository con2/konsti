import { vi } from "vitest";
import { EmailSender } from "server/features/notifications/email";
import {
  NotificationQueueService,
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";

// The test file must still vi.mock the notification queue module itself, since vi.mock is
// hoisted per file and cannot be registered from here. Returns the queue so a test can read
// what was queued without going through the nullable global getter
export const mockNotificationQueue = (): NotificationQueueService => {
  const queueService = createNotificationQueueService(
    new EmailSender(),
    1,
    true,
  );
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(queueService);
  return queueService;
};
