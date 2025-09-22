export type ValidateInput = (arg: string) => boolean;

// Validation functions (reused from CostForm)
export const isNotEmpty: ValidateInput = (value) => value.trim() !== "";

// Validation functions (reused from CostForm)
export const isEmail: ValidateInput = (value) =>
  /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(value);

// A validation function that always returns true (no validation)
export const noValidate = () => true;
