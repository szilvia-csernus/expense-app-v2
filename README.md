# Expense App

This project is a serverless, `AWS Amplify` application, using the following services: `AWS Amplify Gen2, AppSync, DynamoDB, Lambda, API Gateway, Cognito, S3, and more`.

This app is an improved version of the earlier Django + React application created for Redeemer International Church Rotterdam. After evaluating the frequency of use and the running costs, it was decided to rebuild the application using modern, serverless technologies to improve performance while also reducing costs. The earlier version can be found [following this link](https://github.com/szilvia-csernus/expense-app).

---

## Motivation

The Redeemer Churches are a network of International Christian Churches in the Netherlands. The Rotterdam Church's finance team required a custom web application in order to improve their everyday work.

Church members frequently pay for goods and services for the church's benefit which they can later submit to the church for reimbursement. This process usually involves administration from both members and admins, relating to the collection, submission and storage of documents in appropriate file formats. Easing this process would lessen the burden of both parties which subsequently would strengthen engagement.

The original solution to this submission process was a WordPress website, which allowed users to upload the receipts alongside their details into a form to be sent to the finance team via email. While this solution helped the end users, the finance team still had substantial work with converting and assembling the incoming image files and documents, many times in different file formats into one pdf document. It was desirable to streamline this process further to enhance efficiency and reduce manual workload.

---

## Functionality

This app allows the end-users to submit their expense forms with attached receipts in various image or pdf formats. The incoming forms and the images are processed and converted into one multi-page pdf document, and sent to the finance contact's email.

Admins can edit the church's details, including the logo, finance team's contacts and other relevant information via a secure admin interface. The admin interface is secured via AWS Cognito user authentication.

When a user submits an expense form, they receive a feedback about the successful submission both on the screen and also via email for later reference. Simultaniously, the admin team receives two emails: one containing the compiled pdf document, ready for the finance team to process, and one ready-written email which, upon approval of the expense claim, can be sent back to the end-user.

The app is a `Progressive Web App (PWA)`, meaning it is installable on any desktop or mobile devices. Caching is also utilised to allow reduced loading times on subsequent usage as well as for offline access.

As per the requirement of the Rotterdam Finance Team, the app does not retain any end-user or expense data. The database only stores the required church data for the purpose of creating the form and sending the generated documents.

---

## Technologies used

- AWS Amplify Gen2
- AWS AppSync
- AWS Lambda
- AWS API Gateway
- AWS Cognito
- AWS S3
- AWS DynamoDB
- Other AWS services, such as IAM, ClouWatch, System Manager Parameter Store etc.
- ReactJS
- Vite
- CSS Modules
- React Router
- Gmail API
- Cypress (for end-to-end testing)
- Git & GitHub
- HTML5 & CSS3
- TypeScript

---

## Feedback and contact

Any feedback or inquiries, please reach out!

Send your message to [this email](mailto:benches.dory_0b@icloud.com)!

Thank you!
