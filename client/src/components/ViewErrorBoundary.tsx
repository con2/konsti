import { ErrorBoundary } from "@sentry/react";
import { ReactElement, ReactNode } from "react";
import { ViewErrorFallback } from "client/components/ViewErrorFallback";

// Wraps the routed views so a render error shows a recoverable message instead
// of React unmounting the whole tree and leaving a blank page. Sentry's boundary
// rather than a hand-written one, so the error still reaches the same reporting
// as every other client exception.
//
// Sits around the routes, not the whole app, for the same reason as the Suspense
// boundary beside it: the header and bars stay on screen, and retrying
// re-renders only the view.
//
// The fallback clears the error itself on a navigation. Keying this boundary on
// the route would do the same, but at the cost of remounting the Suspense
// boundary and every route element on every navigation, which throws away
// component state React Router would otherwise keep. The fallback is passed by
// reference rather than as an inline arrow: a component defined during render is
// a new type each time, which would remount it.
export const ViewErrorBoundary = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => (
  <ErrorBoundary fallback={ViewErrorFallback}>{children}</ErrorBoundary>
);
