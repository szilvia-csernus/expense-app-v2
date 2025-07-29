import type { ExpenseFormData, Church } from "./types";

// Generate the main message for the email
export function generateMainMessage(form: ExpenseFormData): string {
  return `
  
  Name: ${form.name}
  Email: ${form.email}
  Date of Expense: ${form.date}
  Description: ${form.description}
  Purpose: ${form.purpose}
  Total: ${form.total}
  ${form.iban ? `Bank account: ${form.iban}` : ""}
  ${form.accountName ? `Account Holder: ${form.accountName}` : ""}

`;
}

// Generate message to the submitter
export function generateMessageToSubmitter(
  church: Church,
  submitter: string
): string {
  return `Dear ${submitter},


Thank you for submitting an expense form. We will process it shortly.
If you don't hear from us, or if the reimbursement doesn't arrive to you within 2 weeks, then please reach out to us at ${church.financeEmail}.


${church.financeContactName}
Finance Team
${church.churchLongName}


`;
}

// Generate message to finance
export function generateMessageToFinance(mainMessage: string): string {
  return `Expense Form Submission
${mainMessage}`;
}

export function generateReplyTemplate(
  church: Church,
  submitter: string,
  mainMessage: string
): string {
  return `Dear ${submitter},


Thank you for using your resources for the church. I have transferred the reimbursement to your account. If you have any questions, then please reach out to us at ${church.financeEmail}.


${church.financeContactName}
Finance Team
${church.churchLongName}


Ps - the submitted data:

${mainMessage}`;
}
