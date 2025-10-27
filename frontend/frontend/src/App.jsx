// src/App.jsx
import { RouterProvider } from "react-router-dom";
import router from "./app/routes";   // file định nghĩa routes
import BootstrapAuth from "./BootstrapAuth"; // component bootstrap phiên login
import { Toaster } from "react-hot-toast";
function App() {
  return (
    <>
       <BootstrapAuth>
      {/* Render toàn bộ router */}
      <RouterProvider router={router} />
    </BootstrapAuth>

    <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            fontWeight: 500,
            borderRadius: "12px",
            background: "#fff",
            color: "#1e293b",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          },
          success: {
            iconTheme: {
              primary: "#2563eb",
              secondary: "#fff",
            },
          },
        }}
      />
    </>
  );
}

export default App;
