import { updateEventLogItemIsSeen } from "server/features/user/event-log/eventLogRepository";
import {
  PostEventLogIsSeenRequest,
  PostEventLogIsSeenResponse,
} from "shared/types/api/eventLog";
export const storeEventLogItemIsSeen = async (
  request: PostEventLogIsSeenRequest,
  username: string,
): Promise<PostEventLogIsSeenResponse> => {
  const updateEventLogItemResult = await updateEventLogItemIsSeen(
    request,
    username,
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
