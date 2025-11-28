import type { ExpenseFormData, Church } from "./types";

// Generate the main message for the email
export function generateMainMessage(form: ExpenseFormData): string {
  return `
  <br>
  <strong>Name:</strong> ${form.name}<br>
  <strong>Email:</strong> ${form.email}<br>
  <strong>Date of Expense:</strong> ${form.date}<br>
  <strong>Description:</strong> ${form.description}<br>
  <strong>Purpose:</strong> ${form.purpose}<br>
  <strong>Total:</strong> ${form.total}<br>
  ${form.iban ? `<strong>Bank account:</strong> ${form.iban}<br>` : ""}
  ${form.accountName ? `<strong>Account Holder:</strong> ${form.accountName}<br>` : ""}
  <br>
`;
}

// Generate message to the submitter
export function generateMessageToSubmitter(
  church: Church,
  submitter: string
): string {
  return `Dear ${submitter},<br><br>

Thank you for submitting an expense form. We will process it shortly.<br>
If you don't hear from us, or if the reimbursement doesn't arrive to you within 2 weeks, then please reach out to us at ${church.financeEmail}.<br><br>

${church.financeContactName}<br>
Finance Team<br>
${church.churchLongName}<br><br>
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
  mainMessage: string
): string {
  return `Dear ${submitter},<br><br>

Thanks for covering the church expenses! <br>
I've sent the reimbursement to your account. If you have any questions, feel free to email us at ${church.financeEmail}.<br><br>

${church.financeContactName}<br>
Finance Team<br>
${church.churchLongName}<br><br>

<strong>Ps - the submitted data:</strong><br><br>

${mainMessage}`;
}
