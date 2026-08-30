import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
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
import { db } from "server/db/mongodb";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { addSignupQuestions } from "server/features/program-item/utils/addSignupQuestions";
import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
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

test("should save configured sign-up questions", async () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    signupQuestions: [signupQuestion],
    tournamentSignupQuestion: null,
    tournamentSignupQuestionExcludeIds: [],
  });

  // Create default settings so sign-up questions have a document to update
  await findOrCreateSettings();

  await addSignupQuestions();

  const settings = unsafelyUnwrap(await findOrCreateSettings());
  expect(settings.signupQuestions).toHaveLength(1);
  expect(settings.signupQuestions[0]).toMatchObject(signupQuestion);
});

test("should add tournament sign-up question to tournaments except excluded ones", async () => {
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

  // Create default settings so sign-up questions have a document to update
  await findOrCreateSettings();

  await addSignupQuestions();

  const settings = unsafelyUnwrap(await findOrCreateSettings());
  expect(settings.signupQuestions).toHaveLength(1);
  expect(settings.signupQuestions[0]).toMatchObject({
    ...tournamentSignupQuestion,
    programItemId: tournament.programItemId,
  });
});

test("should not add tournament sign-up question to non-tournament program items", async () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    signupQuestions: [],
    tournamentSignupQuestion,
    tournamentSignupQuestionExcludeIds: [],
  });

  // testProgramItem is a tabletop RPG
  await saveProgramItems([testProgramItem]);

  // Create default settings so sign-up questions have a document to update
  await findOrCreateSettings();

  await addSignupQuestions();

  const settings = unsafelyUnwrap(await findOrCreateSettings());
  expect(settings.signupQuestions).toHaveLength(0);
});
