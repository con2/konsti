import moment from 'moment';
import { config } from 'client/config';
import { store } from 'client/utils/store';

export const getTime = (): string => {
  if (config.loadedSettings !== 'production' && config.useTestTime) {
    const testTime = store.getState().admin.testTime;
    return testTime ?? '';
  }

  return moment().format();
};
