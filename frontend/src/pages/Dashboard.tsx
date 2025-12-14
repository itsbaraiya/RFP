// //
// Dashboard.tsx
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
import Credits from "../components/dashboard/Credits";
import Collaborators from "../components/dashboard/Collaborators";
import Library from "../components/dashboard/Library";

import { useAuth, getAvatarURL } from "../context/AuthContext";

import {
  LayoutDashboard,
  Users,
  Grid,
  Search,
  Settings,
  FileText,
} from "lucide-react";

type MenuItem = {
  key: string;
  label: string;
  icon: React.FC<any>;
};

type MenuConfig = {
  ADMIN: MenuItem[];
  CUSTOMER: MenuItem[];
  COLLABORATOR: MenuItem[];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const { logout } = useAuth();

  const getMainClass = () => {
    return `dashboard__main dashboard__main--${activeTab}`;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    logout();
  };

  const menuConfig: MenuConfig = {
    ADMIN: [
      { key: "overview", label: "Overview", icon: LayoutDashboard },
      { key: "users", label: "Users & Roles", icon: Users },
      { key: "rfps", label: "All RFPs", icon: FileText },
      { key: "analytics", label: "Analytics", icon: Grid },
      { key: "credits", label: "Plans & Billing", icon: Settings },
      { key: "profile", label: "Account Settings", icon: Settings },
    ],
    CUSTOMER: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "myrfps", label: "My RFPs", icon: FileText },
      { key: "proposalbuilder", label: "Proposal Builder", icon: Grid },
      { key: "library", label: "Content Library", icon: Users },
      { key: "collaborators", label: "Team & Collaborators", icon: Users },
      { key: "credits", label: "Credits & Usage", icon: Settings },
      { key: "profile", label: "Account Settings", icon: Settings },
    ],
    COLLABORATOR: [
      { key: "assigned", label: "Assigned RFPs", icon: LayoutDashboard },
      { key: "builder", label: "Proposal Builder", icon: FileText },
      { key: "reviews", label: "Reviews & Comments", icon: Users },
      { key: "library", label: "Content Library", icon: Grid },
      { key: "profile", label: "Account Settings", icon: Settings },
    ],
  };

  const currentMenu = user ? menuConfig[user.role as keyof MenuConfig] || [] : [];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return user?.role === "ADMIN" ? <UserManagement /> : <DashboardHome />;
      case "user":
        return user?.role === "ADMIN" ? <UserManagement /> : <p>Access Denied</p>;
      case "myrfps":
        return <MyRFPs />;
      case "proposal":
        return <h2>Manage Proposals</h2>;
      case "collaborators":
        return <Collaborators />;
      case "library":
        return <Library />;
      case "credits":
        return <Credits />; 
      case "proposalbuilder":
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
        </div>
        <div className="dashboard__header-right">
          <div className="dashboard__search">
            <Search size={18} />
            <input
              type="text"
              placeholder={
                user?.role === "ADMIN"
                  ? "Search users or proposals..."
                  : "Search proposals..."
              }
            />
          </div>
          <div className="dashboard__user-profile">
            <img
              src={user?.avatar || getAvatarURL()}
              alt={user?.name || "User"}
              className="profile-avatar"
            />
          </div>
        </div>
      </header>

      <div className="dashboard__body">
        <aside className="sidebar">
          <nav className="sidebar__nav">
            <ul>
              {currentMenu.map(({ key, label, icon: Icon }) => (
                <li
                  key={key}
                  className={`sidebar__item ${activeTab === key ? "active" : ""}`}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon size={18} className="sidebar__icon" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </nav>

          {user && (
            <div className="sidebar__footer">
              <button
                className="btn btn-outline-danger w-100"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          )}
        </aside>
        <main className={getMainClass()}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
