import { type Dispatch } from "@reduxjs/toolkit";
import { churchActions } from "./church-slice";
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../../amplify/data/resource";
import type { AppDispatch } from ".";
import { modalMessageActions } from "./modal-message-slice";
import { callAfterTimeout } from "../Utils/timeout";

export const getChurchDetails = (dispatch: Dispatch, churchPK: string) => {
  dispatch(churchActions.setFetchingDetailsInProcess(true));
  const fetchData = async () => {
    const expenseAppClient = generateClient<Schema>({ authMode: "apiKey" })
      .models.ExpenseApp;
    // find church details in the database
    const responseProfile = await expenseAppClient.list({
      filter: { PK: { eq: churchPK }, SK: { eq: "PROFILE" } },
      selectionSet: ["logo", "churchShortName"],
    });

    console.log("church profile response:", responseProfile);
    const churchFound = responseProfile.data[0];

    if (responseProfile.errors || !churchFound) {
      console.error("Error fetching church details:", responseProfile.errors);
      return;
    } else {
      dispatch(churchActions.setFetchingDetailsInProcess(false));
    }

    const logo = churchFound.logo
      ? churchFound.logo
      : "https://res.cloudinary.com/dgp5kmp7u/image/upload/v1707902919/media/logos/logo-placeholder.png";

    const churchShortName = churchFound.churchShortName || "";

    const responseCostPurposes = await expenseAppClient.list({
      filter: { PK: { eq: churchPK }, SK: { beginsWith: "COSTPURPOSE#" } },
      selectionSet: ["costPurposeName", "costCode", "SK"],
    });

    if (responseCostPurposes.errors) {
      console.error(
        "Error fetching cost purposes:",
        responseCostPurposes.errors
      );
      return;
    }

    const costPurposes = responseCostPurposes.data;

    dispatch(
      churchActions.setChurchDetails({ logo, churchShortName, costPurposes })
    );
    // Pre-fetch and cache the logo image before the form gets rendered. While
    // fetchingInProcess is true, the loader is active on the form.
    // const img = new Image();
    // img.src = logo;
    // img.onload = () => {
    //   dispatch(churchActions.setFetchingDetailsInProcess(false));
    // };
    // const response = await fetch(
    // 	`/api/churches/details/?church=${church}`
    // );
    // const data = await response.json();
    // const cost_purposes = data.cost_purposes;
    // const churchLogo = data.logo;
    // if (response.errors || !churchFound) {
    // 	console.error('Error fetching church details:', response.errors);
    //     dispatch(churchActions.resetChurch())
    // } else {
    // 	const logo = churchFound.logo
    // 		? churchFound.logo
    // 		: 'https://res.cloudinary.com/dgp5kmp7u/image/upload/v1707902919/media/logos/logo-placeholder.png';
    // 	dispatch(churchActions.setChurchDetails({ logo, costPurposes }));
    // 	// Pre-fetch and cache the logo image before the form gets rendered. While
    // 	// fetchingInProcess is true, the loader is active on the form.
    // 	const img = new Image();
    // 	img.src = logo;
    // 	img.onload = () => {
    // 		dispatch(churchActions.setFetchingDetailsInProcess(false));
    // 	};
    // }
  };
  return fetchData();
};

export const getChurchDetailsForAdmin = (
  dispatch: Dispatch,
  churchPK: string
) => {
  dispatch(churchActions.setFetchingDetailsInProcess(true));
  const fetchData = async () => {
    const expenseAppClient = generateClient<Schema>().models.ExpenseApp;
    // find church details in the database
    const responseProfile = await expenseAppClient.list({
      filter: { PK: { eq: churchPK }, SK: { eq: "PROFILE" } },
      selectionSet: [
        "logo",
        "churchShortName",
        "churchLongName",
        "financeContactName",
        "financeEmail",
        "claimsCounter",
      ],
    });

    console.log("church profile response:", responseProfile);
    const churchFound = responseProfile.data[0];

    if (responseProfile.errors || !churchFound) {
      console.error("Error fetching church details:", responseProfile.errors);
      return;
    } else {
      dispatch(churchActions.setFetchingDetailsInProcess(false));
    }

    const logo = churchFound.logo
      ? churchFound.logo
      : "https://res.cloudinary.com/dgp5kmp7u/image/upload/v1707902919/media/logos/logo-placeholder.png";

    const churchShortName = churchFound.churchShortName || "";
    const churchLongName = churchFound.churchLongName || "";
    const financeContactName = churchFound.financeContactName || "";
    const financeEmail = churchFound.financeEmail || "";
    const claimsCounter = churchFound.claimsCounter || 0;

    const responseCostPurposes = await expenseAppClient.list({
      filter: { PK: { eq: churchPK }, SK: { beginsWith: "COSTPURPOSE#" } },
      selectionSet: ["costPurposeName", "costCode", "SK"],
    });

    if (responseCostPurposes.errors) {
      console.error(
        "Error fetching cost purposes:",
        responseCostPurposes.errors
      );
      return;
    }

    const costPurposes = responseCostPurposes.data;

    dispatch(
      churchActions.setChurchDetails({
        logo,
        churchShortName,
        churchLongName,
        financeContactName,
        financeEmail,
        claimsCounter,
        costPurposes,
      })
    );
    // Pre-fetch and cache the logo image before the form gets rendered. While
    // fetchingInProcess is true, the loader is active on the form.
    // const img = new Image();
    // img.src = logo;
    // img.onload = () => {
    //   dispatch(churchActions.setFetchingDetailsInProcess(false));
    // };
  };
  return fetchData();
};

export const updateChurchData = async (
  dispatch: AppDispatch,
  churchPK: string,
  fieldName: string,
  fieldValue: string
) => {
  try {
    const client = generateClient<Schema>();
    const response = await client.models.ExpenseApp.update(
      {
        PK: churchPK,
        SK: "PROFILE",
        [fieldName]: fieldValue,
      },
      { authMode: "userPool" }
    );

    // Check for GraphQL errors
    if (response.errors && response.errors.length > 0) {
      // Show error message from GraphQL response
      dispatch(
        modalMessageActions.setMessage({
          title: "ERROR",
          message:
            response.errors[0].message ||
            "Failed to update church data. Please try again.",
        })
      );
      dispatch(modalMessageActions.open());
      return; // Do not show success or update state
    }

    // Only proceed if no errors
    dispatch(
      modalMessageActions.setMessage({
        title: "SUCCESS",
        message: "Church data has been updated successfully.",
      })
    );
    dispatch(modalMessageActions.open());
    callAfterTimeout(dispatch, modalMessageActions.close);

    dispatch(
      churchActions.setChurchDetails({
        [fieldName]: fieldValue,
      })
    );
  } catch (error) {
    console.error("Error updating church data:", error);
    dispatch(
      modalMessageActions.setMessage({
        title: "Update Failed",
        message: "Failed to update church data. Please try again.",
      })
    );
    dispatch(modalMessageActions.open());
  }
};

export const deleteCostPurpose = async (
  dispatch: AppDispatch,
  churchPK: string,
  costPurposeSK: string
) => {
  try {
    const client = generateClient<Schema>();
    const response = await client.models.ExpenseApp.delete(
      {
        PK: churchPK,
        SK: costPurposeSK,
      },
      { authMode: "userPool" }
    );

    // Check for GraphQL errors
    if (response.errors && response.errors.length > 0) {
      // Show error message from GraphQL response
      dispatch(
        modalMessageActions.setMessage({
          title: "ERROR",
          message:
            response.errors[0].message ||
            "Failed to delete cost purpose. Please try again.",
        })
      );
      dispatch(modalMessageActions.open());
      return; // Do not show success or update state
    }

    // Only proceed if no errors
    dispatch(
      modalMessageActions.setMessage({
        title: "SUCCESS",
        message: "Cost purpose has been deleted successfully.",
      })
    );
    dispatch(modalMessageActions.open());
    callAfterTimeout(dispatch, modalMessageActions.close);

    // Remove the deleted cost purpose from the state
    dispatch(
      churchActions.removeCostPurpose({
        SK: costPurposeSK,
      })
    );
  } catch (error) {
    console.error("Error deleting cost purpose:", error);
    dispatch(
      modalMessageActions.setMessage({
        title: "Delete Failed",
        message: "Failed to delete cost purpose. Please try again.",
      })
    );
    dispatch(modalMessageActions.open());
  }
};

export const updateCostPurpose = async (
  dispatch: AppDispatch,
  churchPK: string,
  costPurposeSK: string,
  costPurposeName: string,
  costCode?: number
) => {
  try {
    const client = generateClient<Schema>();
    const costCodeValue = costCode && costCode !== 0 ? costCode : null; // Convert 0 to null
    const response = await client.models.ExpenseApp.update(
      {
        PK: churchPK,
        SK: costPurposeSK,
        costPurposeName,
        costCode: costCodeValue,
      },
      { authMode: "userPool" }
    );

    // Check for GraphQL errors
    if (response.errors && response.errors.length > 0) {
      // Show error message from GraphQL response
      dispatch(
        modalMessageActions.setMessage({
          title: "ERROR",
          message:
            response.errors[0].message ||
            "Failed to update cost purpose. Please try again.",
        })
      );
      dispatch(modalMessageActions.open());
      return; // Do not show success or update state
    }

    // Only proceed if no errors
    dispatch(
      modalMessageActions.setMessage({
        title: "SUCCESS",
        message: "Cost purpose has been updated successfully.",
      })
    );
    dispatch(modalMessageActions.open());
    callAfterTimeout(dispatch, modalMessageActions.close);

    dispatch(
      churchActions.editCostPurpose({
        SK: costPurposeSK,
        costPurposeName,
        costCode: costCodeValue,
      })
    );
  } catch (error) {
    console.error("Error updating cost purpose:", error);
    dispatch(
      modalMessageActions.setMessage({
        title: "Update Failed",
        message: "Failed to update cost purpose. Please try again.",
      })
    );
    dispatch(modalMessageActions.open());
  }
};

export const addCostPurpose = async (
  dispatch: AppDispatch,
  churchPK: string,
  greatestSK: number,
  costPurposeName: string,
  costCode?: number
) => {
  try {
    const client = generateClient<Schema>();
    const costCodeValue = costCode !== 0 ? costCode : null;
    const response = await client.models.ExpenseApp.create(
      {
        PK: churchPK,
        costPurposeName,
        SK: `COSTPURPOSE#${greatestSK + 1}`,
        ...(costCode ? { costCode: costCodeValue } : {}),
      },
      { authMode: "userPool" }
    );

    // Check for GraphQL errors
    if (response.errors && response.errors.length > 0) {
      // Show error message from GraphQL response
      dispatch(
        modalMessageActions.setMessage({
          title: "ERROR",
          message:
            response.errors[0].message ||
            "Failed to add cost purpose. Please try again.",
        })
      );
      dispatch(modalMessageActions.open());
      return; // Do not show success or update state
    }

    // Only proceed if no errors
    dispatch(
      modalMessageActions.setMessage({
        title: "SUCCESS",
        message: "Cost purpose has been added successfully.",
      })
    );
    dispatch(modalMessageActions.open());
    callAfterTimeout(dispatch, modalMessageActions.close);

    dispatch(
      churchActions.addCostPurpose({
        costPurposeName,
        costCode: costCodeValue,
        SK: response.data?.SK,
      })
    );
  } catch (error) {
    console.error("Error adding cost purpose:", error);
    dispatch(
      modalMessageActions.setMessage({
        title: "Add Failed",
        message: "Failed to add cost purpose. Please try again.",
      })
    );
    dispatch(modalMessageActions.open());
  }
};
