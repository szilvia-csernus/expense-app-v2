import classes from "./Edit.module.css";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../store/index";
import Loader from "../Loader";
import {
  deleteCostPurpose,
  getChurchDetailsForAdmin,
} from "../../store/church-action-creators";
import { EditButton, EditIconButton } from "../Buttons";
import LogoUploader from "./LogoUploader";
import ChurchLogo from "../ChurchLogo";
import TextFieldUpdateForm from "./TextFieldUpdateForm";
import CostPurposeForm from "./CostPurposeForm";

// Editing states for better type safety
export type EditingField =
  | "none"
  | "churchShortName"
  | "churchLongName"
  | "financeContactName"
  | "financeEmail"
  | "logo"
  | `COSTPURPOSE#${string}` // For cost purposes, using SK as identifier
  | "newCostPurpose";

const EditChurch = () => {
  const churchPK = useAppSelector((state) => state.church.churchPK);
  const churchShortName = useAppSelector(
    (state) => state.church.churchShortName
  );
  const churchLongName = useAppSelector((state) => state.church.churchLongName);
  const financeContactName = useAppSelector(
    (state) => state.church.financeContactName
  );
  const financeEmail = useAppSelector((state) => state.church.financeEmail);
  const costPurposes = useAppSelector((state) => state.church.costPurposes);
  const fetchingInProcess = useAppSelector(
    (state) => state.church.fetchingDetailsInProcess
  );

  const dispatch = useAppDispatch();

  // State for which field is currently being edited
  const [editingField, setEditingField] = useState<EditingField>("none");
  // const [newPurposeName, setNewPurposeName] = useState("");
  // const [editingPurposeIndex, setEditingPurposeIndex] = useState<number | null>(
  //   null
  // );

  // Fetch current church data on component mount
  useEffect(() => {
    if (churchPK) {
      getChurchDetailsForAdmin(dispatch, churchPK);
    }
  }, [dispatch, churchPK]);

  // Helper function to start editing a field
  const startEditing = (field: EditingField) => {
    if (editingField !== "none") {
      // Cancel current edit if another field is being edited
      cancelEditing();
    }
    setEditingField(field);
  };

  // Helper function to cancel editing
  const cancelEditing = () => {
    setEditingField("none");
  };

  return (
    <div className={classes.content}>
      {fetchingInProcess && <Loader />}

      {!fetchingInProcess && (
        <>
          <h1 className={classes.header}>Edit Church Details</h1>
          <br />
          {/* CHURCH INFORMATION */}
          <div>
            {editingField === "logo" ? (
              <LogoUploader cancelEditing={cancelEditing} />
            ) : (
              <>
                <ChurchLogo />
                <br />
                <br />
                <EditButton
                  type="button"
                  onClick={() => startEditing("logo")}
                  disabled={editingField !== "none"}
                >
                  Upload New Logo
                </EditButton>
              </>
            )}
            <h2>Church Information</h2>

            {editingField === "churchShortName" ? (
              <TextFieldUpdateForm
                cancelEditing={cancelEditing}
                fieldname="churchShortName"
                fieldLabel="Church Short Name"
                fieldErrorMessage="Please enter a valid short name for the church."
              />
            ) : (
              <>
                <div className={classes.labelText}>Church Short Name</div>
                <div className={classes.editText}>{churchShortName}</div>
                <EditButton
                  type="button"
                  onClick={() => startEditing("churchShortName")}
                  disabled={editingField !== "none"}
                >
                  Update
                </EditButton>
              </>
            )}

            {editingField === "churchLongName" ? (
              <TextFieldUpdateForm
                cancelEditing={cancelEditing}
                fieldname="churchLongName"
                fieldLabel="Official Name of the Church"
                fieldErrorMessage="Please provide the official name for the church."
              />
            ) : (
              <>
                <div className={classes.labelText}>
                  Official Name of the Church
                </div>
                <div className={classes.editText}>{churchLongName}</div>
                <EditButton
                  type="button"
                  onClick={() => startEditing("churchLongName")}
                  disabled={editingField !== "none"}
                >
                  Update
                </EditButton>
              </>
            )}
          </div>

          {/* FINANCE CONTACT */}
          <h2>Finance Contact</h2>
          <div>
            {/* Finance Contact Name */}
            {editingField === "financeContactName" ? (
              <TextFieldUpdateForm
                cancelEditing={cancelEditing}
                fieldname="financeContactName"
                fieldLabel="Finance Contact Name"
                fieldErrorMessage="Please provide the finance contact name."
              />
            ) : (
              <>
                <div className={classes.labelText}>Finance Contact Name</div>
                <div className={classes.editText}>{financeContactName}</div>
                <EditButton
                  type="button"
                  onClick={() => startEditing("financeContactName")}
                  disabled={editingField !== "none"}
                >
                  Update
                </EditButton>
              </>
            )}

            {/* Finance Email */}
            {editingField === "financeEmail" ? (
              <TextFieldUpdateForm
                cancelEditing={cancelEditing}
                fieldname="financeEmail"
                fieldLabel="Finance Email"
                fieldErrorMessage="Please provide a valid email address."
                emailInput={true}
              />
            ) : (
              <>
                <div className={classes.labelText}>Finance Email</div>
                <div className={classes.editText}>{financeEmail}</div>
                <EditButton
                  type="button"
                  onClick={() => startEditing("financeEmail")}
                  disabled={editingField !== "none"}
                >
                  Update
                </EditButton>
              </>
            )}
          </div>

          {/* COST PURPOSES */}
          <h2>Cost Purposes</h2>

          {/* Existing Cost Purposes */}
          <div>
            {costPurposes.map((purpose) => (
              <div key={purpose.SK} className={classes.formBody}>
                {editingField === purpose.SK ? (
                  <CostPurposeForm
                    cancelEditing={cancelEditing}
                    newRecord={false}
                    costPurposeSK={purpose.SK!}
                  />
                ) : (
                  <div className={classes.costPurpose}>
                    <div className={classes.costPurposeName}>
                      {purpose.costPurposeName}
                    </div>
                    <span>
                      {purpose.costCode && <span>{purpose.costCode}</span>}
                    </span>

                    <EditIconButton
                      type="button"
                      onClick={() => startEditing(purpose.SK!)}
                      disabled={editingField !== "none"}
                    >
                      <span className={classes.editIcon}>🖌</span>
                    </EditIconButton>
                    <EditIconButton
                      onClick={() =>
                        deleteCostPurpose(dispatch, churchPK, purpose.SK!)
                      }
                    >
                      <span className={classes.editIcon}>❌</span>
                    </EditIconButton>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Cost Purpose */}
          {editingField === "newCostPurpose" ? (
            <CostPurposeForm cancelEditing={cancelEditing} newRecord={true} />
          ) : (
            <>
              <EditButton
                type="button"
                onClick={() => startEditing("newCostPurpose")}
                disabled={editingField !== "none"}
              >
                + Add New Cost Purpose
              </EditButton>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EditChurch;
