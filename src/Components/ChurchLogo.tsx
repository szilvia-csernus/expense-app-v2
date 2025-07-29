import classes from "./Form.module.css";

import { useAppSelector } from "../store";

const ChurchLogo = () => {
  const churchName = useAppSelector((state) => state.church.churchName);
  const churchLogo = useAppSelector((state) => state.church.logo);

  const logo = (
    <img
      src={churchLogo}
      width="270"
      height="80"
      className={classes.churchLogo}
      alt="church logo"
    ></img>
  );
  return <>{churchName && logo}</>;
};

export default ChurchLogo;
