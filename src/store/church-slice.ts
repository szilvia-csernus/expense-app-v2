import { createSlice } from "@reduxjs/toolkit";
import { calculateGreatestSK } from "../Utils/calculateGreatestSK";

const churchSlice = createSlice({
  name: "church",
  initialState: {
    churchPK: "CHURCH#1",
    churchShortName: "",
    churchLongName: "",
    financeContactName: "",
    financeEmail: "",
    claimsCounter: 0,
    fetchingDetailsInProcess: false,
    logo: "",
    costPurposes: [] as {
      costPurposeName: string;
      costCode: number;
      SK: `COSTPURPOSE#${string}` | undefined;
    }[],
    greatestCostPurposeSKNumber: null as number | null,
  },
  reducers: {
    setFetchingDetailsInProcess(state, action) {
      state.fetchingDetailsInProcess = action.payload;
    },
    setChurchDetails(state, action) {
      if (action.payload["logo"]) {
        state.logo = action.payload["logo"];
      }

      if (action.payload["churchShortName"]) {
        state.churchShortName = action.payload["churchShortName"];
      }

      if (action.payload["churchLongName"]) {
        state.churchLongName = action.payload["churchLongName"];
      }

      if (action.payload["financeContactName"]) {
        state.financeContactName = action.payload["financeContactName"];
      }

      if (action.payload["financeEmail"]) {
        state.financeEmail = action.payload["financeEmail"];
      }

      if (action.payload["claimsCounter"]) {
        state.claimsCounter = action.payload["claimsCounter"];
      }

      if (action.payload["costPurposes"] === undefined) {
        return;
      } else {
        // Sort costPurposes array
        const costPurposes = action.payload["costPurposes"];
        costPurposes.sort(
          (
            a: {
              costPurposeName: string;
              costCode: number;
              SK: `COSTPURPOSE#${string}` | undefined;
            },
            b: {
              costPurposeName: string;
              costCode: number;
              SK: `COSTPURPOSE#${string}` | undefined;
            }
          ) => {
            // Make "Other" or "other" appear last
            if (a.costPurposeName.toLowerCase() === "other") return 1;
            if (b.costPurposeName.toLowerCase() === "other") return -1;

            // Otherwise, sort in alphabetical order
            return a.costPurposeName.localeCompare(b.costPurposeName);
          }
        );

        state.costPurposes = costPurposes;

        const greatestSK = calculateGreatestSK(costPurposes);
        state.greatestCostPurposeSKNumber = greatestSK ? greatestSK : null;
      }
    },
    editCostPurpose(state, action) {
      const index = state.costPurposes.findIndex(
        (item) => item.SK === action.payload.SK
      );
      if (index !== -1) {
        state.costPurposes[index] = action.payload;
      }
    },
    addCostPurpose(state, action) {
      state.costPurposes.push(action.payload);
    },
    removeCostPurpose(state, action) {
      state.costPurposes = state.costPurposes.filter(
        (item) => item.SK !== action.payload.SK
      );
    },
  },
});

export const churchActions = churchSlice.actions;

export default churchSlice;
