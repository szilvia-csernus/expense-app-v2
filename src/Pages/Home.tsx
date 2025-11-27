import CostForm from "../Components/CostForm";
import Footer from "../Components/Footer";
import { Container } from "../Components/Container";
import PageLoader from "../Components/PageLoader";

import { useAppSelector, useAppDispatch } from "../store";
import { useEffect } from "react";
import { getChurchDetails } from "../store/church-action-creators";
import { Link } from "react-router-dom";
import { getCurrentUser } from "aws-amplify/auth";

import classes from "./Admin.module.css";
import ModalMessage from "../Components/ModalMessage";

function Home() {
  const sending = useAppSelector((state) => state.form.sending);
  const modalMessage = useAppSelector((state) => state.modalMessage.status);
  const churchPK = useAppSelector((state) => state.church.churchPK);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchChurchDetails = async () => {
      try {
        await getCurrentUser();
        // If user is authenticated, use userPool auth mode
        getChurchDetails(dispatch, churchPK, "userPool");
      } catch {
        // If user is not authenticated, use identityPool auth mode
        getChurchDetails(dispatch, churchPK, "identityPool");
      }
    };

    if (churchPK) {
      fetchChurchDetails();
    }
  }, [dispatch, churchPK]);

  return (
    <Container>
      {sending && <PageLoader />}
      {modalMessage && <ModalMessage />}

      <CostForm />
      <Footer>
        <Link to="/admin" className={classes.adminLogin}>
          Admin login
        </Link>
      </Footer>
    </Container>
  );
}

export default Home;
