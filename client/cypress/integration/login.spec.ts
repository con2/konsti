/// <reference types="Cypress" />

// eslint-disable-next-line no-restricted-imports
import { clickOn, get } from '../support/cypressUtils';

describe('User login', () => {
  it('Admin user can log in', () => {
    const username = 'admin';
    const password = 'test';

    cy.visit('/');

    // Go to login page and enter login credentials
    clickOn('navigation-icon');

    clickOn('login-page-link');
    cy.get('.form-input#username').type(username);
    cy.get('.form-input#password').type(password);
    clickOn('login-button');

    // Check if login was completed
    clickOn('navigation-icon');
    get('logged-user-username').should('have.text', `User: ${username}`);
  });
});
