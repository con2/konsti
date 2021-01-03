/// <reference types="Cypress" />

export const get = (
  key: string,
  timeoutTime = 10000
): Cypress.Chainable<JQuery<HTMLElement>> => {
  return cy.get(`[data-testkey="${key}"]`, { timeout: timeoutTime || 0 });
};

export const clickOn = (key: string): void => {
  get(key).click();
};
