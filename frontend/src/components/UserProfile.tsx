
// User Profile
import React from "react";

const UserProfile: React.FC = () => {
    return (
        <div className="profile position-relative" ref={profileRef}>
                    <img
                    src={user.avatar || "/Images/user-profile.png"}
                    alt="Profile"
                    className="rounded-circle mb-3"
                    style={{ width: "50px", height: "50px", cursor: "pointer" }}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    />

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                    <div
                        className="position-absolute bg-white text-dark shadow rounded"
                        style={{ top: "60px", width: "150px", zIndex: 1000 }}
                    >
                        <button
                        className="dropdown-item"
                        onClick={() => navigate("/dashboard/edit-profile")}
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
}

export default UserProfile;
