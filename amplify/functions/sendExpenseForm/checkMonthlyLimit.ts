import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
} from "@aws-sdk/client-ssm";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

export async function checkMonthlyLimit(): Promise<boolean> {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const parameterName = "/expense-app/request-count";

  try {
    // Get current month's count
    let currentCount = 0;
    let storedMonth = "";
    let alreadyNotified = false;
    let warningNotified = false;

    try {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: parameterName,
        })
      );

      const data = JSON.parse(
        response.Parameter?.Value ||
          '{"month":"","count":0,"notified":false,"warningNotified":false}'
      );
      storedMonth = data.month;
      currentCount = data.count;
      alreadyNotified = data.notified || false;
      warningNotified = data.warningNotified || false;
    } catch (error) {
      if (error instanceof Error && error.name === "ParameterNotFound") {
        console.log("Creating new request counter");
      } else {
        throw error;
      }
    }

    // Reset counter if new month
    if (storedMonth !== currentMonth) {
      currentCount = 0;
      storedMonth = currentMonth;
      alreadyNotified = false;
      warningNotified = false;
    }

    // Check if over limit
    if (currentCount >= 100) {
      // Send notification only once per month
      if (!alreadyNotified) {
        await sendLimitExceededNotification(currentMonth, currentCount);

        // Mark as notified
        await ssmClient.send(
          new PutParameterCommand({
            Name: parameterName,
            Value: JSON.stringify({
              month: currentMonth,
              count: currentCount,
              notified: true,
              warningNotified: true, // Already past warning stage
            }),
            Type: "String",
            Overwrite: true,
          })
        );
      }

      console.error(
        `Monthly limit exceeded: ${currentCount} requests in ${currentMonth}`
      );
      return false; // Block request
    }

    // Increment counter
    currentCount++;

    // Send warning notification at 80 requests (only once)
    if (currentCount === 80 && !warningNotified) {
      await sendWarningNotification(currentMonth, currentCount);
      warningNotified = true;
    }

    // Store updated count
    await ssmClient.send(
      new PutParameterCommand({
        Name: parameterName,
        Value: JSON.stringify({
          month: currentMonth,
          count: currentCount,
          notified: alreadyNotified,
          warningNotified: warningNotified,
        }),
        Type: "String",
        Overwrite: true,
      })
    );

    console.log(`Request ${currentCount}/100 for ${currentMonth}`);
    return true; // Allow request
  } catch (error) {
    console.error("Error checking monthly limit:", error);
    return false; // Fail closed — SSM unavailable means the cap cannot be verified
  }
}

async function sendLimitExceededNotification(month: string, count: number) {
  if (!process.env.NOTIFICATION_TOPIC_ARN) {
    console.warn("NOTIFICATION_TOPIC_ARN not set, skipping notification");
    return;
  }

  try {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);

    await snsClient.send(
      new PublishCommand({
        TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
        Subject: "🚨 EXPENSE APP: Monthly Request Limit Exceeded",
        Message: `
ALERT: Your expense app has exceeded its monthly request limit.

Details:
- Month: ${month}
- Requests: ${count}/100
- Status: API is now DISABLED
- Reset Date: ${nextMonth.toLocaleDateString()}

The API will automatically re-enable on the 1st of next month.

If this usage seems unusual, please investigate for potential abuse:
- Check CloudWatch logs for request patterns
- Review recent form submissions
- Consider implementing additional security measures

This is an automated alert from your expense app monitoring system.
        `,
      })
    );
    console.log("Limit exceeded notification sent successfully");
  } catch (error) {
    console.error("Failed to send limit exceeded notification:", error);
  }
}

async function sendWarningNotification(month: string, count: number) {
  if (!process.env.NOTIFICATION_TOPIC_ARN) {
    console.warn(
      "NOTIFICATION_TOPIC_ARN not set, skipping warning notification"
    );
    return;
  }

  try {
    await snsClient.send(
      new PublishCommand({
        TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
        Subject: "⚠️ EXPENSE APP: 80% Request Limit Reached",
        Message: `
WARNING: Your expense app is approaching its monthly request limit.

Details:
- Month: ${month}
- Requests: ${count}/100 (80% used)
- Remaining: ${100 - count} requests
- Status: API still active

This is a courtesy warning. The API will be automatically disabled if it reaches 100 requests this month.

If this usage seems higher than expected, please monitor for potential abuse.

This is an automated warning from your expense app monitoring system.
        `,
      })
    );
    console.log("Warning notification sent successfully");
  } catch (error) {
    console.error("Failed to send warning notification:", error);
  }
}
