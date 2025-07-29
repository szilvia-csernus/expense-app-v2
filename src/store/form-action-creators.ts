import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { errorMessageActions } from "./error-message-slice";
import { thankYouMessageActions } from "./thank-you-message-slice";
import { costFormActions } from "./cost-form-slice";
import { type AppDispatch } from ".";
import { type Action, type Dispatch } from "redux";

/** Dispatch the callback function after 10s delay. */
function callAfterTimeout(dispatch: AppDispatch, callback: () => Action) {
  const timeoutId = setTimeout(() => {
    dispatch(callback());
  }, 10000);

  return () => clearTimeout(timeoutId);
}

/** Error handler. Stop sending the form and show error message. */
const handleError = (dispatch: Dispatch, title: string, message: string) => {
  dispatch(costFormActions.resetSending());
  dispatch(
    errorMessageActions.setMessage({
      title,
      message,
    })
  );
  dispatch(errorMessageActions.open());
};

/** Error message when there is no network, user has to resubmit the form
 * when the network recovers. */
export const noNetworkError = (dispatch: Dispatch) => {
  handleError(
    dispatch,
    "ERROR",
    `It seems you have no network connection. Please try resubmitting 
        your form when your network recovers.`
  );
};

/** Warning message when there is no network, but we'll try sending the form
 * in the backcground. */
export const sendFormLaterError = (dispatch: Dispatch) => {
  handleError(
    dispatch,
    "YOU'RE OFFLINE",
    `It seems you have no network connection. We 
        will attempt to resend your form in the next 48 hours 
        if your network recovers during this time. However, 
        if you don't receive a confirmation email within this period, 
        please try resubmitting your form.`
  );
};

/** Error message when we don't want to provide further details about the error. */
const unKnownError = (dispatch: Dispatch) => {
  handleError(
    dispatch,
    "ERROR",
    `An unknown error occured, apologies for the inconvenience!`
  );
};

/** Error message when we can't process the image. */
const wrongImageError = (dispatch: Dispatch) => {
  handleError(
    dispatch,
    "ERROR",
    `Unfortunately, we were unable to process the file(s) you've uploaded. 
        Please try another file format!`
  );
};

const convertToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const dataURL = async (file: File) => {
  return await convertToDataURL(file);
};

/** Send expense form to the backend Lambda function, display success or error messages,
 * reset form if necessary. */
export const send = async (
  dispatch: Dispatch,
  formData: FormData,
  churchPK: string,
  resetForm: () => void,
  resetFileUploader: () => void
) => {
  dispatch(costFormActions.setSending());

  try {
    // Create a plain object from form data
    const formDataObj: Record<string, string | string[] | null> = {};
    // Create receipts array
    const receiptsArray: string[] = [];

    // Process standard form fields
    for (const [key, value] of formData.entries()) {
      // Skip file objects, we'll handle them below
      if (!(value instanceof File)) {
        formDataObj[key] = value;
      }
    }

    // Process file objects - convert to dataURLs
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        try {
          // Convert file to dataURL
          const dataURL = await convertToDataURL(value);
          // Add to receiptsArray
          receiptsArray.push(dataURL);
        } catch (error) {
          console.error(`Error converting file ${key} to dataURL:`, error);
          wrongImageError(dispatch);
          return;
        }
      }
    }

    // Add receipts array to form values
    formDataObj.receipts = receiptsArray;

    if (!formDataObj.iban || formDataObj.iban.length === 0) {
      delete formDataObj.iban;
    }
    if (!formDataObj.accountName || formDataObj.accountName.length === 0) {
      delete formDataObj.accountName;
    }

    // Log the form data object for debugging

    console.log("Sending formData:", JSON.stringify(formDataObj));

    const client = generateClient<Schema>();
    const response = await client.queries.sendExpenseForm({
      formData: JSON.stringify(formDataObj),
      churchPK: churchPK,
    });

    if (response.data) {
      dispatch(costFormActions.resetSending());
      dispatch(thankYouMessageActions.open());
      callAfterTimeout(dispatch, thankYouMessageActions.close);
      resetForm();
    } else if (response.errors && response.errors.length > 0) {
      // Check if any error message contains the 406 status code
      const hasImageError = response.errors.some(
        (error) =>
          error.message?.includes("406") ||
          (error.extensions?.code as string)?.includes("406")
      );

      if (hasImageError) {
        wrongImageError(dispatch);
        resetFileUploader();
      } else {
        unKnownError(dispatch);
      }
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
