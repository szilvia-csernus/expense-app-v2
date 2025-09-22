import classes from "./Form.module.css";

import { useAppSelector } from "../store";
import { StorageImage } from "@aws-amplify/ui-react-storage";

const ChurchLogo = () => {
  const churchLogo = useAppSelector((state) => state.church.logo);

  return (
    <StorageImage
      path={churchLogo || "logos/rotterdamLogo_default.png"}
      fallbackSrc="logos/rotterdamLogo_default.png"
      className={classes.churchLogo}
      alt="church logo"
      style={{ height: "60px", width: "auto" }}
    />
  );
};

export default ChurchLogo;
