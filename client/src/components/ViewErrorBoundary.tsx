import { ErrorBoundary } from "@sentry/react";
import { ReactElement, ReactNode } from "react";
import { useLocation } from "react-router";
import { ViewErrorFallback } from "client/components/ViewErrorFallback";

// Wraps the routed views so a render error shows a recoverable message instead
// of React unmounting the whole tree and leaving a blank page. Sentry's boundary
// rather than a hand-written one, so the error still reaches the same reporting
// as every other client exception.
//
// Sits around the routes, not the whole app, for the same reason as the Suspense
// boundary beside it: the header and bars stay on screen, and retrying
// re-renders only the view
export const ViewErrorBoundary = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => {
  const location = useLocation();

  return (
    // Keyed on the path so navigating away clears the error. A boundary holds
    // its failed state until it is reset, and the routes are inside this one, so
    // without this the fallback would survive every navigation and the header
    // links would appear to do nothing.
    //
    // The fallback is passed by reference rather than as an inline arrow: a
    // component defined during render is a new type each time, which would
    // remount it
    <ErrorBoundary key={location.pathname} fallback={ViewErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};
