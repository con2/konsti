import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { QueueError } from "shared/types/api/errors";
import {
  makeErrorResult,
  makeSuccessResult,
  Result,
} from "shared/utils/result";
import { EmailSender } from "server/features/notifications/senderCommon";
import { emailNotificationWorker } from "server/features/notifications/emailNotificationWorker";

export enum NotificationTaskType {
  SEND_EMAIL_ACCEPTED,
  SEND_EMAIL_REJECTED,
}

export type NotificationTask = {
  type: NotificationTaskType;
  username: string;
  programItemId: string;
  programItemStartTime: string;
};

let queue: queueAsPromised<NotificationTask>;

export async function addNotificationsBulk(
  notifications: NotificationTask[],
): Promise<Result<boolean, QueueError>> {
  if (notifications.length == 0) {
    return makeSuccessResult(true);
  }

  try {
    notifications.forEach(addNotification);
    return makeSuccessResult(true);
  } catch {
    return makeErrorResult(QueueError.FAILED_TO_PUSH);
  }
}

export async function addNotification(
  notification: NotificationTask,
): Promise<Result<boolean, QueueError>> {
  if (!queue) {
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
  workerCount: number = 1,
): queueAsPromised<NotificationTask> {
  queue = fastq.promise(
    (notification) => emailNotificationWorker(notification, sender),
    workerCount,
  );
  return queue;
}

export function getQueue(): queueAsPromised<NotificationTask> {
  return queue;
}
