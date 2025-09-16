import { generateClient, GraphQLResult } from "aws-amplify/api";
import type { Schema } from "../../data/resource";
import { Church } from "./types";

type GetChurchProfileResponse = {
  getExpenseApp?: {
    PK: string;
    SK: string;
    financeEmail?: string;
    financeContactName?: string;
    churchShortName?: string;
    churchLongName?: string;
    claimsCounter?: number;
    logo?: string;
  };
};

// Define the update mutation response type
type UpdateChurchProfileResponse = {
  updateExpenseApp?: {
    PK: string;
    SK: string;
    claimsCounter?: number;
  };
};

export async function getChurchDetailsAndUpdateCounter(churchPK: string) {
  const query = /* GraphQL */ `
    query GetChurchProfile($PK: String!, $SK: String!) {
      getExpenseApp(PK: $PK, SK: $SK) {
        PK
        SK
        financeEmail
        financeContactName
        churchShortName
        churchLongName
        claimsCounter
        logo
      }
    }
  `;
  // Create a client
  const client = generateClient<Schema>();

  // Makes sure client.models exists before trying to access it
  if (!client.models) {
    console.error("client.models is undefined");
    return null;
  }

  // Log the available models for debugging
  console.log("Available models:", Object.keys(client.models));

  try {
    // Get the full record
    console.log("Fetching church details for:", churchPK);

    // Execute the query directly
    const result = (await client.graphql({
      query,
      variables: {
        PK: churchPK,
        SK: "PROFILE",
      },
      authMode: "apiKey",
    })) as GraphQLResult<GetChurchProfileResponse>;

    console.log("GraphQL result:", JSON.stringify(result, null, 2));

    if (result.data && result.data.getExpenseApp) {
      // Transform data to match Church type
      const churchData: Church = {
        financeEmail: result.data.getExpenseApp.financeEmail || "",
        financeContactName: result.data.getExpenseApp.financeContactName || "",
        churchShortName: result.data.getExpenseApp.churchShortName || "",
        churchLongName: result.data.getExpenseApp.churchLongName || "",
        claimsCounter: result.data.getExpenseApp.claimsCounter || 0,
        logo: result.data.getExpenseApp.logo || "",
      };

      // Calculate new counter
      const newCounter = (churchData.claimsCounter || 0) + 1;

      // Update mutation
      const updateMutation = /* GraphQL */ `
        mutation UpdateChurchProfile(
          $PK: String!
          $SK: String!
          $claimsCounter: Int!
        ) {
          updateExpenseApp(
            input: { PK: $PK, SK: $SK, claimsCounter: $claimsCounter }
          ) {
            PK
            SK
            claimsCounter
          }
        }
      `;

      // Update the counter
      const updateResult = (await client.graphql({
        query: updateMutation,
        variables: {
          PK: churchPK,
          SK: "PROFILE",
          claimsCounter: newCounter,
        },
        authMode: "apiKey",
      })) as GraphQLResult<UpdateChurchProfileResponse>;

      console.log("Update result:", JSON.stringify(updateResult, null, 2));

      return {
        ...churchData,
        claimsCounter: newCounter,
      };
    } else {
      console.error("No church data found");
      return null;
    }
  } catch (error) {
    console.error("Error getting church details:", error);
    return null;
  }
}
