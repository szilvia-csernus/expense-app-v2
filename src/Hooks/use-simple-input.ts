import { useState } from "react";
import type { ValidateInput } from "../Utils/validations";

type UseInput = {
  validateInput: ValidateInput;
  initialValue?: string;
};

const useSimpleInput = ({ validateInput, initialValue = "" }: UseInput) => {
  const [enteredValue, setEnteredValue] = useState(initialValue);
  const [hasError, setHasError] = useState(false);

  const inputChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEnteredValue(event.target.value);
    if (!validateInput(event.target.value)) {
      setHasError(true);
    } else {
      setHasError(false);
    }
  };

  const reset = () => {
    setEnteredValue(initialValue);
    setHasError(false);
  };

  return {
    value: enteredValue,
    hasError,
    inputChangeHandler,
    reset,
  };
};

export default useSimpleInput;
