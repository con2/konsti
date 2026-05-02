import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import { config } from "shared/config";
import {
  PostUpdateProgramItemsResponse,
  GetProgramItemsResponse,
} from "shared/types/api/programItems";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { enrichProgramItems } from "./programItemUtils";
import { Result, makeSuccessResult } from "shared/utils/result";
import { KompassiError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { getProgramItemsFromKompassi } from "server/kompassi/getProgramItemsFromKompassi";
import { kompassiProgramItemMapper } from "server/kompassi/kompassiProgramItemMapper";
import { UserGroup } from "shared/types/models/user";

export const getProgramItemsForEvent = async (): Promise<
  Result<readonly ProgramItem[], KompassiError>
> => {
  const eventName = config.event().eventName;
  const kompassiProgramItemsResult =
    await getProgramItemsFromKompassi(eventName);
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
