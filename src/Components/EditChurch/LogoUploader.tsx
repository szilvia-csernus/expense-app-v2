import classes from "./Edit.module.css";
import { useAppDispatch, useAppSelector } from "./../../store/index";
import { useState } from "react";
import { EditButton } from "../Buttons";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import "@aws-amplify/ui-react/styles.css";
import { updateChurchData } from "../../store/church-action-creators";
import { remove } from "aws-amplify/storage";

type Props = {
  cancelEditing: () => void;
};

const LogoUploader = ({ cancelEditing }: Props) => {
  const originalChurchLogoPath = useAppSelector((state) => state.church.logo);
  const [currentLogoPath, setCurrentLogoPath] = useState(
    originalChurchLogoPath
  );
  const [fileError, setFileError] = useState<string | boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const dispatch = useAppDispatch();
  const churchPK = useAppSelector((state) => state.church.churchPK);

  const confirmHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentLogoPath) return;
    if (currentLogoPath === originalChurchLogoPath) return;
    if (typeof fileError === "string" && fileError.length > 0) return;

    await updateChurchData(dispatch, churchPK, "logo", currentLogoPath);
    try {
      await remove({
        path: originalChurchLogoPath,
      });
      setFileError(false);
    } catch (error) {
      setFileError(error as string);
    }
    cancelEditing();
  };

  const CancelHandler = async () => {
    if (currentLogoPath !== originalChurchLogoPath) {
      try {
        await remove({
          path: currentLogoPath,
        });
        setCurrentLogoPath(originalChurchLogoPath);
      } catch (error) {
        setFileError(error as string);
      }
    }

    cancelEditing();
  };

  return (
    <>
      <StorageImage
        path={currentLogoPath}
        className={classes.churchLogo}
        alt="church logo"
        style={{ height: "60px", width: "auto" }}
      />
      {!confirming && (
        <>
          <p className={classes.labelText}>
            Please keep the logo file size as small as possible
            <br /> (max 200KB).
          </p>
          <FileUploader
            acceptedFileTypes={["image/*"]}
            path="logos/"
            maxFileCount={1}
            maxFileSize={200 * 1024} // 200 KB
            onUploadStart={() => setSubmitting(true)}
            onUploadError={(error) => {
              setFileError(error);
              setSubmitting(false);
            }}
            onUploadSuccess={(params) => {
              console.log("File uploaded:", params);
              setCurrentLogoPath(params.key!);
              setSubmitting(false);
              setConfirming(true);
            }}
          />
        </>
      )}
      <div
        className={fileError ? classes.feedbackInvalid : classes.feedbackValid}
      >
        {fileError}
      </div>
      <br />
      {currentLogoPath !== originalChurchLogoPath && (
        <EditButton disabled={submitting} onClick={confirmHandler}>
          {submitting ? "Saving..." : "Confirm"}
        </EditButton>
      )}
      <EditButton onClick={CancelHandler} disabled={submitting}>
        Cancel
      </EditButton>
    </>
  );
};

export default LogoUploader;
