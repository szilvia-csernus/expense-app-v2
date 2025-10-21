/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to fill the expense form
       */
      fillExpenseForm(data: {
        name: string;
        email: string;
        date: string;
        description: string;
        purpose: string;
        total: string;
        iban?: string;
        accountName?: string;
      }): Chainable<void>;

      /**
       * Custom command to wait for church data to load
       */
      waitForChurchData(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("fillExpenseForm", (data) => {
  cy.get('input[name="name"]').clear().type(data.name);
  cy.get('input[name="email"]').clear().type(data.email);
  cy.get('input[name="date"]').clear().type(data.date);
  cy.get('input[name="description"]').clear().type(data.description);
  cy.get('select[name="purpose"]').select(data.purpose);
  cy.get('input[name="total"]').clear().type(data.total);

  if (data.iban) {
    cy.get('input[name="iban"]').clear().type(data.iban);
  }

  if (data.accountName) {
    cy.get('input[name="accountName"]').clear().type(data.accountName);
  }
});

Cypress.Commands.add("waitForChurchData", () => {
  // Wait for church logo to load (indicates data is loaded)
  cy.get('select[name="purpose"]', { timeout: 10000 })
    .find("option")
    .should("have.length.at.least", 2);
});

export {};
