import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";
import outputs from "../amplify_outputs.json";

const amplifyConfig = parseAmplifyConfig(outputs);

export const apiName = Object.keys(outputs.custom.API)[0];

Amplify.configure(
  {
    ...amplifyConfig,
    API: {
      ...amplifyConfig.API,
      REST: outputs.custom.API,
    },
  },
  {
    API: {
      REST: {
        retryStrategy: {
          strategy: "no-retry",
        },
      },
    },
  }
);
