import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Pages/Home";
// import ErrorPage from "./Pages/ErrorPage";
import Admin from "./Pages/Admin";

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
