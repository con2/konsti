import { queueAsPromised, promise as queuePromise } from "fastq";
import { QueueError } from "shared/types/api/errors";
import { ProgramType } from "shared/types/models/programItem";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { EmailSender } from "server/features/notifications/email";
import {
  EmailNotificationOutcome,
  emailNotificationWorker,
} from "server/features/notifications/emailNotificationWorker";
import { logger } from "server/utils/logger";

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
  getQueue(): queueAsPromised<NotificationTask, EmailNotificationOutcome>;
  getSender(): EmailSender;
}

export function createNotificationQueueService(
  sender: EmailSender,
  workerCount = 1,
  stopOnStart = false,
): NotificationQueueService {
  // The worker logs each failure on its own, so this is the one line saying how a batch went.
  // Tallied inside the worker rather than off the push promise, because the queue calls drain
  // before the last task's promise settles.
  const outcomes = new Map<EmailNotificationOutcome, number>();
  const queue: queueAsPromised<NotificationTask, EmailNotificationOutcome> =
    queuePromise(async (notification: NotificationTask) => {
      const outcome = await emailNotificationWorker(sender, notification);
      outcomes.set(outcome, (outcomes.get(outcome) ?? 0) + 1);
      return outcome;
    }, workerCount);
  // fastq calls this hook each time the last running task finishes with nothing waiting, so it
  // runs once per batch, after all its emails have been processed
  queue.drain = () => {
    const count = (outcome: EmailNotificationOutcome): number =>
      outcomes.get(outcome) ?? 0;
    logger.info(
      `Email notification queue drained: ${count(EmailNotificationOutcome.SENT)} sent, ${count(EmailNotificationOutcome.SKIPPED)} skipped (no email address), ${count(EmailNotificationOutcome.FAILED)} failed`,
    );
    outcomes.clear();
  };

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
      // The promise push returns settles only once the task has run, and nothing waits for that
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
    getQueue(): queueAsPromised<NotificationTask, EmailNotificationOutcome> {
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
