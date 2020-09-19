import { store } from 'utils/store';

export const getJWT = (): string => {
  if (!store) return '';
  const state = store.getState();
  if (!state.login) {
    console.log('No login info in state');
    return 'invalid token';
  }
  return state.login.jwt;
};
