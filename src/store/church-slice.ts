import { createSlice } from "@reduxjs/toolkit";
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs);

// Read query parameter from url. If there is an "adm" key, set its value as church,
// otherwise, if there is a "church" key in localStorage, set its value as church,
// otherwise set church to an empty string.
function getInitialChurch() {
  const params = new URLSearchParams(window.location.search);
  const adm = params.get("adm");
  let localChurch = "";
  try {
    localChurch = localStorage.getItem("church") || "";
  } catch {
    localChurch = "";
  }
  return adm !== null ? adm : localChurch;
}

const initialChurch = getInitialChurch();
try {
  localStorage.setItem("church", initialChurch);
} catch (e) {
  console.error("Failed to set church in localStorage:", e);
}

// Returns false if no church was selected and neither was a church present in the url
const initialStatus = initialChurch === "";

const churchSlice = createSlice({
  name: "church",
  initialState: {
    churches: [] as string[],
    status: initialStatus,
    churchName: initialChurch,
    churchPK: "",
    fetchingDetailsInProcess: false,
    fetchingChurchesInProcess: false,
    logo: "",
    costPurposes: [] as { name: string; costCode: number }[],
  },
  reducers: {
    open(state) {
      state.status = true;
    },
    close(state) {
      state.status = false;
    },
    setChurch(state, action) {
      state.churchName = action.payload.name;
      state.churchPK = action.payload.churchPK;
      localStorage.setItem("church", action.payload.name);
    },
    resetChurch(state) {
      state.status = true;
      state.churchName = "";
      localStorage.removeItem("church");
    },
    setFetchingDetailsInProcess(state, action) {
      state.fetchingDetailsInProcess = action.payload;
    },
    setChurchDetails(state, action) {
      state.logo = action.payload["logo"];

      // Sort costPurposes array
      const costPurposes = action.payload["costPurposes"];
      costPurposes.sort(
        (
          a: { name: string; costCode: number },
          b: { name: string; costCode: number }
        ) => {
          // Make "Other" or "other" appear last
          if (a.name.toLowerCase() === "other") return 1;
          if (b.name.toLowerCase() === "other") return -1;

          // Otherwise, sort in alphabetical order
          return a.name.localeCompare(b.name);
        }
      );

      state.costPurposes = costPurposes;
    },
    setChurches(state, action) {
      state.churches = action.payload;
    },
    setFetchingChurchesInProcess(state, action) {
      state.fetchingChurchesInProcess = action.payload;
    },
  },
});

export const churchActions = churchSlice.actions;

export default churchSlice;
