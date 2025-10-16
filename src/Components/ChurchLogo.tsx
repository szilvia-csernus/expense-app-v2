import classes from "./Form.module.css";

import { useAppSelector } from "../store";
import { StorageImage } from "@aws-amplify/ui-react-storage";

const ChurchLogo = () => {
  const churchLogo = useAppSelector((state) => state.church.logo);

  return (
    <StorageImage
      path={churchLogo || "logos/Image_not_available.png"}
      className={classes.churchLogo}
      alt="church logo"
      style={{ height: "60px", width: "auto" }}
    />
  );
};

export default ChurchLogo;
