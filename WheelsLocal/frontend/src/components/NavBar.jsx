import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  // Navegación básica
  return (
    <nav className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-white/60 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-4 items-center">
        <Link to="/" className="font-bold">Wheels Sabana</Link>
        {isAuthenticated && (
          <>
            <Link to="/features/add-pickup-points">Pickup Points</Link>
            <Link to="/features/calculate-distance">Distance</Link>
          </>
        )}
        <div className="ml-auto flex gap-3">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-blue-600">Login</Link>
              <Link to="/register" className="text-blue-600">Register</Link>
            </>
          ) : (
            <button onClick={logout} className="text-red-600">Logout</button>
          )}
        </div>
      </div>
    </nav>
  );
}
