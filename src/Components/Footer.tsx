import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer>
      <p>©{new Date().getFullYear()} Expense App</p>
      <p>All rights reserved.</p>

      <Link to="/admin">Admin login</Link>
    </footer>
  );
}

export default Footer;
