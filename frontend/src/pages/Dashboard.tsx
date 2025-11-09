// //
// // Dashboard.tsx
// //

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EditProfile from "../pages/EditProfile";
import UserManagement from "../components/admin/UserManagement";
import DashboardHome from "../components/dashboard/Home";
import Analytics from "../components/dashboard/Analytics";
import CreditPlans from "../components/admin/CreditPlans";
import AIModelConfigs from "../components/admin/AIModelConfigs";
import MyRFPs from "../components/dashboard/MyRFPs";

import {
  LayoutDashboard,
  Users,
  Tag,
  Grid,
  BarChart2,
  User,
  Edit3,
} from "lucide-react";


const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const profileRef = useRef<HTMLDivElement>(null);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  
  const menuConfig: Record<string, any[]> = {
    ADMIN: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "profile", label: "Profile", icon: User },
      { key: "user", label: "User Management", icon: Users },
      { key: "analytics", label: "Analytics", icon: BarChart2 },
      { key: "pricing", label: "Credit Plans", icon: Tag },
      { key: "aikit", label: "AI Model Configs", icon: Grid },
    ],
    CUSTOMER: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "myrfps", label: "My RFPs", icon: Edit3 }, // 🆕 Added
      { key: "collaborators", label: "Collaborators", icon: Users },
      { key: "credits", label: "Credits & Billing", icon: Tag },
      { key: "analytics", label: "Usage Analytics", icon: Grid },
      { key: "profile", label: "Profile", icon: User },
    ],    
    COLLABORATOR: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "proposal", label: "My Proposals", icon: Edit3 },
      { key: "profile", label: "Profile", icon: User },
    ],
  };

  const currentMenu = menuConfig[user?.role] || [];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
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
        return <AIModelConfigs />;
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
      <aside className="sidebar">
        <div className="sidebar__logo" ref={profileRef} onClick={() => navigate("/")}>
          <img src={`${BASE_URL}/uploads/images/logo.svg`} alt="Profile"/>
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
                <Icon size={18} className="sidebar__icon" /> {label}
              </li>
            ))}
          </ul>
        </nav>

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
  );
};

export default Dashboard;
