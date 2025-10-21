// cypress/e2e/home.cy.ts
describe("Home Page - Expense Form", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should load the page and display the form", () => {
    cy.waitForChurchData();
    cy.contains("h1", "Expense Form").should("be.visible");
  });

  it("should display church logo", () => {
    cy.waitForChurchData();
    cy.get('img[alt="church logo"]').should("be.visible");
  });

  it("should show all required form fields", () => {
    cy.waitForChurchData();

    // Personal Information
    cy.get('input[name="name"]').should("be.visible");
    cy.get('input[name="email"]').should("be.visible");

    // Expense Details
    cy.get('input[name="date"]').should("be.visible");
    cy.get('input[name="description"]').should("be.visible");
    cy.get('select[name="purpose"]').should("be.visible");
    cy.get('input[name="total"]').should("be.visible");

    // Receipt upload
    cy.get('input[type="file"]').should("exist");

    // Reimbursement Details (optional)
    cy.get('input[name="iban"]').should("be.visible");
    cy.get('input[name="accountName"]').should("be.visible");

    // Submit button
    cy.contains("button", "Submit").should("be.visible");
  });

  it("should show validation errors for empty required fields", () => {
    cy.waitForChurchData();

    // Try to submit empty form
    cy.contains("button", "Submit").click();

    // Check validation messages appear
    cy.contains("Please provide your name").should("be.visible");
    cy.contains("Please provide your email address").should("be.visible");
    cy.contains("Please select a date").should("be.visible");
    cy.contains("Please provide a short description").should("be.visible");
    cy.contains("Please select a purpose").should("be.visible");
    cy.contains("Invalid amount").should("be.visible");
  });

  it("should validate email format", () => {
    cy.waitForChurchData();

    cy.get('input[name="email"]').type("invalid-email");
    cy.get('input[name="email"]').blur();

    cy.contains("Please provide your email address").should("be.visible");
  });

  it("should accept valid email format", () => {
    cy.waitForChurchData();

    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="email"]').blur();

    cy.contains("Please provide your email address").should("not.be.visible");
  });

  it("should populate purpose dropdown with options", () => {
    cy.waitForChurchData();

    cy.get('select[name="purpose"]').find("option").should("have.length.gt", 1);
  });

  it("should allow file upload", () => {
    cy.waitForChurchData();

    // Create a test file
    const fileName = "receipt.png";
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: fileName,
        mimeType: "image/png",
      },
      { force: true }
    );

    // Check file appears in list
    cy.contains(fileName).should("be.visible");
  });

  it("should show error for invalid file type", () => {
    cy.waitForChurchData();

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake content"),
        fileName: "document.txt",
        mimeType: "text/plain",
      },
      { force: true }
    );

    cy.contains("File type not supported").should("be.visible");
  });

  it("should allow removing uploaded files", () => {
    cy.waitForChurchData();

    // Upload a file
    const fileName = "receipt.jpg";
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: fileName,
        mimeType: "image/jpeg",
      },
      { force: true }
    );

    cy.contains(fileName).should("be.visible");

    // Remove the file
    cy.get("button").contains("X").click();

    cy.contains(fileName).should("not.exist");
  });

  it("should fill and validate complete form", () => {
    cy.waitForChurchData();

    cy.fillExpenseForm({
      name: "John Doe",
      email: "john@example.com",
      date: "2024-01-15",
      description: "Grocery shopping for event",
      purpose: "Events", // Select second purpose from dropdown
      total: "50.00",
      iban: "NL91ABNA0417164300",
      accountName: "John Doe",
    });

    // Upload receipt
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: "receipt.png",
        mimeType: "image/png",
      },
      { force: true }
    );

    // Form should be valid (no validation errors)
    cy.get(".feedbackInvalid*").should("not.exist");

    // Submit button should be enabled
    cy.contains("button", "Submit").should("not.be.disabled");
  });

  it("should have admin login link", () => {
    cy.contains("a", "Admin login")
      .should("be.visible")
      .should("have.attr", "href", "/admin");
  });
});
