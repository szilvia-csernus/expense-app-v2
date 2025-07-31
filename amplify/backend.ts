import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { receiptsBucket } from "./storage/resource";
import { sendExpenseForm } from "./functions/sendExpenseForm/resource";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  receiptsBucket,
  sendExpenseForm,
});
