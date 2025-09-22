import ReactDOM from "react-dom";
import { modalMessageActions } from "../store/modal-message-slice";
import { useAppDispatch, useAppSelector } from "../store/index";

import classes from "./Modal.module.css";

type ModalProps = {
  children?: React.ReactNode;
};

const Backdrop = () => {
  const modalMessage = useAppSelector((state) => state.modalMessage);
  const dispatch = useAppDispatch();

  const clickHandler = () => {
    if (modalMessage) dispatch(modalMessageActions.close());
  };

  return <div className={classes.backdrop} onClick={clickHandler} />;
};

const Overlay = (props: ModalProps) => {
  return <div className={classes.overlay}>{props.children}</div>;
};

const Canvas = (props: ModalProps) => {
  return <div className={classes.canvas}>{props.children}</div>;
};

const Modal = (props: ModalProps) => {
  const portalElement = document.getElementById("overlay")!;
  return (
    <>
      {ReactDOM.createPortal(<Backdrop />, portalElement)}
      {ReactDOM.createPortal(
        <Overlay>
          <Canvas>{props.children}</Canvas>
        </Overlay>,
        portalElement
      )}
    </>
  );
};

export default Modal;
