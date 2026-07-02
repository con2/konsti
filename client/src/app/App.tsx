import { ReactElement, useEffect, useState } from "react";
import { BrowserRouter } from "react-router";
import styled from "styled-components";
import { AppRoutes } from "client/app/AppRoutes";
import { Header } from "client/components/Header";
import { loadData } from "client/utils/loadData";
import { Loading } from "client/components/Loading";
import { getIconLibrary } from "client/utils/icons";
import { config } from "shared/config";
import { ErrorBar } from "client/components/ErrorBar";
import { MOBILE_MARGIN } from "client/globalStyle";
import { TestTime } from "client/test/test-components/TestTime";
import { TestGenerateSerial } from "client/test/test-components/TestGenerateSerial";
import { Announcement } from "client/components/Announcement";
import { NotificationBar } from "client/views/event-log/NotificationBar";
import { resetNetworkError } from "client/views/admin/adminUtils";
import { HistoryProvider } from "client/app/HistoryContext";

const { loadedSettings, showTestValues, showAnnouncement, dataUpdateInterval } =
  config.client();

const App = (): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadData();
      setLoading(false);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();

    const startUpdateTimer = (): void => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setInterval(async () => {
        resetNetworkError();
        await fetchData();
      }, dataUpdateInterval * 1000);
    };
    startUpdateTimer();
  }, []);

  getIconLibrary();

  return (
    <>
      {loading && <Loading />}

      {!loading && (
        <BrowserRouter>
          <HistoryProvider>
            {loadedSettings !== "production" && showTestValues && (
              <TestValueContainer>
                <TestTime />
                <TestGenerateSerial />
              </TestValueContainer>
            )}
            <Header />
            <ErrorBar />
            <NotificationBar />
            {showAnnouncement && <Announcement />}
            <AppContainer>
              <AppRoutes />
            </AppContainer>
          </HistoryProvider>
        </BrowserRouter>
      )}
    </>
  );
};

const TestValueContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;

  /* Don't block clicks on the header underneath; children opt back in */
  pointer-events: none;

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    display: none;
  }
`;

const AppContainer = styled.div`
  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: ${MOBILE_MARGIN}px;
    margin-right: ${MOBILE_MARGIN}px;
  }

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    margin-left: ${MOBILE_MARGIN}px;
    margin-right: ${MOBILE_MARGIN}px;
  }
`;

export default App;
