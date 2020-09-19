import React, { FC, ReactElement } from 'react';
import { useSelector, useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ResultsList } from 'views/results/components/ResultsList';
import { timeFormatter } from 'utils/timeFormatter';
import { loadResults, loadSettings } from 'utils/loadData';
import { Result } from 'typings/result.typings';

import { RootState } from 'typings/redux.typings';

export const ResultsView: FC = (): ReactElement => {
  const result: readonly Result[] = useSelector(
    (state: RootState) => state.results.result
  );
  const signupTime: string = useSelector(
    (state: RootState) => state.admin.signupTime
  );
  const { t } = useTranslation();

  const store = useStore();

  React.useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
      await loadResults();
    };
    fetchData();
  }, [store]);

  const validResults = result.filter(
    (result) => result.enteredGame.gameDetails
  );

  return (
    <div className='results-view'>
      {!signupTime && <h2>{t('noResults')}</h2>}
      {signupTime && (
        <>
          <h2>
            {t('signupResultsfor')}{' '}
            {timeFormatter.weekdayAndTime({
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
