import {
  PostEventLogIsSeenRequest,
  PostEventLogIsSeenResponse,
} from "shared/types/api/eventLog";
import { updateEventLogItemIsSeen } from "server/features/user/event-log/eventLogRepository";

export const storeEventLogItemIsSeen = async (
  request: PostEventLogIsSeenRequest,
  userId: string,
): Promise<PostEventLogIsSeenResponse> => {
  const updateEventLogItemResult = await updateEventLogItemIsSeen(
    request,
    userId,
  );
  if (!updateEventLogItemResult.ok) {
    return {
      message: "Unable to update event log item isSeen",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    status: "success",
    message: "Event saved",
    eventLogItems: updateEventLogItemResult.value,
  };
};
