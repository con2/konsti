// jsdom keeps the document visible, so a test overrides what the document
// reports and fires the event the app listens to, the same way the end-to-end
// suite's helper does, until it is set back
export const setPageHidden = (hidden: boolean): void => {
  Object.defineProperties(document, {
    hidden: { value: hidden, configurable: true },
    visibilityState: {
      value: hidden ? "hidden" : "visible",
      configurable: true,
    },
  });
  document.dispatchEvent(new Event("visibilitychange"));
};
