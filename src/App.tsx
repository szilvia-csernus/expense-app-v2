import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Pages/Home";
import { lazy } from "react";
import ErrorPage from "./Pages/ErrorPage";
import NotFound from "./Pages/NotFound";

const Admin = lazy(() => import("./Pages/Admin"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/admin",
    element: <Admin />,
    errorElement: <ErrorPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
