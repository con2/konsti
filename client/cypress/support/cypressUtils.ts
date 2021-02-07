/// <reference types="Cypress" />

// TODO: Fix no-unused-modules scope for Cypress files
/* eslint-disable import/no-unused-modules */

export const get = (
  key: string,
  timeoutTime = 10000
): Cypress.Chainable<JQuery<HTMLElement>> => {
  return cy.get(`[data-testkey="${key}"]`, { timeout: timeoutTime || 0 });
};

export const clickOn = (key: string): void => {
  get(key).click();
};

/* eslint-enable import/no-unused-modules */
