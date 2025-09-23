import classes from "./Edit.module.css";

import React, { useState } from "react";
import useSimpleInput from "../../Hooks/use-simple-input";
import { EditButton } from "../Buttons";
import { useAppSelector, useAppDispatch } from "../../store/index";
import { isEmail, isNotEmpty } from "../../Utils/validations";
import { updateChurchData } from "../../store/church-action-creators";

type props = {
  cancelEditing: () => void;
  fieldname: string;
  fieldLabel: string;
  fieldErrorMessage: string;
  emailInput?: boolean;
};

const TextFieldUpdateForm: React.FC<props> = ({
  cancelEditing,
  fieldname,
  fieldLabel,
  fieldErrorMessage,
  emailInput = false,
}) => {
  const churchPK = useAppSelector((state) => state.church.churchPK);
  const fieldValue = useAppSelector(
    (state) => state.church[fieldname as keyof typeof state.church] as string
  );

  const dispatch = useAppDispatch();

  const [updating, setUpdating] = useState(false);

  const validationFunction = emailInput ? isEmail : isNotEmpty;

  // Form input using useInput hook (reused from CostForm)
  const { value, hasError, inputChangeHandler, reset } = useSimpleInput({
    validateInput: validationFunction,
    initialValue: fieldValue || "",
  });

  // Church data field update
  const updateChurchField = async (event: React.FormEvent) => {
    if (event) event.preventDefault(); // To prevent page reload on form submit

    setUpdating(true);

    await updateChurchData(dispatch, churchPK, fieldname, value);
    setUpdating(false);
    cancelEditing();
  };

  const classNames = `${classes.labelSubText} 
    ${classes.formInput} 
    ${hasError ? classes.formInputInvalid : ""}`;

  return (
    <div className={classes.form}>
      <form onSubmit={updateChurchField}>
        <label htmlFor={fieldname} className={classes.labelText}>
          {fieldLabel}
        </label>
        <input
          id={fieldname}
          type="text"
          name={fieldname}
          className={classNames}
          onChange={inputChangeHandler}
          value={value}
          maxLength={100}
          autoFocus
        />

        <div
          className={hasError ? classes.feedbackInvalid : classes.feedbackValid}
        >
          {fieldErrorMessage}
        </div>

        <EditButton type="submit" disabled={updating}>
          {updating ? "Saving..." : "OK"}
        </EditButton>
        <EditButton
          onClick={() => {
            reset();
            cancelEditing();
          }}
          disabled={updating}
        >
          Cancel
        </EditButton>
      </form>
    </div>
  );
};

export default TextFieldUpdateForm;
