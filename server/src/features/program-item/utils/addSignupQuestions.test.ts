import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { addSignupQuestions } from "server/features/program-item/utils/addSignupQuestions";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { findSettings } from "server/features/settings/settingsRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { ProgramType } from "shared/types/models/programItem";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  vi.resetAllMocks();
  await mongoose.disconnect();
});

const signupQuestion: SignupQuestion = {
  programItemId: testProgramItem.programItemId,
  questionFi: "Hahmoluokka",
  questionEn: "Character class",
  private: false,
  type: SignupQuestionType.TEXT,
  selectOptions: [],
};

const tournamentSignupQuestion: Omit<SignupQuestion, "programItemId"> = {
  questionFi: "Yhteystiedot",
  questionEn: "Contact details",
  private: true,
  type: SignupQuestionType.TEXT,
  selectOptions: [],
};

test("should save configured signup questions", async () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    signupQuestions: [signupQuestion],
    tournamentSignupQuestion: null,
    tournamentSignupQuestionExcludeIds: [],
  });

  // Create default settings so signup questions have a document to update
  await findSettings();

  await addSignupQuestions();

  const settings = unsafelyUnwrap(await findSettings());
  expect(settings.signupQuestions).toHaveLength(1);
  expect(settings.signupQuestions[0]).toMatchObject(signupQuestion);
});

test("should add tournament signup question to tournaments except excluded ones", async () => {
  const tournament = {
    ...testProgramItem,
    programType: ProgramType.TOURNAMENT,
  };
  const excludedTournament = {
    ...testProgramItem2,
    programType: ProgramType.TOURNAMENT,
  };

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    signupQuestions: [],
    tournamentSignupQuestion,
    tournamentSignupQuestionExcludeIds: [excludedTournament.programItemId],
  });

  await saveProgramItems([tournament, excludedTournament]);

  // Create default settings so signup questions have a document to update
  await findSettings();

  await addSignupQuestions();

  const settings = unsafelyUnwrap(await findSettings());
  expect(settings.signupQuestions).toHaveLength(1);
  expect(settings.signupQuestions[0]).toMatchObject({
    ...tournamentSignupQuestion,
    programItemId: tournament.programItemId,
  });
});

test("should not add tournament signup question to non-tournament program items", async () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    signupQuestions: [],
    tournamentSignupQuestion,
    tournamentSignupQuestionExcludeIds: [],
  });

  // testProgramItem is a tabletop RPG
  await saveProgramItems([testProgramItem]);

  // Create default settings so signup questions have a document to update
  await findSettings();

  await addSignupQuestions();

  const settings = unsafelyUnwrap(await findSettings());
  expect(settings.signupQuestions).toHaveLength(0);
});
