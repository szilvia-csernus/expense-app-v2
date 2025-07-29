import { type Dispatch } from "@reduxjs/toolkit";
import { churchActions } from "./church-slice";
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../../amplify/data/resource";

export const getChurchDetails = (dispatch: Dispatch, churchPK: string) => {
  dispatch(churchActions.setFetchingDetailsInProcess(true));
  const fetchData = async () => {
    const expenseAppClient = generateClient<Schema>().models.ExpenseApp;
    // find church details in the database
    const responseProfile = await expenseAppClient.list({
      filter: { PK: { eq: churchPK }, SK: { eq: "PROFILE" } },
			selectionSet: ["logo"],
    });

    console.log("church profile response:", responseProfile);
    const churchFound = responseProfile.data[0];

    if (responseProfile.errors || !churchFound) {
      console.error("Error fetching church details:", responseProfile.errors);
      dispatch(churchActions.resetChurch());
      return;
    }

		const logo = churchFound.logo
      ? churchFound.logo
      : "https://res.cloudinary.com/dgp5kmp7u/image/upload/v1707902919/media/logos/logo-placeholder.png";

    const responseCostPurposes = await expenseAppClient.list({
      filter: { PK: { eq: churchPK }, SK: { beginsWith: "COSTPURPOSE#" } },
      selectionSet: ["costPurposeName", "costCode"],
    });

    if (responseCostPurposes.errors) {
      console.error(
        "Error fetching cost purposes:",
        responseCostPurposes.errors
      );
      return;
    }

    const costPurposes = responseCostPurposes.data.map((item) => ({
      name: item.costPurposeName,
      costCode: item.costCode,
    }));
    
    dispatch(churchActions.setChurchDetails({ logo, costPurposes }));
    // Pre-fetch and cache the logo image before the form gets rendered. While
    // fetchingInProcess is true, the loader is active on the form.
    const img = new Image();
    img.src = logo;
    img.onload = () => {
      dispatch(churchActions.setFetchingDetailsInProcess(false));
    };
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

export const getChurchNames = (dispatch: Dispatch, initialChurch: string) => {
  dispatch(churchActions.setFetchingChurchesInProcess(true));

  const fetchData = async () => {
    const expenseAppClient = generateClient<Schema>().models.ExpenseApp;
    // Query all items where SK is "PROFILE"
    const response = await expenseAppClient.list({
      filter: { SK: { eq: "PROFILE" } },
      selectionSet: ["churchShortName"],
    });
    console.log(response);
    const churchList = response.data.map((item) => item.churchShortName);

    // if initial church is not in the list of churches in the database, reset initial church.
    if (!churchList.includes(initialChurch)) {
      dispatch(churchActions.resetChurch());
    }

    dispatch(churchActions.setChurches(churchList));
    dispatch(churchActions.setFetchingChurchesInProcess(false));
  };
  return fetchData();
};

export const getChurchPK = (dispatch: Dispatch, church: string) => {
  const fetchData = async () => {
    const expenseAppClient = generateClient<Schema>().models.ExpenseApp;
    // Query all items where SK is "PROFILE"
    
    const response = await expenseAppClient.list({
      filter: { SK: { eq: "PROFILE" }, churchShortName: { eq: church } },
      selectionSet: ["PK", "churchShortName"],
    });
    console.log("church PK response: ",response);
    
		if (response.errors) {
			console.error("Church not found in the database:", response.errors);
			return '';
		}
		const PK = response.data[0].PK;

		dispatch(churchActions.setChurch({ name: church, churchPK: PK }));

		getChurchDetails(dispatch, PK);
  };
  return fetchData();
};