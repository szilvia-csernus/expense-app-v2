import { defineFunction } from "@aws-amplify/backend";

export const sendExpenseForm = defineFunction({
  // optional - defaults to directory name anyway
  name: "sendExpenseForm",
  // optional - defaults to "./handler.ts" anyway
  entry: "./handler.ts",
  timeoutSeconds: 30, // Increase from 3s to 30s
  environment: {
    AMPLIFY_DATA_DEFAULT_NAME: "main",
  },
  runtime: 22, // Use Node.js 22 runtime
  resourceGroupName: "data", // Optional - groupping this function with the data resource
});
