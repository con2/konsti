import { findProgramItems } from "server/features/program-item/programItemRepository";
import { saveSignupQuestion } from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { ProgramType } from "shared/types/models/programItem";

export const addSignupQuestions = async (): Promise<void> => {
  const {
    signupQuestions,
    tournamentSignupQuestion,
    tournamentSignupQuestionExcludeIds,
  } = config.event();

  const questionPromises = signupQuestions.map(async (signupQuestion) => {
    await saveSignupQuestion(signupQuestion);
  });
  await Promise.all(questionPromises);

  // Most tournaments have same private signup question where attendee contact details are asked
  if (!tournamentSignupQuestion) {
    return;
  }

  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    logger.error(
      "%s",
      new Error(`Error finding program items: ${programItemsResult.error}`),
    );
    return;
  }
  const tournaments = programItemsResult.value
    .filter((programItem) => programItem.programType === ProgramType.TOURNAMENT)
    .filter(
      (programItem) =>
        !tournamentSignupQuestionExcludeIds.includes(programItem.programItemId),
    );

  const tournamentPromises = tournaments.map(async (tournament) => {
    await saveSignupQuestion({
      ...tournamentSignupQuestion,
      programItemId: tournament.programItemId,
    });
  });
  await Promise.all(tournamentPromises);
};
