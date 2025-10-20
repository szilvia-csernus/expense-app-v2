import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Pages/Home";
import { lazy } from "react";
// import ErrorPage from "./Pages/ErrorPage";

const Admin = lazy(() => import("./Pages/Admin"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    // errorElement: <ErrorPage />,
  },
  {
    path: "/admin",
    element: <Admin />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
