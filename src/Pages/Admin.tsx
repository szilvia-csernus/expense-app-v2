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
      return <Heading>Password Reset</Heading>;
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
      placeholder: "Your Password",
    },
  },
  forgotPassword: {
    username: {
      label: "Enter your email to reset your password",
      placeholder: "Your email",
    },
  },
  confirmResetPassword: {
    confirmation_code: {
      label: "Enter Code sent to your Email",
      placeholder: "Enter Code",
      isRequired: false,
    },
    confirm_password: {
      placeholder: "Confirm Password",
    },
  },
  confirmSignIn: {
    confirmation_code: {
      label: "Enter Code sent to your Email",
      placeholder: "Enter Code",
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
