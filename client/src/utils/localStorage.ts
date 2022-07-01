import _ from "lodash";
import { z } from "zod";
import { PreloadedState } from "@reduxjs/toolkit";
import { LocalStorageState, RootState } from "client/typings/redux.typings";
import { ProgramType } from "shared/typings/models/game";

const LocalStorageSchema = z.object({
  login: z.object({ jwt: z.string() }).optional(),
  admin: z.object({ activeProgramType: z.nativeEnum(ProgramType) }).optional(),
});

type LocalStorage = z.infer<typeof LocalStorageSchema>;

export const loadSession = (): PreloadedState<RootState> | undefined => {
  const serializedState = localStorage.getItem("state");
  if (!serializedState) return undefined;

  let parsedSession: LocalStorage;
  try {
    parsedSession = LocalStorageSchema.parse(JSON.parse(serializedState));
  } catch (error) {
    clearSession();
    return undefined;
  }

  if (parsedSession) {
    // @ts-expect-error: TODO: Figure out why this doesn't work, should accept partial return value
    return parsedSession;
  }

  return undefined;
};

export const saveSession = (state: Partial<LocalStorageState>): void => {
  const previousSession = loadSession();
  const newSession = previousSession ? _.merge(previousSession, state) : state;

  try {
    const serializedState = JSON.stringify(newSession);
    localStorage.setItem("state", serializedState);
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
};

export const clearSession = (): void => {
  try {
    const oldSession = loadSession();
    localStorage.removeItem("state");
    const newSession = _.omit(oldSession, "login");
    saveSession(newSession);
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
};

export const getLanguage = (): string => {
  let language;
  try {
    language = localStorage.getItem("i18nextLng");
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }

  if (typeof language !== "undefined" && typeof language === "string") {
    return language;
  }

  return "eng";
};
