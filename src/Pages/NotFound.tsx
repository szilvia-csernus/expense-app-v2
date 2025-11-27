import { Container } from "../Components/Container";
import classes from "./Admin.module.css";
import Modal from "../Components/Modal";
import { SecondaryButton } from "../Components/Buttons";
import { Link } from "react-router-dom";

function NotFound() {
  const clickHandler = () => {
    window.location.reload();
  };

  return (
    <Container>
      <Modal>
        <div className={classes.messageContent}>
          <h2>NOT FOUND</h2>
          <p>The page you are looking for does not exist.</p>
          <br />
          <br />
          <SecondaryButton onClick={clickHandler}>
            <Link to="/">Home</Link>
          </SecondaryButton>
        </div>
      </Modal>
    </Container>
  );
}

export default NotFound;
