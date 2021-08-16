import { LocalStorageState, RootState } from "client/typings/redux.typings";

export const loadSession = (): Partial<RootState> | undefined => {
  try {
    const serializedState = localStorage.getItem("state");
    if (
      (serializedState !== null || serializedState !== "") &&
      typeof serializedState === "string"
    ) {
      return JSON.parse(serializedState);
    }
  } catch (error) {
    throw new Error(error);
  }
};

export const saveSession = (state: LocalStorageState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("state", serializedState);
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem("state");
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
