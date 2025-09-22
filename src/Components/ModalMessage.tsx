import classes from "./Form.module.css";
import { SecondaryButton } from "./Buttons";
import { useAppDispatch, useAppSelector } from "../store/index";
import Modal from "./Modal";
import { modalMessageActions } from "../store/modal-message-slice";

const ModalMessage = () => {
  const dispatch = useAppDispatch();
  const title = useAppSelector((state) => state.modalMessage.title);
  const message = useAppSelector((state) => state.modalMessage.message);
  const clickHandler = () => {
    dispatch(modalMessageActions.close());
  };
  return (
    <Modal>
      <div className={classes.messageContent}>
        <h2>{title}</h2>
        <p>{message}</p>
        <br />
        <br />
        <SecondaryButton onClick={clickHandler}>OK</SecondaryButton>
      </div>
    </Modal>
  );
};

export default ModalMessage;
