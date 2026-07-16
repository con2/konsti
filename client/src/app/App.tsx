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
import { AdminMessageBanner } from "client/components/AdminMessageBanner";
import { NotificationBar } from "client/views/event-log/NotificationBar";
import { onPageResume } from "client/utils/pageLifecycle";
import { HistoryProvider } from "client/app/HistoryContext";

const { loadedSettings, showTestValues, showAnnouncement, dataUpdateInterval } =
  config.client();

const App = (): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Refresh triggers can fire together (e.g. an overdue interval tick, the
    // online event, and a page resume when a phone wakes), and concurrent
    // loads could dispatch a slower stale response over a newer one, so only
    // one load runs at a time
    let fetchInFlight = false;
    let fetchQueued = false;

    const fetchData = async (): Promise<void> => {
      if (fetchInFlight) {
        return;
      }
      fetchInFlight = true;
      try {
        let succeeded = false;
        do {
          fetchQueued = false;
          succeeded = await loadData();
          setLoading(false);
          // A successful load satisfies triggers that arrived while it ran;
          // a failed one reruns for them (e.g. its requests failed right
          // before connectivity returned). fetchQueued is set while loadData
          // is awaited, which type narrowing can't see
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } while (fetchQueued && !succeeded);
      } finally {
        fetchInFlight = false;
      }
    };

    // Connectivity and resume refreshes must not be dropped just because a
    // load is in flight — an in-flight request can hang until the request
    // timeout — so they queue a trailing rerun
    const queueFetchData = (): void => {
      fetchQueued = true;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchData();
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();

    // Interval ticks don't queue behind an in-flight load: the next tick
    // arrives within the update interval anyway
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const updateTimer = setInterval(fetchData, dataUpdateInterval * 1000);

    // Refresh immediately when connectivity returns; the successful response
    // also heals a possible stale network error toast
    addEventListener("online", queueFetchData);

    // While the page is hidden (screen off, background tab) the browser
    // freezes timers and polling lags behind, so refresh on resume — but only
    // when hidden long enough to actually miss a poll, so that plain tab
    // switching doesn't cause request bursts
    const offPageResume = onPageResume((hiddenDurationMs) => {
      if (hiddenDurationMs >= dataUpdateInterval * 1000) {
        queueFetchData();
      }
    });

    return () => {
      clearInterval(updateTimer);
      removeEventListener("online", queueFetchData);
      offPageResume();
    };
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
            <AdminMessageBanner />
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
