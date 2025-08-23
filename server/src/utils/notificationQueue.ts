import { promise as queuePromise, queueAsPromised } from "fastq";
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

export interface NotificationTask {
  type: NotificationTaskType;
  username: string;
  programItemId: string;
  programItemStartTime: string;
}

export interface NotificationQueueService {
  addNotificationsBulk(
    notifications: NotificationTask[],
  ): Result<boolean, QueueError>;
  drain(): Promise<void>;
  kill(): Promise<void>;
  getItems(): NotificationTask[];
  getSender(): EmailSender;
  getQueue(): queueAsPromised<NotificationTask>;
}

export function createNotificationQueueService(
  sender: EmailSender,
  workerCount = 1,
  stopOnStart = false,
): NotificationQueueService {
  const queue: queueAsPromised<NotificationTask> = queuePromise(
    (notification: NotificationTask) =>
      emailNotificationWorker(notification, sender),
    workerCount,
  );

  if (stopOnStart) {
    queue.pause();
  }

  function addNotificationsBulk(
    notifications: NotificationTask[],
  ): Result<boolean, QueueError> {
    if (notifications.length === 0) {
      return makeSuccessResult(true);
    }

    try {
      for (const notification of notifications) {
        addNotification(notification);
      }
      return makeSuccessResult(true);
    } catch {
      return makeErrorResult(QueueError.FAILED_TO_PUSH);
    }
  }

  function addNotification(
    notification: NotificationTask,
  ): Result<boolean, QueueError> {
    try {
      // Promise returned by push is fullfilled after task is completed.
      void queue.push(notification);
      return makeSuccessResult(true);
    } catch {
      return makeErrorResult(QueueError.FAILED_TO_PUSH);
    }
  }

  return {
    addNotificationsBulk,
    drain: async () => {
      await queue.drain();
    },
    kill: async () => {
      await queue.kill();
    },
    getItems(): NotificationTask[] {
      return queue.getQueue();
    },
    getSender(): EmailSender {
      return sender;
    },
    getQueue(): queueAsPromised<NotificationTask> {
      return queue;
    },
  };
}

let globalNotificationQueueService: NotificationQueueService | null = null;

export function setGlobalNotificationQueueService(
  service: NotificationQueueService | null,
): void {
  globalNotificationQueueService = service;
}

export function getGlobalNotificationQueueService(): NotificationQueueService | null {
  return globalNotificationQueueService;
}
