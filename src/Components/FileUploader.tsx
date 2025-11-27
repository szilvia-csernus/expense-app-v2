import classes from "./Form.module.css";
import { DeleteButton } from "./Buttons";
import { useAppSelector } from "../store/index";
import { type Dispatch, type SetStateAction, useEffect } from "react";
import {
  MAX_TOTAL_BYTES,
  TARGET_TOTAL_BYTES,
  enforceTargetTotal,
} from "../Utils/fileCompression";

type FileUploader = {
  selectedFile: File | null;
  setSelectedFile: Dispatch<SetStateAction<File | null>>;
  fileError: string | boolean;
  setFileError: Dispatch<SetStateAction<string | boolean>>;
  fileList: File[] | [];
  setFileList: Dispatch<SetStateAction<File[] | []>>;
  totalFileSize: number;
  setTotalFileSize: Dispatch<SetStateAction<number>>;
};

const FileUploader = ({
  setSelectedFile,
  fileError,
  setFileError,
  fileList,
  setFileList,
  totalFileSize,
  setTotalFileSize,
}: FileUploader) => {
  const submitting = useAppSelector((state) => state.form.submitting);
  const receiptsClassNames = `${classes.formInput} 
                                ${fileError && classes.fileInputInvalid} 
                                ${classes.customFileUploadButton}`;

  const removeFileFromList = (file: File) => {
    setFileList((prevList) => prevList.filter((f) => f !== file));
    setTotalFileSize((prevSize) => prevSize - file.size);
  };

  useEffect(() => {
    if (submitting) {
      if (fileList.length === 0) {
        setFileError("Please upload a picture of the receipt.");
      }
    }
  }, [submitting, fileList, setFileError, totalFileSize]);

  const fileUploadIsValid = (file: File) => {
    const fileTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
    ];
    const fileType = file.type;
    if (!fileTypes.includes(fileType)) {
      setFileError("File type not supported");
      setTimeout(() => setFileError(false), 3000);
      return false;
    }
    setFileError(false);
    return true;
  };

  const handleFileInput = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const incomingFiles = event.target.files;
    if (!incomingFiles || incomingFiles.length === 0) {
      return;
    }

    const newFile = incomingFiles[0];
    if (!fileUploadIsValid(newFile)) {
      return;
    }

    const projectedTotal = totalFileSize + newFile.size;
    if (projectedTotal > MAX_TOTAL_BYTES) {
      setFileError("Uploads cannot exceed 6 MB in total.");
      setTimeout(() => setFileError(false), 5000);
      return;
    }

    let updatedFiles = [...fileList, newFile];
    let updatedTotal = projectedTotal;

    if (updatedTotal > TARGET_TOTAL_BYTES) {
      setFileError("Optimizing your receipts to fit under 4.5 MB...");
      const { files, totalSize, success } =
        await enforceTargetTotal(updatedFiles);

      if (!success) {
        setFileError(
          "Unable to reduce file size automatically. Please upload a smaller image."
        );
        setTimeout(() => setFileError(false), 6000);
        return;
      }

      updatedFiles = files;
      updatedTotal = totalSize;
      setTimeout(() => setFileError(false), 2500);
    }

    setSelectedFile(updatedFiles[updatedFiles.length - 1] ?? null);
    setFileList(updatedFiles);
    setTotalFileSize(updatedTotal);
    setFileError(false);
  };

  const handleOnClick = () => {
    setFileError(false);
  };

  const showFileList = (
    <ul>
      {fileList.map((file: File) => {
        return (
          <li
            className={classes.fileListItem}
            key={file.name + "-" + Date.now()}
          >
            <DeleteButton onClick={() => removeFileFromList(file)}>
              X
            </DeleteButton>
            {file.name} -{" "}
            {file.size < 1024 * 1024
              ? `${(file.size / 1024).toFixed(0)} kB`
              : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {showFileList}
      <br />
      <div className={classes.uploadButtonFrame}>
        <label htmlFor="receipts" className={receiptsClassNames}>
          Add Photo
        </label>
      </div>
      <input
        id="receipts"
        type="file"
        name="receipts"
        className={classes.fileInputField}
        accept="image/png, image/jpeg, image/jpg, application/pdf"
        onChange={(event) => {
          void handleFileInput(event);
        }}
        onClick={handleOnClick}
      />
      <div
        className={fileError ? classes.feedbackInvalid : classes.feedbackValid}
      >
        {fileError}
      </div>
    </>
  );
};

export default FileUploader;
