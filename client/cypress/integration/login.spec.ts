/// <reference types="Cypress" />

import { clickOn, get } from 'cypress/support/cypressUtils';

it('Admin user can log in', () => {
  const username = 'admin';
  const password = 'test';

  cy.visit('/');

  // Go to login page and enter login credentials
  clickOn('navigation-icon');

  clickOn('login-page-link');
  get('login-form-input-username').type(username);
  get('login-form-input-password').type(password);
  clickOn('login-button');

  // Check if login was completed
  clickOn('navigation-icon');
  get('logged-user-username').should('have.text', `User: ${username}`);
});
