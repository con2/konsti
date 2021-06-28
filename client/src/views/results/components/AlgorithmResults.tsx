import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from 'client/utils/hooks';
import { AlgorithmResultsList } from 'client/views/results/components/AlgorithmResultsList';
import { timeFormatter } from 'client/utils/timeFormatter';

export const AlgorithmResults = (): ReactElement => {
  const { t } = useTranslation();

  const activeSignupTime = useAppSelector(
    (state) => state.admin.activeSignupTime
  );

  const results = useAppSelector((state) => state.results.result);

  const validResults = results.filter(
    (result) => result.enteredGame.gameDetails
  );

  return (
    <div className='results-view'>
      {!activeSignupTime && <h2>{t('noResults')}</h2>}
      {activeSignupTime && (
        <>
          <h2>
            {t('signupResultsfor')}{' '}
            {timeFormatter.getWeekdayAndTime({
              time: activeSignupTime,
              capitalize: false,
            })}
          </h2>
          <AlgorithmResultsList results={validResults} />
        </>
      )}
    </div>
  );
};
