import { Request, Response } from "express";
import { config } from "shared/config";
import { PostEmailTestRequest } from "shared/test-types/api/testData";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { getLotteriedSpan } from "server/features/assignment/utils/addAssignmentNotifications";
import { EmailSender } from "server/features/notifications/email";
import {
  EmailMessage,
  buildEmail,
  getAcceptedEmailTemplate,
  getProgramItemCancelledEmailTemplate,
  getProgramItemDeletedEmailTemplate,
  getProgramItemNoKonstiSignupEmailTemplate,
  getProgramItemNoLotteryEmailTemplate,
  getProgramItemTimeChangedEmailTemplate,
  getRejectedEmailTemplate,
} from "server/features/notifications/senderCommon";
import {
  findProgramItemById,
  findProgramItems,
} from "server/features/program-item/programItemRepository";
import { logger } from "server/utils/logger";
import {
  NotificationTask,
  NotificationTaskType,
} from "server/utils/notificationQueue";

interface GetBatchedRejectionEmailParams {
  parentId: string;
  batchStartTime: string;
  notificationType: EmailNotificationTrigger;
  email: string;
  fromAddress: string;
}

// Built from the batch's own program items through the same span helper a run uses, so what the
// admin reads in their inbox is what a rejected attendee would have read
const getBatchedRejectionEmail = async ({
  parentId,
  batchStartTime,
  notificationType,
  email,
  fromAddress,
}: GetBatchedRejectionEmailParams): Promise<Result<EmailMessage, string>> => {
  if (notificationType !== EmailNotificationTrigger.REJECTED) {
    return makeErrorResult(
      `${parentId} is a batch, which only the ${EmailNotificationTrigger.REJECTED} message covers`,
    );
  }

  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return makeErrorResult("Failed to read the programme");
  }

  const batchProgramItems = programItemsResult.value.filter(
    (programItem) => programItem.parentId === parentId,
  );
  if (batchProgramItems.length === 0) {
    return makeErrorResult(`No program items are in batch ${parentId}`);
  }

  const mockNotification: NotificationTask = {
    username: "test-user",
    // A rejection names no program item, the same as the one a run writes
    programItemId: "",
    type: NotificationTaskType.SEND_EMAIL_REJECTED,
    ...getLotteriedSpan(batchProgramItems, batchStartTime),
  };

  return makeSuccessResult(
    buildEmail(getRejectedEmailTemplate(mockNotification), email, fromAddress),
  );
};

export const postEmailTest = async (
  req: Request<unknown, unknown, PostEmailTestRequest>,
  res: Response,
): Promise<Response> => {
  const { email, notificationType, programId } = req.body;

  try {
    const fromAddress = config.server().emailSendFromAddress;

    // A batched lottery decides several starting times at once and its rejection names the span
    // rather than one hour, so it has no single program item to be tested through. The parent
    // the batch is configured under stands in for it.
    const batchStartTime = config.event().startTimesByParentIds.get(programId);
    if (batchStartTime !== undefined) {
      const batchMessageResult = await getBatchedRejectionEmail({
        parentId: programId,
        batchStartTime,
        notificationType,
        email,
        fromAddress,
      });
      if (!batchMessageResult.ok) {
        return res.status(400).json({ message: batchMessageResult.error });
      }
      await new EmailSender().sendEmail(batchMessageResult.value);
      logger.info(`Test email sent to ${email} for batch ${programId}`);
      return res.status(200).json({ message: "Test email sent successfully" });
    }

    const programItemResult = await findProgramItemById(programId);
    if (!programItemResult.ok) {
      logger.error(
        new Error(`Failed to find program for programItemId ${programId}`),
      );
      return res.status(500).json({ message: "Failed to send test email" });
    }

    const baseMockNotification = {
      username: "test-user",
      programItemId: programId,
      programItemStartTime: programItemResult.value.startTime,
    };
    const programTitle = programItemResult.value.title;

    let message: EmailMessage;

    switch (notificationType) {
      case EmailNotificationTrigger.ACCEPTED: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_ACCEPTED,
        };
        message = buildEmail(
          getAcceptedEmailTemplate(programTitle, mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      case EmailNotificationTrigger.REJECTED: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_REJECTED,
        };
        message = buildEmail(
          getRejectedEmailTemplate(mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      case EmailNotificationTrigger.PROGRAM_ITEM_CANCELLED: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_CANCELLED,
          programItemTitle: programTitle,
        };
        message = buildEmail(
          getProgramItemCancelledEmailTemplate(mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      case EmailNotificationTrigger.PROGRAM_ITEM_DELETED: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_DELETED,
          programItemTitle: programTitle,
        };
        message = buildEmail(
          getProgramItemDeletedEmailTemplate(mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      case EmailNotificationTrigger.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
          programItemTitle: programTitle,
        };
        message = buildEmail(
          getProgramItemNoKonstiSignupEmailTemplate(mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      case EmailNotificationTrigger.PROGRAM_ITEM_NO_LOTTERY_ANYMORE: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
          programItemTitle: programTitle,
        };
        message = buildEmail(
          getProgramItemNoLotteryEmailTemplate(mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      case EmailNotificationTrigger.PROGRAM_ITEM_TIME_CHANGED: {
        const mockNotification: NotificationTask = {
          ...baseMockNotification,
          type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_TIME_CHANGED,
          programItemTitle: programTitle,
        };
        message = buildEmail(
          getProgramItemTimeChangedEmailTemplate(mockNotification),
          email,
          fromAddress,
        );
        break;
      }
      default:
        return res.status(400).json({ message: "Invalid notification type" });
    }

    const emailSender = new EmailSender();
    await emailSender.sendEmail(message);

    logger.info(
      `Test email sent to ${email} for notification type ${notificationType}`,
    );
    return res.status(200).json({ message: "Test email sent successfully" });
  } catch (error) {
    logger.error(new Error("Failed to send test email", { cause: error }));
    return res.status(500).json({ message: "Failed to send test email" });
  }
};
