import classes from "./Buttons.module.css";

type ButtonProps = {
  type?: "button" | "submit" | "reset";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

export const GeneralButton = (props: ButtonProps) => {
  const classNames = `${classes.button} ${props.className}`;
  return (
    <button
      type={props.type || "button"}
      className={classNames}
      disabled={props.disabled || false}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

export const PrimaryButton = (props: ButtonProps) => {
  return (
    <GeneralButton
      type={props.type || "button"}
      className={classes.primaryButton}
      onClick={props.onClick}
      disabled={props.disabled || false}
    >
      {props.children}
    </GeneralButton>
  );
};

export const SecondaryButton = (props: ButtonProps) => {
  return (
    <GeneralButton
      type="button"
      className={classes.secondaryButton}
      onClick={props.onClick}
    >
      {props.children}
    </GeneralButton>
  );
};

export const DeleteButton = (props: ButtonProps) => {
  return (
    <GeneralButton
      type="button"
      className={classes.deleteButton}
      onClick={props.onClick}
      disabled={props.disabled || false}
    >
      {props.children}
    </GeneralButton>
  );
};

export const EditButton = (props: ButtonProps) => {
  return (
    <GeneralButton
      type={props.type || "button"}
      className={classes.editButton}
      onClick={props.onClick}
      disabled={props.disabled || false}
    >
      {props.children}
    </GeneralButton>
  );
};

export const EditIconButton = (props: ButtonProps) => {
  return (
    <GeneralButton
      type={props.type || "button"}
      className={`${classes.editButton} ${classes.editIconButton}`}
      onClick={props.onClick}
      disabled={props.disabled || false}
    >
      {props.children}
    </GeneralButton>
  );
};
