import { defineFunction } from "@aws-amplify/backend";

export const sendExpenseForm = defineFunction({
  // optional - defaults to directory name anyway
  name: "sendExpenseForm",
  // optional - defaults to "./handler.ts" anyway
  entry: "./handler.ts",
  timeoutSeconds: 60,
  memoryMB: 512, // Increased memory neccessary for image and pdf processing
  environment: {
    AMPLIFY_DATA_DEFAULT_NAME: "main",
  },
  runtime: 22, // Use Node.js 22 runtime
  resourceGroupName: "data", // assign to the data stack to avoid circular dependencies
});
