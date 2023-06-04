import { updateActionLogItem } from "server/features/user/action-log/actionLogRepository";
import {
  PostActionLogIsSeenError,
  PostActionLogIsSeenRequest,
  PostActionLogIsSeenResponse,
} from "shared/typings/api/actionLog";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const storeActionLogItem = async (
  request: PostActionLogIsSeenRequest
): Promise<PostActionLogIsSeenResponse | PostActionLogIsSeenError> => {
  const updateActionLogItemResult = await updateActionLogItem(request);
  if (isErrorResult(updateActionLogItemResult)) {
    return {
      message: `Unable to update action log item`,
      status: "error",
      errorId: "unknown",
    };
  }

  const actionLogItems = unwrapResult(updateActionLogItemResult);

  return {
    status: "success",
    actionLogItems,
  };
};
