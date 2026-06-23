import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cache the secret across warm invocations to avoid an SSM call per request.
let cachedSecret: string | undefined;

async function loadSecret(): Promise<string | undefined> {
  if (cachedSecret) {
    return cachedSecret;
  }
  const parameterName = process.env.TURNSTILE_SECRET_KEY;
  if (!parameterName) {
    return undefined;
  }
  const response = await ssmClient.send(
    new GetParameterCommand({ Name: parameterName, WithDecryption: true })
  );
  cachedSecret = response.Parameter?.Value;
  return cachedSecret;
}

/**
 * Verify a Cloudflare Turnstile token against the siteverify endpoint.
 * Fails closed: returns false if the token is missing, the secret is not
 * configured, or the verification request errors.
 */
export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string
): Promise<boolean> {
  if (!token) {
    console.warn("Turnstile: no token supplied");
    return false;
  }

  const secret = await loadSecret();
  if (!secret) {
    console.error("Turnstile: TURNSTILE_SECRET_KEY not configured");
    return false;
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });
    const data = (await response.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (!data.success) {
      console.warn("Turnstile verification failed:", data["error-codes"]);
    }
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification request errored:", error);
    return false;
  }
}
