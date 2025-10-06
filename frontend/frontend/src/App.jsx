// src/App.jsx
import { RouterProvider } from "react-router-dom";
import router from "./app/routes";   // file định nghĩa routes
import BootstrapAuth from "./BootstrapAuth"; // component bootstrap phiên login

function App() {
  return (
    <>
       <BootstrapAuth>
      {/* Render toàn bộ router */}
      <RouterProvider router={router} />
    </BootstrapAuth>
    </>
  );
}

export default App;
