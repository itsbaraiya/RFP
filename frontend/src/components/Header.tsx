// Header.tsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const Header: React.FC = () => {
  const { isLoggedIn, logout, initialized } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!initialized) return null;

  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <header className={`rfp-header ${scrolled ? "scrolled" : ""}`}>
      <div className="container d-flex align-items-center justify-content-between">
        {/* Logo */}
        <div className="header-logo">
          <Link to="/" className="logo-link brand__logo">
            <div className="logo">
              RFP<span>AI</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="nav-links d-none d-md-flex">
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/about">About</Link>
        </nav>

        {/* Auth buttons */}
        <div className="auth-buttons d-flex align-items-center gap-2">
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="btn-outline">Login</Link>
              <Link to="/register" className="btn-primary">Sign Up</Link>
            </>
          ) : (
            !isDashboard && (
              <>
                <Link to="/dashboard" className="btn-primary">Get Started</Link>
                <button className="btn-outline" onClick={logout}>Logout</button>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
