import { config } from "shared/config";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { addError, removeError } from "client/views/admin/adminSlice";
import { store } from "client/utils/store";
import { BackendError, BackendErrorType } from "client/types/errorTypes";
import { fetchWithTimeout } from "client/utils/fetchWithTimeout";
import { onPageResume } from "client/utils/pageLifecycle";

// Decides how failed requests are surfaced to the user: background requests
// (the ones the app retries on its own) get their network error toast
// suppressed while offline or hidden and briefly after connectivity or the
// page resumes, with a probe request verifying suppressed failures so a
// genuine outage still surfaces; every other failure toasts immediately, and
// any successful response heals a lingering toast

const baseURL = config.client().apiServerUrl;

const PROBE_TIMEOUT_MS = 15000;

const networkError = (): BackendError => ({
  errorKey: BackendErrorType.NETWORK_ERROR,
});

// The app retries these on its own (the periodic data poll and the boot-time
// session restore), so their failures use the suppressed background error
// handling; every other request is treated as user-initiated and its
// failure toasts immediately. Keyed on method too: several endpoints pair a
// polled GET with a user-initiated POST
const BACKGROUND_REQUESTS = new Set<string>([
  `GET ${ApiEndpoint.SETTINGS}`,
  `GET ${ApiEndpoint.USERS}`,
  `GET ${ApiEndpoint.PROGRAM_ITEMS}`,
  `GET ${ApiEndpoint.GROUP}`,
  `POST ${ApiEndpoint.SESSION_RESTORE}`,
]);

// Background requests living in dev/test-only modules register themselves so
// their endpoints don't have to be listed above
export const registerBackgroundRequest = (
  method: string,
  endpoint: string,
): void => {
  BACKGROUND_REQUESTS.add(`${method} ${endpoint}`);
};

export const isBackgroundRequest = (method: string, url: string): boolean =>
  BACKGROUND_REQUESTS.has(`${method} ${url.split("?", 1)[0]}`);

// Background requests failing right around a connectivity change are
// expected (e.g. the first poll after a device wakes runs before Wi-Fi has
// reconnected), so their network error toast is suppressed while offline and
// briefly after the connection or the page itself resumes. Suppression is
// never final: it schedules a probe request for after the grace period, so a
// genuine outage still surfaces the toast
const RECONNECT_GRACE_PERIOD_MS = 5000;
let reconnectedAt = 0;

addEventListener("online", () => {
  reconnectedAt = Date.now();
});

// Page resume also starts the grace period: while the screen is off the
// browser freezes the page without firing offline/online events, so the
// first request after waking can run before the network is back
onPageResume(() => {
  reconnectedAt = Date.now();
});

// Failures on a hidden page (screen off, background tab) don't toast either:
// the resume refresh or the next visible poll fails again while visible and
// makes the call then
const shouldShowNetworkError = (): boolean =>
  navigator.onLine &&
  !document.hidden &&
  Date.now() - reconnectedAt > RECONNECT_GRACE_PERIOD_MS;

let lastSuccessAt = 0;

// Only one probe runs at a time; a probe demand arriving while one is
// already in flight is remembered and served when the current probe settles
let probeActive = false;
let probeRequested = false;

// Any response proves connectivity: heal a lingering network error toast,
// satisfy pending probe demand, and record the time so a probe that was
// already scheduled can recognize itself as answered and its failure as
// stale
export const onRequestSuccess = (): void => {
  lastSuccessAt = Date.now();
  probeRequested = false;
  const hasNetworkError = store
    .getState()
    .admin.errors.some(
      (error) => error.errorKey === BackendErrorType.NETWORK_ERROR,
    );
  if (hasNetworkError) {
    store.dispatch(removeError(networkError()));
  }
};

// Deferring the toast decision lets a resume event that is still queued
// behind a failed request start the grace period first
const NETWORK_ERROR_TOAST_DELAY_MS = 1000;

// A failure suppressed by the grace period can't just be dropped or a real
// outage would stay invisible on a phone that is only awake for short
// glances, so a no-op health request re-checks connectivity after the grace
// period has passed
const scheduleNetworkProbe = (): void => {
  if (probeActive) {
    probeRequested = true;
    return;
  }
  probeActive = true;
  const graceEndsIn = Math.max(
    reconnectedAt + RECONNECT_GRACE_PERIOD_MS - Date.now(),
    0,
  );
  const scheduledAt = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    try {
      // A request succeeding while the probe was pending already answered
      // the reachability question, so skip the request
      if (lastSuccessAt < scheduledAt) {
        // Demand raised before this evaluation is answered by it; demand
        // raised while the request is in flight re-sets the flag
        probeRequested = false;
        await fetchWithTimeout(
          `${baseURL}${ApiEndpoint.HEALTH}`,
          PROBE_TIMEOUT_MS,
        );
        onRequestSuccess();
      }
    } catch {
      setTimeout(() => {
        // A request succeeding after the probe was scheduled already proved
        // connectivity, making this failure stale
        if (lastSuccessAt < scheduledAt) {
          showNetworkErrorOrProbe();
        }
      }, NETWORK_ERROR_TOAST_DELAY_MS);
    } finally {
      probeActive = false;
      if (probeRequested) {
        probeRequested = false;
        scheduleNetworkProbe();
      }
    }
  }, graceEndsIn + NETWORK_ERROR_TOAST_DELAY_MS);
};

const showNetworkErrorOrProbe = (): void => {
  if (shouldShowNetworkError()) {
    store.dispatch(addError(networkError()));
  } else if (navigator.onLine && !document.hidden) {
    scheduleNetworkProbe();
  }
  // While offline or hidden nothing is scheduled — otherwise a hidden but
  // still-running page would probe in a tight loop through an outage. The
  // refresh triggered by the online event or page resume starts a new cycle
  // if the problem persists
};

export const onRequestFailure = (background: boolean): void => {
  if (background) {
    // Deliberately no "did another request succeed since" guard here: a
    // sibling request succeeding doesn't prove this endpoint works, and such
    // a guard would permanently mask a single persistently failing endpoint
    setTimeout(showNetworkErrorOrProbe, NETWORK_ERROR_TOAST_DELAY_MS);
  } else {
    // Failures of user-initiated requests always get immediate feedback
    store.dispatch(addError(networkError()));
  }
};

// While the toast is suppressed (offline, hidden, or just reconnected) an
// HTTP error on a background load is most likely a captive portal or
// gateway answering while the connection comes up, so it is handled as a
// connectivity issue instead of an API error
export const shouldTreatHttpErrorAsNetworkError = (
  background: boolean,
): boolean => background && !shouldShowNetworkError();

const getErrorReason = (status: number): BackendErrorType => {
  switch (status) {
    case 401:
      return BackendErrorType.UNAUTHORIZED;
    case 422:
      return BackendErrorType.INVALID_REQUEST;
    default:
      return BackendErrorType.UNKNOWN;
  }
};

export const showApiError = (
  method: string,
  url: string,
  status: number,
): void => {
  store.dispatch(
    addError({
      errorKey: BackendErrorType.API_ERROR,
      method,
      url,
      errorReason: getErrorReason(status),
    }),
  );
};
