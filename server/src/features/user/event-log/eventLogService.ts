import { updateEventLogItem } from "server/features/user/event-log/eventLogRepository";
import {
  PostEventLogIsSeenError,
  PostEventLogIsSeenRequest,
  PostEventLogIsSeenResponse,
} from "shared/typings/api/eventLog";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const storeEventLogItem = async (
  request: PostEventLogIsSeenRequest,
): Promise<PostEventLogIsSeenResponse | PostEventLogIsSeenError> => {
  const updateEventLogItemResult = await updateEventLogItem(request);
  if (isErrorResult(updateEventLogItemResult)) {
    return {
      message: `Unable to update event log item`,
      status: "error",
      errorId: "unknown",
    };
  }

  const eventLogItems = unwrapResult(updateEventLogItemResult);

  if (!eventLogItems) {
    return {
      message: `Unable to update event log item`,
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    status: "success",
    message: "Event saved",
    eventLogItems,
  };
};
