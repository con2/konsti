import { ReactElement, Suspense, useEffect, useState } from "react";
import { BrowserRouter } from "react-router";
import styled from "styled-components";
import { config } from "shared/config";
import { AppRoutes } from "client/app/AppRoutes";
import { HistoryProvider } from "client/app/HistoryContext";
import { prefetchLazyViews } from "client/app/lazyViews";
import { AdminMessageBanner } from "client/components/AdminMessageBanner";
import { Announcement } from "client/components/Announcement";
import { AppUpdateBanner } from "client/components/AppUpdateBanner";
import { ErrorBar } from "client/components/ErrorBar";
import { FirstLogin } from "client/components/FirstLogin";
import { HEADER_HEIGHT, Header } from "client/components/Header";
import { Loading } from "client/components/Loading";
import { MOBILE_MARGIN } from "client/globalStyle";
import { TestGenerateSerial } from "client/test/test-components/TestGenerateSerial";
import { TestTime } from "client/test/test-components/TestTime";
import { useAppSelector } from "client/utils/hooks";
import { getIconLibrary } from "client/utils/icons";
import { loadData } from "client/utils/loadData";
import { onPageResume } from "client/utils/pageLifecycle";
import { whenIdle } from "client/utils/whenIdle";
import { NotificationBar } from "client/views/event-log/NotificationBar";

const { loadedSettings, showTestValues, showAnnouncement, dataUpdateInterval } =
  config.client();

const App = (): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const userGroup = useAppSelector((state) => state.login.userGroup);

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
          if (succeeded) {
            setDataLoaded(true);
          }
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

  // Warm the split view chunks once a data load has actually succeeded and the
  // browser reports spare time. Gating on success rather than on `loading`
  // matters twice over: a failed load flips `loading` too, so these requests
  // would pile onto a connection that is already struggling, and a failed
  // dynamic import is cached by the browser for the session - the later real
  // navigation would then reject instantly and force a full page reload even
  // though connectivity had recovered. Re-runs when the role changes, because
  // signing in as admin/helper makes chunks reachable that weren't before
  useEffect(() => {
    if (!dataLoaded) {
      return;
    }

    return whenIdle(() => {
      prefetchLazyViews(userGroup);
    });
  }, [dataLoaded, userGroup]);

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
            {/* One sticky wrapper rather than sticky bars: siblings pinned to
                the same offset would overlap instead of stacking */}
            <StickyBars>
              <FirstLogin />
              <ErrorBar />
              <AppUpdateBanner />
              <AdminMessageBanner />
              <NotificationBar />
            </StickyBars>
            {showAnnouncement && <Announcement />}
            <AppContainer>
              {/* Boundary for the lazily loaded views, placed here rather than
                  around the whole app so navigating to one keeps the header and
                  bars on screen instead of blanking the page */}
              <Suspense fallback={<Loading />}>
                <AppRoutes />
              </Suspense>
            </AppContainer>
          </HistoryProvider>
        </BrowserRouter>
      )}
    </>
  );
};

const StickyBars = styled.div`
  position: sticky;
  top: ${HEADER_HEIGHT}px;
  z-index: 10;

  /* Owns the horizontal inset for every bar inside, so their dismiss icons
     line up instead of each bar picking its own margin */
  margin: 0 2px;
`;

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
  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    margin-left: ${MOBILE_MARGIN}px;
    margin-right: ${MOBILE_MARGIN}px;
  }
`;

export default App;
