// 
// Header
// 

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header: React.FC = () => {
  const { isLoggedIn, logout, initialized } = useAuth();
  const location = useLocation();
  
  if (!initialized) return null;
  
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <header className="header bg-dark text-white py-3">
      <div className="container d-flex align-items-center justify-content-between">        
        <div className="header-logo brand__logo">
          <Link to="/" className="text-white text-decoration-none">
            <div className="m-0 logo">RFP<span>AI</span></div>
          </Link>
        </div>

        <nav className="header-nav d-none d-md-flex gap-3">
          <Link to="/" className="text-white text-decoration-none">Home</Link>
          <Link to="/features" className="text-white text-decoration-none">Features</Link>
          <Link to="/pricing" className="text-white text-decoration-none">Pricing</Link>
          <Link to="/about" className="text-white text-decoration-none">About</Link>
        </nav>
        
        <div className="header-auth d-flex gap-2 align-items-center">
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="btn btn-outline-light">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </>
          ) : (
            !isDashboard && (
              <>
                <Link to="/dashboard" className="profile-btn btn btn-primary">Get Started</Link>
                <button className="btn btn-outline-light" onClick={logout}> Logout </button>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
