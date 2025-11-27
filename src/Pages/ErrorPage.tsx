import { Container } from "../Components/Container";
import classes from "./Admin.module.css";
import Modal from "../Components/Modal";
import { SecondaryButton } from "../Components/Buttons";

function ErrorPage() {
  const clickHandler = () => {
    window.location.reload();
  };

  return (
    <Container>
      <Modal>
        <div className={classes.messageContent}>
          <h2>ERROR</h2>
          <p>
            An unexpected error has occurred. If the issue persists, please
            contact the site administrator.
          </p>
          <br />
          <br />
          <SecondaryButton onClick={clickHandler}>Refresh Page</SecondaryButton>
        </div>
      </Modal>
    </Container>
  );
}

export default ErrorPage;
