// //
// // Dashboard.tsx
// //

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EditProfile from "../pages/EditProfile";
import UserManagement from "../components/admin/UserManagement";
import DashboardHome from "../components/dashboard/Home";
import Analytics from "../components/dashboard/Analytics";
import CreditPlans from "../components/admin/CreditPlans";
import ProposalBuilder from "../components/rfp/ProposalBuilder";
import MyRFPs from "../components/dashboard/MyRFPs";
import { useAuth, getAvatarURL } from "../context/AuthContext";


import {
  LayoutDashboard,
  Users,
  Grid,
  Search,
  ChevronDown,
  Settings,
  FileText,
} from "lucide-react";


const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
}, []);


const { logout } = useAuth();

  const handleLogout = () => {
    logout();
};
  
  const menuConfig: Record<string, Array<{ key: string; label: string; icon: any }>> = {
    ADMIN: [
      { key: "dashboard", label: "Admin Layout Dashboard", icon: LayoutDashboard },
      { key: "user", label: "User Management", icon: Users },
      { key: "aikit", label: "Proposal Builder", icon: FileText },
      { key: "collaborators", label: "Collaborator View", icon: Users },
      { key: "profile", label: "Account Settings", icon: Settings },
    ],
    CUSTOMER: [
      { key: "dashboard", label: "Customer Dashboard", icon: LayoutDashboard },
      { key: "myrfps", label: "Admin Dashboard", icon: LayoutDashboard },
      { key: "aikit", label: "Proposal Builder", icon: FileText },
      { key: "collaborators", label: "Collaborator View", icon: Users },
      { key: "profile", label: "Account Settings", icon: Settings },
    ],    
    COLLABORATOR: [
      { key: "dashboard", label: "Customer Dashboard", icon: LayoutDashboard },
      { key: "myrfps", label: "Admin Dashboard", icon: LayoutDashboard },
      { key: "aikit", label: "Proposal Builder", icon: FileText },
      { key: "collaborators", label: "Collaborator View", icon: Users },
      { key: "profile", label: "Account Settings", icon: Settings },
    ],
  };

  const topNavLinks = [
    { key: "dashboard", label: user?.role === "ADMIN" ? "Admin Layout Dashboard" : "Customer Dashboard" },
    { key: "myrfps", label: user?.role === "ADMIN" ? "Customer Layout Dashboard" : "Admin Dashboard" },
    { key: "aikit", label: "Proposal Builder" },
    { key: "collaborators", label: "Collaborator View" },
    { key: "profile", label: "Account Settings" },
  ];

  const currentMenu = menuConfig[user?.role] || [];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        if (user?.role === "ADMIN") {
          return <UserManagement />;
        }
        return <DashboardHome />;
      case "user":
        return user?.role === "ADMIN" ? <UserManagement /> : <p>Access Denied</p>;
      case "myrfps":
        return <MyRFPs />;
      case "proposal":
        return <h2>Manage Proposals</h2>;
      case "collaborators":
        return <h2>Collaborator Management</h2>;
      case "credits":
        return <h2>Credits & Billing</h2>;
      case "aikit":
        return <ProposalBuilder />;
      case "analytics":
        return <Analytics />;
      case "pricing":
        return <CreditPlans />;
      case "profile":
        return <EditProfile />;
      default:
        return <h2>Select a section from the sidebar</h2>;
    }
  };

  return (
    <div className="dashboard">
      {/* Top Header Bar */}
      <header className="dashboard__header">
        <div className="dashboard__header-left">
          <div className="dashboard__logo" onClick={() => navigate("/")}>
            <span className="logo-icon">🔥</span>
            <span className="logo-text">RFP AI</span>
          </div>
          <nav className="dashboard__top-nav">
            {topNavLinks.map(({ key, label }) => (
              <button
                key={key}
                className={`dashboard__nav-link ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="dashboard__header-right">
          <div className="dashboard__search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={user?.role === "ADMIN" ? "Search users or proposals..." : "Search proposals..."}
            />
          </div>
          <div className="dashboard__user-profile">
            <img 
              src={user?.avatar || getAvatarURL()} 
              alt={user?.name || "User"} 
              className="profile-avatar"
            />
            <ChevronDown size={16} />
          </div>
        </div>
      </header>

      <div className="dashboard__body">
        <aside className="sidebar">
          <div className="sidebar__section">            
          </div>

          <nav className="sidebar__nav">
            <ul>
              {currentMenu.map(({ key, label, icon: Icon }) => (
                <li
                  key={key}
                  className={`sidebar__item ${
                    activeTab === key ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon size={18} className="sidebar__icon" /> 
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </nav>

          {user && (
            <div className="sidebar__user-profile">
              <img 
                src={user?.avatar || getAvatarURL()} 
                alt={user?.name || "User"} 
                className="sidebar__avatar"
              />
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">{user?.name || "User"}</div>
                <div className="sidebar__user-email">{user?.email || ""}</div>
              </div>
            </div>
          )}

          {user && (
            <div className="sidebar__footer">
              <button className="btn btn-outline-danger w-100" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </aside>      
        <main className="dashboard__main">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Dashboard;
