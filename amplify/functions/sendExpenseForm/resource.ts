import { defineFunction } from "@aws-amplify/backend";

export const sendExpenseForm = defineFunction({
  // optional - defaults to directory name anyway
  name: "sendExpenseForm",
  // optional - defaults to "./handler.ts" anyway
  entry: "./handler.ts",
  timeoutSeconds: 30, // Increase from 3s to 30s
  memoryMB: 512, // Increase memory
  environment: {
    AMPLIFY_DATA_DEFAULT_NAME: "main",
    // We'll add the storage bucket name via backend configuration
  },
  runtime: 20, // Use Node.js 20 runtime
  resourceGroupName: "storage", // assign to the storage to avoid circular dependencies
});
