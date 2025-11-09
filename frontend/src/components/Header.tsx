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
        <div className="header-logo">
          <Link to="/" className="text-white text-decoration-none">
            <h1 className="m-0">RFP AI</h1>
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
                <Link to="/dashboard" className="profile-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
                    <g data-name="Group 12825" transform="translate(-1228 -35)">
                      <circle data-name="Ellipse 116" cx="13" cy="13" r="13" transform="translate(1228 35)" fill="#f5f8ff"></circle>
                      <path d="M4.324,3.624A3.624,3.624,0,1,1,7.949,7.249,3.627,3.627,0,0,1,4.324,3.624Zm5.936,4.812H5.637A4.454,4.454,0,0,0,1.2,12.872C1.2,15.309,2.137,15,3.325,15h9.248A2.107,2.107,0,0,0,14.7,12.872a4.454,4.454,0,0,0-4.437-4.437Z" transform="translate(1233.051 39.994)" fill="#0101d9"></path>
                    </g>
                  </svg>
                </Link>
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
