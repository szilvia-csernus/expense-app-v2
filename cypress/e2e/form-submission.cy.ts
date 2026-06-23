// cypress/e2e/form-submission.cy.ts
describe("Form Submission", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.waitForChurchData();
  });

  it("should show success message after successful submission", () => {
    cy.intercept("POST", "**/submit-expense", {
      statusCode: 200,
      body: { message: "Success" },
    }).as("submitForm");

    cy.fillExpenseForm({
      name: "Test User",
      email: "test@example.com",
      date: "2024-01-15",
      description: "Test expense",
      purpose: "Events",
      total: "100.00",
    });

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: "receipt.png",
        mimeType: "image/png",
      },
      { force: true }
    );

    cy.contains("button", "Submit").click();

    cy.wait("@submitForm");

    // Should show success modal
    cy.contains("Thank You!", { timeout: 10000 }).should("be.visible");
    cy.contains("successfully").should("be.visible");
  });

  it("should show error message on submission failure", () => {
    cy.intercept("POST", "**/submit-expense", {
      statusCode: 500,
      body: { error: "Server error" },
    }).as("submitForm");

    cy.fillExpenseForm({
      name: "Test User",
      email: "test@example.com",
      date: "2024-01-15",
      description: "Test expense",
      purpose: "Events",
      total: "100.00",
    });

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: "receipt.png",
        mimeType: "image/png",
      },
      { force: true }
    );

    cy.contains("button", "Submit").click();

    cy.wait("@submitForm");

    // Should show error
    cy.contains(/error|failed/i, { timeout: 10000 }).should("be.visible");
  });

  it("should attach a Turnstile token to the submission", () => {
    cy.intercept("POST", "**/submit-expense", (req) => {
      const bodyStr =
        typeof req.body === "string"
          ? req.body
          : new TextDecoder().decode(req.body as ArrayBuffer);
      expect(bodyStr).to.include("turnstileToken");
      expect(bodyStr).to.include("cypress-e2e-token");
      req.reply({ statusCode: 200, body: { message: "Success" } });
    }).as("submitForm");

    cy.fillExpenseForm({
      name: "Test User",
      email: "test@example.com",
      date: "2024-01-15",
      description: "Test expense",
      purpose: "Events",
      total: "100.00",
    });

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: "receipt.png",
        mimeType: "image/png",
      },
      { force: true }
    );

    cy.contains("button", "Submit").click();

    cy.wait("@submitForm");
    cy.contains("Thank You!", { timeout: 10000 }).should("be.visible");
  });

  it("should show an error when human verification is rejected", () => {
    cy.intercept("POST", "**/submit-expense", {
      statusCode: 403,
      body: { error: "Human verification failed" },
    }).as("submitForm");

    cy.fillExpenseForm({
      name: "Test User",
      email: "test@example.com",
      date: "2024-01-15",
      description: "Test expense",
      purpose: "Events",
      total: "100.00",
    });

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: "receipt.png",
        mimeType: "image/png",
      },
      { force: true }
    );

    cy.contains("button", "Submit").click();

    cy.wait("@submitForm");

    // The 403 should surface as an error to the user, not a success.
    cy.contains(/error|failed/i, { timeout: 10000 }).should("be.visible");
    cy.contains("Thank You!").should("not.exist");
  });

  it("should clear form after successful submission", () => {
    cy.intercept("POST", "**/submit-expense", {
      statusCode: 200,
      body: { message: "Success" },
    }).as("submitForm");

    cy.fillExpenseForm({
      name: "Test User",
      email: "test@example.com",
      date: "2024-01-15",
      description: "Test expense",
      purpose: "Events",
      total: "100.00",
    });

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: "receipt.png",
        mimeType: "image/png",
      },
      { force: true }
    );

    cy.contains("button", "Submit").click();
    cy.wait("@submitForm");

    // Wait for success message
    cy.contains("Thank You!", { timeout: 10000 }).should("be.visible");

    // Close modal (if there's a close button)
    cy.get("body").click(0, 0); // Click outside modal

    // Form should be cleared
    cy.get('input[name="name"]').should("have.value", "");
    cy.get('input[name="email"]').should("have.value", "");
  });
});
