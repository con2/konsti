import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramType } from "shared/types/models/programItem";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { saveSignupQuestion } from "server/features/settings/settingsRepository";

export const addSignupQuestions = async (): Promise<
  Result<void, MongoDbError>
> => {
  const {
    signupQuestions,
    tournamentSignupQuestion,
    tournamentSignupQuestionExcludeIds,
  } = config.event();

  const questionResults = await Promise.all(
    signupQuestions.map(async (signupQuestion) => {
      return await saveSignupQuestion(signupQuestion);
    }),
  );
  const failedQuestion = questionResults.find((result) => !result.ok);
  if (failedQuestion) {
    return makeErrorResult(failedQuestion.error);
  }

  // Most tournaments have same private sign-up question where attendee contact details are asked
  if (!tournamentSignupQuestion) {
    return makeSuccessResult();
  }

  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return makeErrorResult(programItemsResult.error);
  }
  const tournaments = programItemsResult.value
    .filter((programItem) => programItem.programType === ProgramType.TOURNAMENT)
    .filter(
      (programItem) =>
        !tournamentSignupQuestionExcludeIds.includes(programItem.programItemId),
    );

  const tournamentResults = await Promise.all(
    tournaments.map(async (tournament) => {
      return await saveSignupQuestion({
        ...tournamentSignupQuestion,
        programItemId: tournament.programItemId,
      });
    }),
  );
  const failedTournament = tournamentResults.find((result) => !result.ok);
  if (failedTournament) {
    return makeErrorResult(failedTournament.error);
  }
  return makeSuccessResult();
};
