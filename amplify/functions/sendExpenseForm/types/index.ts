export interface ExpenseFormData {
  name: string;
  email: string;
  date: string;
  description: string;
  purpose: string;
  total: string;
  iban?: string | null;
  accountName?: string | null;
  church: string;
  receipts: string[]; // string values are data URLs
}

export interface Church {
  financeEmail: string | null;
  financeContactName: string | null;
  churchLongName: string | null;
  claimsCounter: number | null;
  logo: string | null;
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}
