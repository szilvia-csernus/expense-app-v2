/* Loader styling from https://loading.io/css/ */

import classes from "./Loader.module.css";

const Loader = () => {
  return (
    <div className={classes.content} role="status" aria-label="Loading">
      <ul className={classes.loader}>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
      </ul>
    </div>
  );
};

export default Loader;
