// jsdom keeps the document visible, so a test that needs the app's hidden-page
// behaviour overrides what the document reports and fires the event the app
// listens to. The override lasts until it is set back
export const setPageHidden = (hidden: boolean): void => {
  Object.defineProperty(document, "hidden", {
    value: hidden,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};
