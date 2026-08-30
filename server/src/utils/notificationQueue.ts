import { queueAsPromised, promise as queuePromise } from "fastq";
import { QueueError } from "shared/types/api/errors";
import { ProgramType } from "shared/types/models/programItem";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { EmailSender } from "server/features/notifications/email";
import { emailNotificationWorker } from "server/features/notifications/emailNotificationWorker";

export enum NotificationTaskType {
  SEND_EMAIL_ACCEPTED,
  SEND_EMAIL_REJECTED,
  SEND_EMAIL_PROGRAM_ITEM_CANCELLED,
  SEND_EMAIL_PROGRAM_ITEM_DELETED,
  SEND_EMAIL_PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
  SEND_EMAIL_PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
  SEND_EMAIL_PROGRAM_ITEM_TIME_CHANGED,
}

export interface NotificationTask {
  type: NotificationTaskType;
  username: string;
  programItemId: string;
  programItemStartTime: string;
  // The end of the last program item a batched lottery covered, paired with the start time above
  // so the rejection can name the whole span, and the program type to name what was lotteried
  lastProgramItemEndTime?: string;
  programType?: ProgramType;
  programItemTitle?: string;
}

export interface NotificationQueueService {
  addNotificationsBulk(
    notifications: NotificationTask[],
  ): Result<boolean, QueueError>;
  drain(): Promise<void>;
  kill(): Promise<void>;
  getItems(): NotificationTask[];
  getQueue(): queueAsPromised<NotificationTask>;
  getSender(): EmailSender;
}

export function createNotificationQueueService(
  sender: EmailSender,
  workerCount = 1,
  stopOnStart = false,
): NotificationQueueService {
  const queue: queueAsPromised<NotificationTask> = queuePromise(
    (notification: NotificationTask) =>
      emailNotificationWorker(sender, notification),
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
    getQueue(): queueAsPromised<NotificationTask> {
      return queue;
    },
    getSender(): EmailSender {
      return sender;
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
