import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import "./Navbar.css";

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🏠 Rent & Flatmate Finder
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/listings">Listings</Link>
            {user.role === "tenant" && <Link to="/profile">My Profile</Link>}
            {user.role === "owner" && <Link to="/dashboard">Dashboard</Link>}
            <Link to="/interests">Interests</Link>
            {user.role === "admin" && <Link to="/admin">Admin</Link>}
            <span className="navbar-user">Hi, {user.name}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
