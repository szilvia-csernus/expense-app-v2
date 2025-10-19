import { defineAuth } from "@aws-amplify/backend";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "Expense App Admin - Verify your email",
      verificationEmailBody: (createCode) =>
        `<div>
          <div style="font-size: 1.5em; font-weight: bold;">
            Verify your email address for Expense App Admin
          </div>
          <br><br><br>
          Here is the code to confirm your account:
          <div style="font-size: 1.5em; color: #a647f9ff;">${createCode()}</div>
          </div>`,
      userInvitation: {
        emailSubject: "Expense App Admin - Complete your registration",
        emailBody: (user, code) =>
          `<div>
        <div style="font-size: 1.5em; font-weight: bold;">
            Complete your registration for Expense App Admin
          </div>
          <br><br><br>
          You can now log in with your email ${user()} and temporary password:
          <br><br>
          <div style="font-size: 1.5em; color: #a647f9ff;">${code()}</div>
          <br><br><br>
          You will be prompted to change your password after logging in.
          <br><br>
          Please note, this temporary password will expire in 7 days.
          </div>`,
      },
    },
  },
});
