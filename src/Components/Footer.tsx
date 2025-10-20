import React from "react";
import classes from "./Footer.module.css";
import logoUrl from "../images/expLogo.webp";

function Footer({ children }: { children?: React.ReactNode }) {
  return (
    <footer>
      <p>©{new Date().getFullYear()} Expense App</p>
      <div className={classes.separator}></div>
      <div>
        <img
          src={logoUrl}
          width="20"
          height="20"
          className={classes.logo}
          alt="app logo"
        ></img>
      </div>

      {children}
    </footer>
  );
}

export default Footer;
