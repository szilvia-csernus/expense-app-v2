import classes from "./Form.module.css";

import { useState, useEffect, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import useInput from "../Hooks/use-input";
import { PrimaryButton } from "./Buttons";
import FileUploader from "./FileUploader";
import { noNetworkError, send } from "../store/form-action-creators";
import { useAppSelector } from "../store/index";
import { formActions } from "../store/form-slice";
import ChurchLogo from "./ChurchLogo";
import { useAppDispatch } from "../store/index";
import { isNotEmpty, isEmail, noValidate } from "../Utils/validations";
import PageLoader from "./PageLoader";

const CostForm = () => {
  const [formValid, setFormValid] = useState(false);
  // file uploads are not allowed to be stored in redux store
  // https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
  // however, the solution above did not work for me hence I'm using useState here
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | boolean>(false);
  const [fileList, setFileList] = useState<File[] | []>([]);
  const [totalFileSize, setTotalFileSize] = useState<number>(0);

  const purposes = useAppSelector((state) => state.church.costPurposes);
  const churchName = useAppSelector((state) => state.church.churchShortName);
  const churchPK = useAppSelector((state) => state.church.churchPK);
  const fetchingInProcess = useAppSelector(
    (state) => state.church.fetchingDetailsInProcess
  );
  const submitting = useAppSelector((state) => state.form.submitting);

  const dispatch = useAppDispatch();

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLInputElement | null>(null);
  const purposeSelectRef = useRef<HTMLSelectElement | null>(null);
  const totalInputRef = useRef<HTMLInputElement | null>(null);
  const ibanInputRef = useRef<HTMLInputElement | null>(null);
  const accountNameInputRef = useRef<HTMLInputElement | null>(null);
  const fileSectionRef = useRef<HTMLDivElement | null>(null);

  // Cloudflare Turnstile: invisible challenge executed on submit.
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const tokenResolverRef = useRef<{
    resolve: (token: string) => void;
    reject: (reason?: unknown) => void;
  } | null>(null);

  // Returns a promise that resolves with a fresh Turnstile token, or rejects
  // if the challenge errors or expires. Called by send() after local checks.
  const getTurnstileToken = (): Promise<string> =>
    new Promise((resolve, reject) => {
      // In Cypress E2E runs, bypass the external Turnstile challenge so tests
      // stay deterministic and don't depend on Cloudflare being reachable.
      if (typeof window !== "undefined" && "Cypress" in window) {
        resolve("cypress-e2e-token");
        return;
      }
      tokenResolverRef.current = { resolve, reject };
      turnstileRef.current?.reset();
      turnstileRef.current?.execute();
    });

  const {
    value: nameValue,
    isValid: nameIsValid,
    hasError: nameHasError,
    inputChangeHandler: nameChangeHandler,
    inputBlurHandler: nameBlurHandler,
    reset: nameReset,
  } = useInput({ validateInput: isNotEmpty });

  const {
    value: emailValue,
    isValid: emailIsValid,
    hasError: emailHasError,
    inputChangeHandler: emailChangeHandler,
    inputBlurHandler: emailBlurHandler,
    reset: emailReset,
  } = useInput({ validateInput: isEmail });

  const {
    value: dateValue,
    isValid: dateIsValid,
    hasError: dateHasError,
    inputChangeHandler: dateChangeHandler,
    inputBlurHandler: dateBlurHandler,
    reset: dateReset,
  } = useInput({ validateInput: isNotEmpty });

  const {
    value: descriptionValue,
    isValid: descriptionIsValid,
    hasError: descriptionHasError,
    inputChangeHandler: descriptionChangeHandler,
    inputBlurHandler: descriptionBlurHandler,
    reset: descriptionReset,
  } = useInput({ validateInput: isNotEmpty });

  const {
    value: purposeValue,
    isValid: purposeIsValid,
    hasError: purposeHasError,
    inputChangeHandler: purposeChangeHandler,
    inputBlurHandler: purposeBlurHandler,
    reset: purposeReset,
  } = useInput({ validateInput: isNotEmpty });

  const {
    value: totalValue,
    isValid: totalIsValid,
    hasError: totalHasError,
    inputChangeHandler: totalChangeHandler,
    inputBlurHandler: totalBlurHandler,
    reset: totalReset,
  } = useInput({ validateInput: isNotEmpty });

  const {
    value: ibanValue,
    isValid: ibanIsValid,
    hasError: ibanHasError,
    inputChangeHandler: ibanChangeHandler,
    inputBlurHandler: ibanBlurHandler,
    reset: ibanReset,
  } = useInput({ validateInput: noValidate });

  const {
    value: accountNameValue,
    isValid: accountNameIsValid,
    hasError: accountNameHasError,
    inputChangeHandler: accountNameChangeHandler,
    inputBlurHandler: accountNameBlurHandler,
    reset: accountNameReset,
  } = useInput({ validateInput: noValidate });

  useEffect(() => {
    if (
      nameIsValid &&
      emailIsValid &&
      dateIsValid &&
      descriptionIsValid &&
      purposeIsValid &&
      totalIsValid &&
      fileList.length > 0 &&
      !fileError &&
      ibanIsValid &&
      accountNameIsValid
    ) {
      setFormValid(true);
    }
    return () => setFormValid(false);
  }, [
    nameIsValid,
    emailIsValid,
    dateIsValid,
    descriptionIsValid,
    purposeIsValid,
    totalIsValid,
    fileList,
    fileError,
    ibanIsValid,
    accountNameIsValid,
  ]);

  const scrollToFirstInvalidInput = () => {
    const fieldOrder = [
      { isValid: nameIsValid, ref: nameInputRef },
      { isValid: emailIsValid, ref: emailInputRef },
      { isValid: purposeIsValid, ref: purposeSelectRef },
      { isValid: dateIsValid, ref: dateInputRef },
      { isValid: descriptionIsValid, ref: descriptionInputRef },
      { isValid: totalIsValid, ref: totalInputRef },
      { isValid: fileList.length > 0 && !fileError, ref: fileSectionRef },
      { isValid: ibanIsValid, ref: ibanInputRef },
      { isValid: accountNameIsValid, ref: accountNameInputRef },
    ];

    const firstInvalidField = fieldOrder.find((field) => !field.isValid);

    const target = firstInvalidField?.ref.current;

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      if ("focus" in target && typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    }
  };

  const submitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(formActions.setSubmitting());

    if (!formValid) {
      nameBlurHandler();
      emailBlurHandler();
      dateBlurHandler();
      descriptionBlurHandler();
      purposeBlurHandler();
      totalBlurHandler();
      ibanBlurHandler();
      accountNameBlurHandler();
      scrollToFirstInvalidInput();
      requestAnimationFrame(() => {
        scrollToFirstInvalidInput();
        dispatch(formActions.resetSubmitting());
      });
      return;
    } else {
      const formData = new FormData();

      formData.set("church", churchName);
      formData.set("name", nameValue);
      formData.set("email", emailValue);
      formData.set("date", dateValue);
      formData.set("description", descriptionValue);
      formData.set("purpose", purposeValue);
      formData.set("total", totalValue);
      for (let i = 0; i < fileList.length; i++) {
        formData.set(`receipt${i}`, fileList[i]);
      }
      formData.set("iban", ibanValue);
      formData.set("accountName", accountNameValue);

      const resetForm = () => {
        nameReset();
        emailReset();
        dateReset();
        descriptionReset();
        purposeReset();
        totalReset();
        setSelectedFile(null);
        setFileList([]);
        setFileError(false);
        setTotalFileSize(0);
        ibanReset();
        accountNameReset();
      };

      const resetFileUploader = () => {
        setSelectedFile(null);
        setFileList([]);
        setFileError(false);
        setTotalFileSize(0);
      };

      // We check if the user is using an IOS device. We need to check this
      // as the backgroundSync is inconsistent on IOS and as such we
      // don't want to send the form if the user is offline.
      // This piece of code can be changed once backgroundSync is fully suppported on
      // these devices.
      const isIOS = /iPad|iPhone/.test(navigator.userAgent);
      if (isIOS && !navigator.onLine) {
        noNetworkError(dispatch);
      } else {
        send(
          dispatch,
          formData,
          churchPK,
          resetForm,
          resetFileUploader,
          getTurnstileToken
        );
      }

      dispatch(formActions.resetSubmitting());
    }
  };

  const nameClassNames = `${classes.formInput} ${
    nameHasError && classes.formInputInvalid
  }`;
  const emailClassNames = `${classes.formInput} ${
    emailHasError && classes.formInputInvalid
  }`;
  const dateClassNames = `${classes.formInput} ${
    dateHasError && classes.formInputInvalid
  }`;
  const descriptionClassNames = `${classes.formInput} ${
    descriptionHasError && classes.formInputInvalid
  }`;
  const purposeClassNames = `${classes.formInput} ${
    purposeHasError && classes.formInputInvalid
  }`;
  const totalClassNames = `${classes.formInput} ${
    totalHasError && classes.formInputInvalid
  }`;
  const ibanClassNames = `${classes.formInput} ${
    ibanHasError && classes.formInputInvalid
  }`;
  const accountNameClassNames = `${classes.formInput} ${
    accountNameHasError && classes.formInputInvalid
  }`;

  return (
    <div className={classes.content}>
      {fetchingInProcess && <PageLoader />}

      <>
        <ChurchLogo />
        <h1 className={classes.header}>Expense Form</h1>
        <br />
        <div className={classes.formBody}>
          <form className={classes.form} onSubmit={submitHandler}>
            {/* PERSONAL INFORMATION */}
            <fieldset>
              <h2>Personal Information</h2>

              {/* Name  */}
              <label htmlFor="name" className={classes.labelText}>
                Name *
              </label>
              <p className={classes.labelSubText}>
                Please give your name here in case we need to contact you.
              </p>
              <input
                id="name"
                type="text"
                name="name"
                className={nameClassNames}
                onChange={nameChangeHandler}
                onBlur={nameBlurHandler}
                value={nameValue}
                autoComplete="name"
                maxLength={200}
                ref={nameInputRef}
              />
              <div
                className={
                  nameHasError ? classes.feedbackInvalid : classes.feedbackValid
                }
              >
                Please provide your name.
              </div>

              {/* Email  */}
              <label htmlFor="email" className={classes.labelText}>
                Email address *
              </label>
              <p className={classes.labelSubText}>
                Your email address where we can reach you.
              </p>
              <input
                id="email"
                type="email"
                name="email"
                className={emailClassNames}
                onChange={emailChangeHandler}
                onBlur={emailBlurHandler}
                value={emailValue}
                autoComplete="email"
                maxLength={100}
                ref={emailInputRef}
              />
              <div
                className={
                  emailHasError
                    ? classes.feedbackInvalid
                    : classes.feedbackValid
                }
              >
                Please provide your email address.
              </div>
            </fieldset>

            {/* EXPENSES */}
            <fieldset>
              <h2>Expenses</h2>
              <label htmlFor="purpose" className={classes.labelText}>
                Purpose *
              </label>
              <p className={classes.labelSubText}>
                Please select a purpose for the expense.
              </p>
              <select
                id="purpose"
                name="purpose"
                className={purposeClassNames}
                onChange={purposeChangeHandler}
                onBlur={purposeBlurHandler}
                value={purposeValue}
                ref={purposeSelectRef}
              >
                <option value="" disabled>
                  Select a purpose
                </option>
                {purposes.map((purpose) =>
                  purpose.costCode ? (
                    <option
                      key={`${purpose.costPurposeName} ${purpose.costCode}`}
                      value={`${purpose.costPurposeName} (${purpose.costCode})`}
                    >
                      {`${purpose.costPurposeName} (${purpose.costCode})`}
                    </option>
                  ) : (
                    <option
                      key={purpose.costPurposeName}
                      value={purpose.costPurposeName}
                    >
                      {purpose.costPurposeName}
                    </option>
                  )
                )}
              </select>

              <div
                className={
                  purposeHasError
                    ? classes.feedbackInvalid
                    : classes.feedbackValid
                }
              >
                Please select a purpose.
              </div>

              {/* Date  */}
              <label htmlFor="date" className={classes.labelText}>
                Date of expense (on receipt) *
              </label>
              <p className={classes.labelSubText}>
                If you have many receipts, then use the date from the latest. If
                they relate to multiple years, then it is best to group them by
                years into separate submissions to help our bookkeeping.
              </p>
              <input
                id="date"
                type="date"
                name="date"
                className={dateClassNames}
                onChange={dateChangeHandler}
                onBlur={dateBlurHandler}
                value={dateValue}
                ref={dateInputRef}
              />
              <div
                className={
                  dateHasError ? classes.feedbackInvalid : classes.feedbackValid
                }
              >
                Please select a date.
              </div>

              {/* Description  */}
              <label htmlFor="description" className={classes.labelText}>
                Description *
              </label>
              <p className={classes.labelSubText}>
                Short description for the expense.
              </p>
              <input
                id="description"
                type="text"
                name="description"
                className={descriptionClassNames}
                onChange={descriptionChangeHandler}
                onBlur={descriptionBlurHandler}
                value={descriptionValue}
                maxLength={200}
                ref={descriptionInputRef}
              />
              <div
                className={
                  descriptionHasError
                    ? classes.feedbackInvalid
                    : classes.feedbackValid
                }
              >
                Please provide a short description.
              </div>

              {/* Total  */}
              <label htmlFor="total" className={classes.labelText}>
                Total *
              </label>
              <p className={classes.labelSubText}>
                The total amount in EUR to be reimbursed.
              </p>
              <input
                id="total"
                type="total"
                name="total"
                className={totalClassNames}
                onChange={totalChangeHandler}
                onBlur={totalBlurHandler}
                value={totalValue}
                maxLength={10}
                ref={totalInputRef}
              />
              <div
                className={
                  totalHasError
                    ? classes.feedbackInvalid
                    : classes.feedbackValid
                }
              >
                Invalid amount.
              </div>

              {/* Receipts  */}
              <span className={classes.labelText}>Receipt(s) *</span>
              <p className={classes.labelSubText}>
                Please take/upload a clear picture or PDF of the receipt of the
                expense made. Accepted file types: PNG, JPG, JPEG, PDF. Max
                upload size is 6MB. Automatic compression happens beyond total
                size of 4.5MB.
              </p>

              <div ref={fileSectionRef}>
                <FileUploader
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                  fileError={fileError}
                  setFileError={setFileError}
                  fileList={fileList}
                  setFileList={setFileList}
                  totalFileSize={totalFileSize}
                  setTotalFileSize={setTotalFileSize}
                />
              </div>
            </fieldset>

            {/* REIMBURSEMENT DETAILS  */}
            <fieldset>
              <h2>Reimbursement Details (optional)</h2>
              {/* Bank Account  */}
              <label htmlFor="iban" className={classes.labelText}>
                Bank Account Number (IBAN)
              </label>
              <p className={classes.labelSubText}>
                If you are not a regular donor of our church, then please give
                us an IBAN where we can send you the reimbursement.
              </p>
              <input
                id="iban"
                type="text"
                name="iban"
                className={ibanClassNames}
                onChange={ibanChangeHandler}
                onBlur={ibanBlurHandler}
                value={ibanValue}
                autoComplete="on"
                maxLength={34}
                ref={ibanInputRef}
              />
              <div
                className={
                  ibanHasError ? classes.feedbackInvalid : classes.feedbackValid
                }
              >
                Please provide your bank account number.
              </div>

              {/* Name of Bank Account Holder  */}
              <label htmlFor="accountName" className={classes.labelText}>
                Name of Bank Account Holder
              </label>
              <p className={classes.labelSubText}>
                Please enter the name of the account holder if it is different
                from the name entered at the top of this form.
              </p>
              <input
                id="accountName"
                type="accountName"
                name="accountName"
                className={accountNameClassNames}
                onChange={accountNameChangeHandler}
                onBlur={accountNameBlurHandler}
                value={accountNameValue}
                maxLength={200}
                ref={accountNameInputRef}
              />
              <div
                className={
                  accountNameHasError
                    ? classes.feedbackInvalid
                    : classes.feedbackValid
                }
              >
                Invalid name.
              </div>
            </fieldset>

            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              options={{ execution: "execute", size: "invisible" }}
              onSuccess={(token) => {
                tokenResolverRef.current?.resolve(token);
                tokenResolverRef.current = null;
              }}
              onError={() => {
                tokenResolverRef.current?.reject(
                  new Error("turnstile-error")
                );
                tokenResolverRef.current = null;
              }}
              onExpire={() => {
                tokenResolverRef.current?.reject(
                  new Error("turnstile-expired")
                );
                tokenResolverRef.current = null;
              }}
            />

            <br />
            <div className={classes.footer}>
              <PrimaryButton type="submit" disabled={submitting}>
                Submit
              </PrimaryButton>
            </div>
          </form>
        </div>
      </>
    </div>
  );
};

export default CostForm;
