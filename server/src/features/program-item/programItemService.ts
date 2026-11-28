import { config } from "shared/config";
import { KompassiError } from "shared/types/api/errors";
import {
  GetProgramItemsResponse,
  PostUpdateProgramItemsResponse,
} from "shared/types/api/programItems";
import { ProgramItem } from "shared/types/models/programItem";
import { UserGroup } from "shared/types/models/user";
import { Result, makeSuccessResult } from "shared/utils/result";
import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { isAssignmentInProgress } from "server/features/settings/settingsRepository";
import { getProgramItemsFromKompassi } from "server/kompassi/getProgramItemsFromKompassi";
import { kompassiProgramItemMapper } from "server/kompassi/kompassiProgramItemMapper";
import { enrichProgramItems } from "./programItemUtils";

export const getProgramItemsForEvent = async (): Promise<
  Result<readonly ProgramItem[], KompassiError>
> => {
  const kompassiProgramItemsResult = await getProgramItemsFromKompassi();
  if (!kompassiProgramItemsResult.ok) {
    return kompassiProgramItemsResult;
  }

  return makeSuccessResult(
    kompassiProgramItemMapper(kompassiProgramItemsResult.value),
  );
};

export const updateProgramItems =
  async (): Promise<PostUpdateProgramItemsResponse> => {
    const programItemsResult = await getProgramItemsForEvent();
    if (!programItemsResult.ok) {
      return {
        message: "Loading program items from Kompassi failed",
        status: "error",
        errorId: "kompassiError",
      };
    }

    // A running lottery decides by the programme it read, so a change saved under it could
    // place attendees in a program item that has moved or gone. Checked after the slow fetch, so
    // a lottery that started meanwhile is seen.
    const assignmentInProgressResult = await isAssignmentInProgress();
    if (!assignmentInProgressResult.ok) {
      return {
        message: "Program items db update failed: Error checking lottery",
        status: "error",
        errorId: "unknown",
      };
    }
    if (assignmentInProgressResult.value) {
      return {
        message: "Lottery in progress, program items not updated",
        status: "error",
        errorId: "assignmentInProgress",
      };
    }

    const saveProgramItemsResult = await saveProgramItems(
      programItemsResult.value,
    );
    if (!saveProgramItemsResult.ok) {
      return {
        message: "Program items db update failed: Saving program items failed",
        status: "error",
        errorId: "unknown",
      };
    }

    if (config.server().updateProgramItemPopularityEnabled) {
      const updateProgramItemPopularityResult =
        await updateProgramItemPopularity();
      if (!updateProgramItemPopularityResult.ok) {
        return {
          message: "Program item popularity update failed",
          status: "error",
          errorId: "unknown",
        };
      }
    }

    const updatedProgramItemsResult = await findProgramItems();
    if (!updatedProgramItemsResult.ok) {
      return {
        message:
          "Program items db update failed: Error loading updated program items",
        status: "error",
        errorId: "unknown",
      };
    }

    return {
      message: "Program items db updated",
      status: "success",
      programItems: updatedProgramItemsResult.value,
    };
  };

export const fetchProgramItems = async (
  userGroup: UserGroup | null,
): Promise<GetProgramItemsResponse> => {
  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return {
      message: "Downloading program items failed",
      status: "error",
      errorId: "databaseError",
    };
  }
  const programItemsWithAttendeesResult = await enrichProgramItems(
    programItemsResult.value,
    userGroup,
  );
  if (!programItemsWithAttendeesResult.ok) {
    return {
      message: "Enriching program items failed",
      status: "error",
      errorId: "unknown",
    };
  }
  return {
    message: "Program items downloaded",
    status: "success",
    programItems: programItemsWithAttendeesResult.value,
  };
};
