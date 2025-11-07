import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import NavBar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import RoutesConfig from "./routes/index.jsx";
import Login from "./features/Auth/Login.jsx";
import Register from "./features/Auth/Register.jsx";
import ForgotPassword from "./features/Auth/ForgotPassword.jsx";
import ResetPassword from "./features/Auth/ResetPassword.jsx";

export default function App() {
  // Layout + enrutamiento principal
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell>
          <NavBar />
          <div className="mt-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {RoutesConfig}
            </Routes>
          </div>
        </AppShell>
      </AuthProvider>
    </ThemeProvider>
  );
}
