import { store } from "client/utils/store";

export const getJWT = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!store) {
    return "";
  }
  const state = store.getState();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!state.login) {
    console.log("No login info in state"); // eslint-disable-line no-console
    return "invalid token";
  }
  return state.login.jwt;
};
