import { modalMessageActions } from "./modal-message-slice";
import { formActions } from "./form-slice";
import { callAfterTimeout } from "../Utils/timeout";
import { post } from "aws-amplify/api";
import type { AppDispatch } from ".";

import { apiName } from "../configureAmplify";

console.log("All env vars:", import.meta.env);

/** Error handler. Stop sending the form and show error message. */
const handleError = (dispatch: AppDispatch, title: string, message: string) => {
  dispatch(formActions.resetSending());
  dispatch(
    modalMessageActions.setMessage({
      title,
      message,
    })
  );
  dispatch(modalMessageActions.open());
};

/** Error message when there is no network, user has to resubmit the form
 * when the network recovers. */
export const noNetworkError = (dispatch: AppDispatch) => {
  handleError(
    dispatch,
    "YOU'RE OFFLINE",
    `It seems you have no network connection. Please try resubmitting 
        your form when your network recovers.`
  );
};

/** Warning message when there is no network, but we'll try sending the form
 * in the backcground. */
export const sendFormLaterError = (dispatch: AppDispatch) => {
  handleError(
    dispatch,
    "ERROR",
    `It seems you have no network connection. We 
        will attempt to resend your form in the next 48 hours 
        if your network recovers during this time. However, 
        if you don't receive a confirmation email within this period, 
        please try resubmitting your form.`
  );
};

/** Error message when we don't want to provide further details about the error. */
const unKnownError = (dispatch: AppDispatch) => {
  handleError(
    dispatch,
    "ERROR",
    `An unknown error occured, apologies for the inconvenience!`
  );
};

/** Error message when we can't process the image. */
const wrongImageError = (dispatch: AppDispatch) => {
  handleError(
    dispatch,
    "ERROR",
    `Unfortunately, we were unable to process the file you've uploaded.
        Please try another file format!`
  );
};

/** Error message when the human-verification (Turnstile) check fails. */
const verificationError = (dispatch: AppDispatch) => {
  handleError(
    dispatch,
    "VERIFICATION FAILED",
    `We couldn't verify that you're human. Please try submitting the form again.`
  );
};

/** Send expense form to the backend Lambda function, display success or error messages,
 * reset form if necessary. */
export const send = async (
  dispatch: AppDispatch,
  formData: FormData,
  churchPK: string,
  resetForm: () => void,
  resetFileUploader: () => void,
  getTurnstileToken: () => Promise<string>
) => {
  dispatch(formActions.setSending());

  try {
    // Create simple form data object (no file processing)
    const formDataObj: Record<string, string> = {};
    let totalFileSize = 0;

    // Process form fields and calculate file sizes
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        totalFileSize += value.size;

        // Validate file type
        if (
          !(
            value.type.startsWith("image/") ||
            value.type.startsWith("application/pdf")
          )
        ) {
          wrongImageError(dispatch);
          return;
        }
      } else {
        formDataObj[key] = value;
      }
    }

    if (!formDataObj.iban || formDataObj.iban.length === 0) {
      delete formDataObj.iban;
    }
    if (!formDataObj.accountName || formDataObj.accountName.length === 0) {
      delete formDataObj.accountName;
    }

    const totalSizeMB = totalFileSize / (1024 * 1024);
    console.log(`Total file size: ${totalSizeMB.toFixed(2)}MB`);

    if (totalSizeMB > 4.5) {
      // Lambda has a 6MB limit for synchronous invocations
      handleError(
        dispatch,
        "FILES TOO LARGE",
        "Images too large. Please reduce total size to under 4.5MB."
      );
      return;
    }

    // All frontend checks have passed — now run the human-verification
    // (Turnstile) challenge just before submitting, so we don't spend a
    // token on a submission that would have failed local validation.
    let turnstileToken: string;
    try {
      turnstileToken = await getTurnstileToken();
    } catch (error) {
      console.error("Turnstile challenge failed:", error);
      verificationError(dispatch);
      return;
    }

    const apiFormData = new FormData();
    apiFormData.append("formData", JSON.stringify(formDataObj));
    apiFormData.append("churchPK", churchPK);
    apiFormData.append("turnstileToken", turnstileToken);

    console.log("Formdata and churchPK appended to apiFormData");

    // Add files directly (no byte conversion needed)
    for (const [, value] of formData.entries()) {
      if (value instanceof File) {
        apiFormData.append("receipts", value, value.name);
      }
    }

    console.log("Files appended to apiFormData, sending form...");

    try {
      // Send as multipart/form-data
      const sendForm = post({
        apiName: apiName,
        path: "submit-expense",
        options: {
          body: apiFormData, // No Content-Type header needed, browser sets correct Content-Type automatically
        },
      });

      const { body } = await sendForm.response;
      const response = await body.json();

      console.log("Response from API:", response);
      dispatch(formActions.resetSending());
      dispatch(
        modalMessageActions.setMessage({
          title: "Thank You!",
          message: "Your Expense Form has been sent successfully.",
        })
      );
      dispatch(modalMessageActions.open());
      callAfterTimeout(dispatch, modalMessageActions.close);
      resetForm();
      // if (response.status === 406 || responseText.includes("406")) {
      //   wrongImageError(dispatch);
      resetFileUploader();
      // } else if (response.status === 429) {
      //   handleError(
      //     dispatch,
      //     "LIMIT REACHED",
      //     "Monthly request limit exceeded."
      //   );
      // } else {
      //   console.error("API Error:", sendFormResponse.status, responseText);
      //   unKnownError(dispatch);
      // }
    } catch (error) {
      console.error("Error sending form:", error);
      resetForm();
      unKnownError(dispatch);
    }
  } catch (error) {
    console.error("Error sending form:", error);
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      sendFormLaterError(dispatch);
      resetForm();
    } else {
      noNetworkError(dispatch);
    }
  }
};
