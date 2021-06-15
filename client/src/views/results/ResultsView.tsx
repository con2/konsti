import React, { ReactElement, useEffect } from 'react';
import { useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ResultsList } from 'client/views/results/components/ResultsList';
import { timeFormatter } from 'client/utils/timeFormatter';
import { loadResults, loadSettings } from 'client/utils/loadData';
import { useAppSelector } from 'client/utils/hooks';

export const ResultsView = (): ReactElement => {
  const results = useAppSelector((state) => state.results.result);
  const signupTime = useAppSelector((state) => state.admin.signupTime);
  const { t } = useTranslation();

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
      await loadResults();
    };
    fetchData();
  }, [store]);

  const validResults = results.filter(
    (result) => result.enteredGame.gameDetails
  );

  return (
    <div className='results-view'>
      {!signupTime && <h2>{t('noResults')}</h2>}
      {signupTime && (
        <>
          <h2>
            {t('signupResultsfor')}{' '}
            {timeFormatter.getWeekdayAndTime({
              time: signupTime,
              capitalize: false,
            })}
          </h2>
          <ResultsList results={validResults} />
        </>
      )}
    </div>
  );
};
