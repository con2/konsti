import { LocalStorageState } from 'client/typings/redux.typings';

export const loadSession = (): string | undefined => {
  let serializedState;
  try {
    serializedState = localStorage.getItem('state');
  } catch (error) {
    throw new Error(error);
  }

  if (!serializedState) return undefined;
  return JSON.parse(serializedState);
};

export const saveSession = (state: LocalStorageState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('state', serializedState);
  } catch (error) {
    console.error(error);
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem('state');
  } catch (error) {
    console.error(error);
  }
};

export const getLanguage = (): string => {
  let language;
  try {
    language = localStorage.getItem('i18nextLng');
  } catch (error) {
    console.error(error);
  }

  if (typeof language !== 'undefined' && typeof language === 'string') {
    return language;
  }

  return 'eng';
};
