// A smooth window.scrollTo gets cancelled when the virtualizer measures rows
// mounting above the viewport and adjusts the scroll position, so the
// virtualized program list registers its own scrollToOffset here as an
// override for the scroll-to-top button

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
