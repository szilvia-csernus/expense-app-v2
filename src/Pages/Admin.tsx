import Footer from "../Components/Footer";
import { Container } from "../Components/Container";
import PageLoader from "../Components/PageLoader";
import { useAppSelector } from "../store";
import { EditButton } from "../Components/Buttons";

import { Authenticator, Heading } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "../index.css";
import "./amplify.css";
import classes from "./Admin.module.css";
import EditChurch from "../Components/EditChurch/EditChurch";
import ModalMessage from "../Components/ModalMessage";
import { Link } from "react-router-dom";

const components = {
  SignIn: {
    Header() {
      return <Heading>Sign in to your account</Heading>;
    },
  },

  ConfirmSignIn: {
    Header() {
      return <Heading>Confirm Sign In</Heading>;
    },
  },
  ForgotPassword: {
    Header() {
      return <Heading>Reset Your Password</Heading>;
    },
  },
  ConfirmResetPassword: {
    Header() {
      return <Heading>Confirm New Password</Heading>;
    },
  },
};

const formFields = {
  signIn: {
    username: {
      placeholder: "Enter your email",
    },
  },
  forceNewPassword: {
    password: {
      placeholder: "Your Password:",
    },
  },
  forgotPassword: {
    username: {
      placeholder: "Your email:",
    },
  },
  confirmResetPassword: {
    confirmation_code: {
      placeholder: "Confirmation Code:",
      label: "New Label",
      isRequired: false,
    },
    confirm_password: {
      placeholder: "Confirm Password:",
    },
  },
  confirmSignIn: {
    confirmation_code: {
      label: "New Label",
      placeholder: "Enter your Confirmation Code:",
      isRequired: false,
    },
  },
};

function Admin() {
  const modalMessage = useAppSelector((state) => state.modalMessage.status);
  const sending = useAppSelector((state) => state.form.sending);
  return (
    <Container>
      {sending && <PageLoader />}
      {modalMessage && <ModalMessage />}
      <main className={classes.content}>
        <Authenticator
          className={classes.authenticator}
          hideSignUp
          formFields={formFields}
          components={components}
        >
          {({ signOut }) => (
            <div>
              <EditChurch />
              <div>
                <EditButton onClick={signOut}>Sign out</EditButton>
              </div>
            </div>
          )}
        </Authenticator>
      </main>
      <Footer>
        <Link to="/" className={classes.adminLogin}>
          Home
        </Link>
      </Footer>
    </Container>
  );
}

export default Admin;
