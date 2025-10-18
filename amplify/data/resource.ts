import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { sendExpenseFormFunction } from "../functions/sendExpenseForm/resource";

const branch = process.env.AWS_BRANCH || "dev";

const schema = a
  .schema({
    Expense: a
      .model({
        PK: a // Partition Key: e.g. CHURCH#1
          .string()
          .required()
          .authorization((allow) => [
            allow.publicApiKey().to(["read", "update"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
        SK: a // Sort Key: e.g. PROFILE or COSTPURPOSE#22
          .string()
          .required()
          .authorization((allow) => [
            allow.publicApiKey().to(["read", "update"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
        churchShortName: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
        churchLongName: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
        logo: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
        claimsCounter: a
          .integer()
          .authorization((allow) => [
            allow.publicApiKey().to(["read", "update"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
        financeContactName: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
        financeEmail: a
          .email()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
        costPurposeName: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
        costCode: a
          .integer()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.authenticated().to(["create", "read", "update", "delete"]),
          ]),
      })
      .identifier(["PK", "SK"])
      .authorization((allow) => [
        allow.publicApiKey().to(["read", "update"]),
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),
  })
  .authorization((allow) => [
    allow.publicApiKey().to(["read", "update"]), // For frontend reads
    allow.authenticated().to(["create", "read", "update", "delete"]), // For authenticated users
    allow.resource(sendExpenseFormFunction).to(["query", "mutate"]), // Allow Lambda at schema level
  ]);

export type Schema = ClientSchema<typeof schema>;

const schemaName = `ExpenseApp-${branch}`;

export const data = defineData({
  schema,
  name: schemaName,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
