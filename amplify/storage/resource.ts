import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "expenseAppStorage",
  isDefault: true,
  access: (allow) => ({
    "logos/*": [
      allow.authenticated.to(["read", "write", "delete"]),
      allow.guest.to(["get"]),
    ],
  }),
});
