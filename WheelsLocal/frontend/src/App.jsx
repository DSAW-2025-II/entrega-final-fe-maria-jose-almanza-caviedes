import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import RoutesConfig from "./routes/index.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Login from "./features/Auth/Login.jsx";
import Register from "./features/Auth/Register.jsx";

export default function App() {
  // Layout + enrutamiento principal
  return (
    <div className="min-h-screen relative text-slate-900">
      {/* Fondo en capas: gradiente + halos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-sky-100"
      ></div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.20),transparent_35%),radial-gradient(circle_at_85%_90%,rgba(59,130,246,0.18),transparent_35%)]"
      />
      {/* Patrón sutil opcional */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid-overlay"></div>

      <AuthProvider>
        <NavBar />
        <main className="max-w-5xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Rutas protegidas (features) */}
            {RoutesConfig}
          </Routes>
        </main>
      </AuthProvider>
    </div>
  );
}
