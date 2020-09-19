import React, { FC, ReactElement, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import moment from 'moment';
import { submitSetTestTime } from 'views/admin/adminActions';
import { TimesDropdown } from 'components/TimesDropdown';
import { config } from 'config';
import { RootState } from 'typings/redux.typings';

export const TimeSelector: FC = (): ReactElement => {
  const testTime: string = useSelector(
    (state: RootState) => state.admin.testTime
  );

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { CONVENTION_START_TIME } = config;
  const times = [
    moment(CONVENTION_START_TIME).subtract(2, 'hours').format(),
    moment(CONVENTION_START_TIME).format(),
    moment(CONVENTION_START_TIME).add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(1, 'hours').add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(2, 'hours').add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(3, 'hours').add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(5, 'hours').add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(15, 'hours').add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(16, 'hours').add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(24, 'hours').add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(28, 'hours').add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(36, 'hours').add(45, 'minutes').format(),
    moment(CONVENTION_START_TIME).add(40, 'hours').add(45, 'minutes').format(),
  ];

  React.useEffect(() => {
    const defaultTestTime = _.first(times);
    if (!testTime && defaultTestTime) setTestTime(defaultTestTime);
  });

  const setTestTime = (testTime: string): void => {
    dispatch(submitSetTestTime(testTime));
  };

  return (
    <div className='time-selector'>
      <span>{t('testTime')}</span>
      <TimesDropdown
        times={times}
        selectedTime={testTime}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          setTestTime(event.target.value)
        }
      />
    </div>
  );
};
