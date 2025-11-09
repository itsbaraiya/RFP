import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="profile position-relative" ref={profileRef}>
      <img
        src={user?.avatar || "/Images/user-profile.png"}
        alt="Profile"
        className="rounded-circle mb-3"
        style={{ width: "50px", height: "50px", cursor: "pointer" }}
        onClick={() => setShowProfileMenu(!showProfileMenu)}
      />

      {showProfileMenu && (
        <div
          className="position-absolute bg-white text-dark shadow rounded"
          style={{ top: "60px", width: "150px", zIndex: 1000 }}
        >
          <button
            className="dropdown-item"
            onClick={() => {
              setShowProfileMenu(false);
              navigate("/dashboard/edit-profile");
            }}
          >
            Edit Profile
          </button>
          <button className="dropdown-item text-danger" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
