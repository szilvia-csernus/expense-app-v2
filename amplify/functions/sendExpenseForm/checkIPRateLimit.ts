const IP_RATE_LIMITS = new Map<
  string,
  { count: number; firstRequestTime: number; restricted: boolean }
>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  const existing = IP_RATE_LIMITS.get(ip) || {
    count: 0,
    firstRequestTime: now,
    restricted: false,
  };

  // Reset if 1 day passed - unlikely scenario, cold start resets IP_RATE_LIMITS anyway
  if (now - existing.firstRequestTime > oneDay) {
    existing.count = 0;
    existing.firstRequestTime = now;
    existing.restricted = false;
  } else if (now - existing.firstRequestTime > oneMinute) {
    existing.count = 0;
    existing.firstRequestTime = now;
    // Keep restriction status for banned IPs within 24 hours
    console.log(`IP ${ip} time window reset (restriction status unchanged)`);
  }

  // If IP is restricted, deny all requests for the Lambda lifecycle
  if (existing.restricted) {
    console.log(`Blocked restricted IP: ${ip}`);
    return false;
  }

  // Increment count for current request
  existing.count++;

  // If exceeded limit within 1 minute, restrict permanently for 1 day or this Lambda lifecycle
  if (existing.count > 5) {
    existing.restricted = true;
    console.log(
      `IP ${ip} exceeded rate limit (${existing.count} requests in 1 minute). Restricting for Lambda lifecycle.`
    );
    IP_RATE_LIMITS.set(ip, existing);
    return false;
  }

  // Update the record
  IP_RATE_LIMITS.set(ip, existing);
  console.log(
    `IP ${ip}: ${existing.count}/5 requests today / in current lambda lifecycle`
  );
  return true;
}
