import type { ExpenseFormData, Church } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Generate the main message for the email
export function generateMainMessage(form: ExpenseFormData): string {
  const name = escapeHtml(form.name);
  const email = escapeHtml(form.email);
  const date = escapeHtml(form.date);
  const description = escapeHtml(form.description);
  const purpose = escapeHtml(form.purpose);
  const total = escapeHtml(form.total);
  const iban = form.iban ? escapeHtml(form.iban) : "";
  const accountName = form.accountName ? escapeHtml(form.accountName) : "";

  return `
  <br>
  <strong>Name:</strong> ${name}<br>
  <strong>Email:</strong> ${email}<br>
  <strong>Date of Expense:</strong> ${date}<br>
  <strong>Description:</strong> ${description}<br>
  <strong>Purpose:</strong> ${purpose}<br>
  <strong>Total:</strong> ${total}<br>
  ${iban ? `<strong>Bank account:</strong> ${iban}<br>` : ""}
  ${accountName ? `<strong>Account Holder:</strong> ${accountName}<br>` : ""}
  <br>
`;
}

// Generate message to the submitter
export function generateMessageToSubmitter(
  church: Church,
  submitter: string,
): string {
  const safeSubmitter = escapeHtml(submitter);
  const safeFinanceEmail = escapeHtml(church.financeEmail);
  const safeContactName = escapeHtml(church.financeContactName);
  const safeChurchName = escapeHtml(church.churchLongName);

  return `Dear ${safeSubmitter},<br><br>

Thank you for submitting an expense form. We will process it shortly.<br>
If you don't hear from us, or if the reimbursement doesn't arrive to you within 2 weeks, then please reach out to us at ${safeFinanceEmail}.<br><br>

${safeContactName}<br>
Finance Team<br>
${safeChurchName}<br><br>
`;
}

// Generate message to finance
export function generateMessageToFinance(mainMessage: string): string {
  return `<strong>Expense Form Submission</strong><br>
${mainMessage}`;
}

export function generateReplyTemplate(
  church: Church,
  submitter: string,
  mainMessage: string,
): string {
  const safeSubmitter = escapeHtml(submitter);
  const safeFinanceEmail = escapeHtml(church.financeEmail);
  const safeContactName = escapeHtml(church.financeContactName);
  const safeChurchName = escapeHtml(church.churchLongName);

  return `Dear ${safeSubmitter},<br><br>

Thanks for covering the church expenses! <br>
I've sent the reimbursement to your account. If you have any questions, feel free to email us at ${safeFinanceEmail}.<br><br>

${safeContactName}<br>
Finance Team<br>
${safeChurchName}<br><br>

<strong>Ps - the submitted data:</strong><br><br>

${mainMessage}`;
}
