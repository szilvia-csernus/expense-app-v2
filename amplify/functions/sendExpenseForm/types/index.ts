export interface ReceiptBuffer {
  buffer: Buffer<ArrayBufferLike>;
  mimetype: string;
  filename: string;
}

export interface ExpenseFormData {
  name: string;
  email: string;
  date: string;
  description: string;
  purpose: string;
  total: string;
  iban?: string | null;
  accountName?: string | null;
}

export interface Church {
  financeEmail: string;
  financeContactName: string;
  churchShortName: string;
  churchLongName: string;
  claimsCounter: number;
  logo: string;
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}
