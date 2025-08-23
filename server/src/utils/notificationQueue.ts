import { promise as queuePromise } from "fastq";
import type { queueAsPromised } from "fastq";
import { QueueError } from "shared/types/api/errors";
import {
  makeErrorResult,
  makeSuccessResult,
  Result,
} from "shared/utils/result";
import { EmailSender } from "server/features/notifications/senderCommon";
import { emailNotificationWorker } from "server/features/notifications/emailNotificationWorker";
import { logger } from "server/utils/logger";

export enum NotificationTaskType {
  SEND_EMAIL_ACCEPTED,
  SEND_EMAIL_REJECTED,
}

export interface NotificationTask {
  type: NotificationTaskType;
  username: string;
  programItemId: string;
  programItemStartTime: string;
}

let queue: queueAsPromised<NotificationTask> | null = null;

export async function addNotificationsBulk(
  notifications: NotificationTask[],
): Promise<Result<boolean, QueueError>> {
  if (queue === null) {
    logger.error("Queue not initialized!");
    return makeErrorResult(QueueError.QUEUE_NOT_INITIALIZED);
  }

  if (notifications.length === 0) {
    return makeSuccessResult(true);
  }

  try {
    const promises: Promise<Result<boolean, QueueError>>[] = [];
    for (const notification of notifications) {
      promises.push(addNotification(notification));
    }
    await Promise.allSettled(promises);
    return makeSuccessResult(true);
  } catch {
    return makeErrorResult(QueueError.FAILED_TO_PUSH);
  }
}

async function addNotification(
  notification: NotificationTask,
): Promise<Result<boolean, QueueError>> {
  if (queue === null) {
    return makeErrorResult(QueueError.QUEUE_NOT_INITIALIZED);
  }

  try {
    await queue.push(notification);
    return makeSuccessResult(true);
  } catch {
    return makeErrorResult(QueueError.FAILED_TO_PUSH);
  }
}

export function setupEmailNotificationQueue(
  sender: EmailSender,
  workerCount = 1,
): queueAsPromised<NotificationTask> | null {
  try {
    queue = queuePromise(
      (notification) => emailNotificationWorker(notification, sender),
      workerCount,
    );
    return queue;
  } catch {
    logger.error("Failed to setup email notification queue");
  }
  return null;
}
