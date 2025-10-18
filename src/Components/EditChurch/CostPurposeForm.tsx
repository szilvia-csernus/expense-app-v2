import classes from "./Edit.module.css";

import React, { useState } from "react";
import useSimpleInput from "../../Hooks/use-simple-input";
import { EditButton } from "../Buttons";
import { useAppSelector, useAppDispatch } from "../../store/index";
import { isNotEmpty, noValidate } from "../../Utils/validations";
import {
  addCostPurpose,
  updateCostPurpose,
} from "../../store/church-action-creators";

type props = {
  cancelEditing: () => void;
  newRecord: boolean;
  costPurposeSK?: `COSTPURPOSE#${string}`;
};

const CostPurposeForm: React.FC<props> = ({
  cancelEditing,
  newRecord,
  costPurposeSK,
}) => {
  const churchPK = useAppSelector((state) => state.church.churchPK);
  const costPurpose = useAppSelector((state) =>
    state.church.costPurposes.find((item) => item.SK === costPurposeSK)
  );
  const initialCostPurposeName = costPurpose?.costPurposeName;
  const initialCostCode =
    costPurpose && costPurpose.costCode && costPurpose.costCode > 0
      ? costPurpose.costCode.toString() || ""
      : "";

  const greatestSK =
    useAppSelector((state) => state.church.greatestCostPurposeSKNumber) ?? 0;

  const {
    value: purposeNameValue,
    hasError: purposeNameHasError,
    inputChangeHandler: purposeNameChangeHandler,
    reset: purposeNameReset,
  } = useSimpleInput({
    validateInput: isNotEmpty,
    initialValue: initialCostPurposeName,
  });

  const {
    value: costCodeValue,
    hasError: costCodeHasError,
    inputChangeHandler: costCodeChangeHandler,
    reset: costCodeReset,
  } = useSimpleInput({
    validateInput: noValidate,
    initialValue: initialCostCode,
  });

  const dispatch = useAppDispatch();

  const [updating, setUpdating] = useState(false);

  // Cost purpose update
  const updateCostPurposeHandler = async (event: React.FormEvent) => {
    if (event) event.preventDefault(); // To prevent page reload on form submit

    setUpdating(true);

    const costCode =
      costCodeValue && costCodeValue !== "0" ? +costCodeValue : undefined;

    if (
      initialCostCode === costCodeValue &&
      initialCostPurposeName === purposeNameValue
    ) {
      // No changes made
      setUpdating(false);
      cancelEditing();
      return;
    }

    await updateCostPurpose(
      dispatch,
      churchPK,
      costPurposeSK!,
      purposeNameValue,
      costCode
    );

    setUpdating(false);
    cancelEditing();
  };

  const newCostPurposeHandler = async (event: React.FormEvent) => {
    if (event) event.preventDefault(); // To prevent page reload on form submit

    if (greatestSK === null) return;
    setUpdating(true);

    const costCode =
      costCodeValue && costCodeValue !== "0" ? +costCodeValue : undefined;

    await addCostPurpose(
      dispatch,
      churchPK,
      greatestSK,
      purposeNameValue,
      costCode
    );

    setUpdating(false);
    cancelEditing();
  };

  const purposeClassNames = `${classes.purposeName} 
    ${classes.formInput} 
    ${purposeNameHasError ? classes.formInputInvalid : ""}`;

  const costCodeClassNames = `${classes.labelSubText} 
    ${classes.formInput} 
    ${costCodeHasError ? classes.formInputInvalid : ""}`;

  return (
    <div className={classes.form}>
      <form
        onSubmit={newRecord ? newCostPurposeHandler : updateCostPurposeHandler}
        className={classes.costPurposeForm}
      >
        <div>
          <label htmlFor="costPurposeName" className={classes.labelText}>
            Cost Purpose Name
          </label>
          <input
            id="costPurposeName"
            type="text"
            name="costPurposeName"
            className={purposeClassNames}
            onChange={purposeNameChangeHandler}
            value={purposeNameValue}
            maxLength={100}
            autoFocus
          />

          <div
            className={
              purposeNameHasError
                ? classes.feedbackInvalid
                : classes.feedbackValid
            }
          >
            {purposeNameHasError && "Please enter a valid cost purpose name."}
          </div>
        </div>

        <div>
          <label htmlFor="costCode" className={classes.labelText}>
            Cost Code
          </label>
          <input
            id="costCode"
            type="text"
            name="costCode"
            className={costCodeClassNames}
            onChange={costCodeChangeHandler}
            value={costCodeValue}
            maxLength={100}
          />
        </div>

        <div>
          <EditButton type="submit" disabled={updating}>
            {updating ? "Saving..." : "OK"}
          </EditButton>
          <EditButton
            onClick={() => {
              purposeNameReset();
              costCodeReset();
              cancelEditing();
            }}
            disabled={updating}
          >
            Cancel
          </EditButton>
        </div>
      </form>
    </div>
  );
};

export default CostPurposeForm;
