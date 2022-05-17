import React, { ReactElement, useEffect, useState } from "react";
import { useStore } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "client/app/AppRoutes";
import { Header } from "client/components/Header";
import { loadData } from "client/utils/loadData";
import { Loading } from "client/components/Loading";
import { getIconLibrary } from "client/utils/icons";
import { config } from "client/config";
import { TestValuePicker } from "client/components/TestValuePicker";
import { ErrorBar } from "client/components/ErrorBar";

export const App = (): ReactElement => {
  const { dataUpdateInterval, loadedSettings, showTestValues } = config;
  const store = useStore();

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
      {loading && <Loading />}

      {!loading && (
        <BrowserRouter>
          <Header />
          <ErrorBar />
          <AppRoutes />

          {loadedSettings !== "production" && showTestValues && (
            <TestValuePicker />
          )}
        </BrowserRouter>
      )}
    </>
  );
};

export default App;
