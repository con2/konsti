// Scrolling to the top of the window-virtualized program list must go through
// its virtualizer: a plain window.scrollTo smooth animation gets cancelled
// when rows mounting above the viewport are measured and the virtualizer
// adjusts the scroll position. The virtualizer's own scrollToOffset knows a
// smooth scroll is in flight — it suppresses those adjustments and re-targets
// every frame until the offset is stable — so the list registers an override
// here and the scroll-to-top button uses it when one is active

let override: (() => void) | null = null;

// Returns an unregister function for the effect cleanup
export const registerScrollToTopOverride = (
  scrollToTopOverride: () => void,
): (() => void) => {
  override = scrollToTopOverride;
  return () => {
    if (override === scrollToTopOverride) {
      override = null;
    }
  };
};

export const scrollToTop = (): void => {
  if (override) {
    override();
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
};
