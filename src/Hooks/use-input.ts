import { useState } from "react";

export type ValidateInput = (arg: string) => boolean;

type UseInput = {
  validateInput: ValidateInput;
  initialValue?: string;
};

const useInput = ({ validateInput, initialValue = "" }: UseInput) => {
  const [enteredValue, setEnteredValue] = useState(initialValue);
  const [isTouched, setIsTouched] = useState(false);

  const valueIsValid = validateInput(enteredValue);
  const hasError = valueIsValid === false && isTouched;

  const inputChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEnteredValue(event.target.value);
  };

  const inputBlurHandler = () => {
    setIsTouched(true);
  };

  const reset = () => {
    setEnteredValue("");
    setIsTouched(false);
  };

  return {
    value: enteredValue,
    isValid: valueIsValid,
    hasError,
    inputChangeHandler,
    inputBlurHandler,
    reset,
  };
};

export default useInput;
