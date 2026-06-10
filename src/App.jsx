import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toast } from "@heroui/react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserPage from "./pages/user.jsx";

export default function App() {
  return (
    <>
      <Toast.Provider />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user" element={<UserPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
