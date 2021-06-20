import { store } from 'client/utils/store';

export const getJWT = (): string => {
  if (!store) return '';
  const state = store.getState();
  if (!state.login) {
    console.log('No login info in state'); // eslint-disable-line no-console
    return 'invalid token';
  }
  return state.login.jwt;
};
