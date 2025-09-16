import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { sendExpenseForm } from "../functions/sendExpenseForm/resource";

const schema = a
  .schema({
    ExpenseApp: a
      .model({
        PK: a // Partition Key: e.g. CHURCH#1
          .string()
          .required()
          .authorization((allow) => [
            allow.publicApiKey().to(["read", "update"]),
          ]),
        SK: a // Sort Key: e.g. PROFILE or COSTPURPOSE#22
          .string()
          .required()
          .authorization((allow) => [
            allow.publicApiKey().to(["read", "update"]),
          ]),
        churchShortName: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["update"]),
          ]),
        churchLongName: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["update"]),
          ]),
        logo: a
          .url()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["update"]),
          ]),
        claimsCounter: a
          .integer()
          .authorization((allow) => [
            allow.publicApiKey().to(["read", "update"]),
            allow.authenticated().to(["update"]),
          ]),
        financeContactName: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["update"]),
          ]),
        financeEmail: a
          .email()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["update"]),
          ]),
        costPurposeName: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["update"]),
          ]),
        costCode: a
          .integer()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["update"]),
          ]),
      })
      .identifier(["PK", "SK"])
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()]),
  })
  .authorization((allow) => [
    allow.publicApiKey(), // For frontend reads
    allow.authenticated(), // For authenticated users
    allow.resource(sendExpenseForm), // Allow Lambda at schema level
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
