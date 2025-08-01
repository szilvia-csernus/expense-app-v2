import { defineStorage } from "@aws-amplify/backend";
import { sendExpenseForm } from "../functions/sendExpenseForm/resource";

export const storage = defineStorage({
  name: "expenses",
  access: (allow) => ({
    "receipts/*": [
      allow.guest.to(["read", "write", "delete"]),
      // allow.authenticated.to(["read", "write", "delete"]),
      allow.resource(sendExpenseForm).to(["read", "delete"]),
    ],
  }),
});
