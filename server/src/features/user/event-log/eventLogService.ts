import { updateEventLogItemIsSeen } from "server/features/user/event-log/eventLogRepository";
import {
  PostEventLogIsSeenRequest,
  PostEventLogIsSeenResponse,
} from "shared/types/api/eventLog";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const storeEventLogItemIsSeen = async (
  request: PostEventLogIsSeenRequest,
  username: string,
): Promise<PostEventLogIsSeenResponse> => {
  const updateEventLogItemResult = await updateEventLogItemIsSeen(
    request,
    username,
  );
  if (isErrorResult(updateEventLogItemResult)) {
    return {
      message: "Unable to update event log item isSeen",
      status: "error",
      errorId: "unknown",
    };
  }

  const eventLogItems = unwrapResult(updateEventLogItemResult);

  return {
    status: "success",
    message: "Event saved",
    eventLogItems,
  };
};
