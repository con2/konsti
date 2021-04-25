import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useStore } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Routes } from 'client/app/Routes';
import { Header } from 'client/components/Header';
import { loadData } from 'client/utils/loadData';
import { Loading } from 'client/components/Loading';
import { getIconLibrary } from 'client/utils/icons';
import { config } from 'client/config';
import { RootState } from 'client/typings/redux.typings';

export const App: FC = (): ReactElement => {
  const { dataUpdateInterval } = config;
  const appOpen: boolean = useSelector(
    (state: RootState) => state.admin.appOpen
  );
  const { t } = useTranslation();
  const store = useStore();

  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    setLoading(true);
    const fetchData = async (): Promise<void> => {
      await loadData();
      setLoading(false);
    };
    fetchData();

    const startUpdateTimer = (): void => {
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      setInterval(async () => await fetchData(), dataUpdateInterval * 1000);
    };
    startUpdateTimer();
  }, [store, dataUpdateInterval]);

  getIconLibrary();

  return (
    <>
      {/* <h3>{t('errorMessage')}</h3> */}

      {loading && <Loading />}

      {!loading && (
        <>
          {!appOpen && <h2>{t('closingMessage')}</h2>}
          <BrowserRouter>
            <Header />
            <Routes onlyAdminLoginAllowed={!appOpen} />
          </BrowserRouter>
        </>
      )}
    </>
  );
};

/* eslint-disable-next-line import/no-unused-modules */
export default App;
