// Mobile browsers freeze the page while the screen is off without firing
// offline/online events, and WebKit restores pages from the back/forward
// cache without firing visibilitychange, so detecting "the page resumed"
// needs both the visibility and the pagehide/pageshow signals

export const onPageResume = (
  callback: (hiddenDurationMs: number) => void,
): (() => void) => {
  // A page can load already hidden (e.g. opened in a background tab), and
  // its first foregrounding is a resume like any other
  let hiddenAt: number | undefined = document.hidden ? Date.now() : undefined;

  const markHidden = (): void => {
    hiddenAt ??= Date.now();
  };

  const resume = (): void => {
    // Undefined means the resume was already handled by the other event type
    if (hiddenAt === undefined) {
      return;
    }
    const hiddenDurationMs = Date.now() - hiddenAt;
    hiddenAt = undefined;
    callback(hiddenDurationMs);
  };

  const handleVisibilityChange = (): void => {
    if (document.hidden) {
      markHidden();
    } else {
      resume();
    }
  };

  const handlePageShow = (event: PageTransitionEvent): void => {
    if (event.persisted) {
      resume();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  addEventListener("pagehide", markHidden);
  addEventListener("pageshow", handlePageShow);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    removeEventListener("pagehide", markHidden);
    removeEventListener("pageshow", handlePageShow);
  };
};
