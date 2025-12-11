import classes from "./Form.module.css";
import { useAppSelector } from "../store";
import { StorageImage } from "@aws-amplify/ui-react-storage";

const ChurchLogo = () => {
  const churchLogoPath = useAppSelector((state) => state.church.logo);
  const isFetching = useAppSelector(
    (state) => state.church.fetchingDetailsInProcess
  );

  return (
    <div style={{ height: "60px", display: "block" }}>
      {churchLogoPath && !isFetching && (
        <StorageImage
          path={churchLogoPath}
          className={classes.churchLogo}
          alt="church logo"
          loading="eager"
          width={202}
          height={60}
        />
      )}
    </div>
  );
};

export default ChurchLogo;
