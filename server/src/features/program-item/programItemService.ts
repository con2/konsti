import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import { config } from "shared/config";
import {
  PostUpdateProgramItemsResponse,
  GetProgramItemsResponse,
  PostUpdateProgramItemsError,
  GetProgramItemsError,
} from "shared/types/api/programItems";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { enrichProgramItems } from "./programItemUtils";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { KompassiError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { getProgramItemsFromKompassi } from "server/kompassi/getProgramItemsFromKompassi";
import { kompassiProgramItemMapper } from "server/kompassi/kompassiProgramItemMapper";

export const getProgramItemsForConvention = async (): Promise<
  Result<readonly ProgramItem[], KompassiError>
> => {
  const conventionName = config.event().conventionName;
  const kompassiProgramItemsResult =
    await getProgramItemsFromKompassi(conventionName);
  if (isErrorResult(kompassiProgramItemsResult)) {
    return kompassiProgramItemsResult;
  }

  const kompassiProgramItems = unwrapResult(kompassiProgramItemsResult);
  return makeSuccessResult(kompassiProgramItemMapper(kompassiProgramItems));
};

export const updateProgramItems = async (): Promise<
  PostUpdateProgramItemsResponse | PostUpdateProgramItemsError
> => {
  const programItemsResult = await getProgramItemsForConvention();
  if (isErrorResult(programItemsResult)) {
    return {
      message: "Loading program items from Kompassi failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const programItems = unwrapResult(programItemsResult);
  const saveProgramItemsResult = await saveProgramItems(programItems);
  if (isErrorResult(saveProgramItemsResult)) {
    return {
      message: "Program items db update failed: Saving program items failed",
      status: "error",
      errorId: "unknown",
    };
  }

  if (config.server().updateProgramItemPopularityEnabled) {
    const updateProgramItemPopularityResult =
      await updateProgramItemPopularity();
    if (isErrorResult(updateProgramItemPopularityResult)) {
      return {
        message: "Program item popularity update failed",
        status: "error",
        errorId: "unknown",
      };
    }
  }

  const updatedProgramItemsResult = await findProgramItems();
  if (isErrorResult(updatedProgramItemsResult)) {
    return {
      message:
        "Program items db update failed: Error loading updated program items",
      status: "error",
      errorId: "unknown",
    };
  }

  const updatedProgramItems = unwrapResult(updatedProgramItemsResult);

  return {
    message: "Program items db updated",
    status: "success",
    programItems: updatedProgramItems,
  };
};

export const fetchProgramItems = async (): Promise<
  GetProgramItemsResponse | GetProgramItemsError
> => {
  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return {
      message: `Downloading program items failed`,
      status: "error",
      errorId: "unknown",
    };
  }

  const programItems = unwrapResult(programItemsResult);

  const programItemsWithAttendeesResult =
    await enrichProgramItems(programItems);
  if (isErrorResult(programItemsWithAttendeesResult)) {
    return {
      message: `Downloading program items failed`,
      status: "error",
      errorId: "unknown",
    };
  }

  const programItemsWithAttendees = unwrapResult(
    programItemsWithAttendeesResult,
  );

  return {
    message: "Program items downloaded",
    status: "success",
    programItems: programItemsWithAttendees,
  };
};
