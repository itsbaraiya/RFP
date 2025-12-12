// //
// // UserManagement.tsx - Admin Dashboard
// //

import { useState, useEffect } from "react";
import { Row, Col, Button } from "react-bootstrap";
import { Users, FileText, DollarSign, UserPlus, Search, Plus, Edit, Trash2 } from "lucide-react";
import { getAvatarURL } from "../../context/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const UserManagement = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    designation: "",
  });

  // Mock data for dashboard
  const summaryCards = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+20.1% from last month",
      icon: Users,
      color: "#2563eb",
    },
    {
      title: "Active Proposals",
      value: "456",
      change: "+12.5% from last month",
      icon: FileText,
      color: "#10b981",
    },
    {
      title: "Credits Consumed",
      value: "15,450",
      change: "Total this quarter",
      icon: DollarSign,
      color: "#8b5cf6",
    },
    {
      title: "New Signups Today",
      value: "24",
      change: "vs. 10 last week",
      icon: UserPlus,
      color: "#f59e0b",
    },
  ];

  const creditConsumptionData = [
    { month: "Jan", credits: 1200 },
    { month: "Feb", credits: 1800 },
    { month: "Mar", credits: 2400 },
    { month: "Apr", credits: 3000 },
    { month: "May", credits: 3800 },
    { month: "Jun", credits: 4500 },
    { month: "Jul", credits: 5200 },
    { month: "Aug", credits: 5800 },
    { month: "Sep", credits: 6200 },
    { month: "Oct", credits: 6800 },
    { month: "Nov", credits: 7200 },
    { month: "Dec", credits: 7500 },
  ];

  const topCreditConsumers = [
    { name: "Diana Prince", credits: 210, avatar: getAvatarURL() },
    { name: "John Smith", credits: 185, avatar: getAvatarURL() },
    { name: "Sarah Johnson", credits: 165, avatar: getAvatarURL() },
    { name: "Mike Davis", credits: 150, avatar: getAvatarURL() },
    { name: "Emily Brown", credits: 135, avatar: getAvatarURL() },
  ];

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit modal open
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      designation: user.designation || "",
    });
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const res = await fetch(`${BASE_URL}/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          designation: formData.designation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Update failed:", data);
        alert(`❌ Failed to update user: ${data.error || "Unknown error"}`);
        return;
      }

      const updated = data.user || data;
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );

      alert("✅ User updated successfully!");
      setEditingUser(null);
    } catch (err) {
      console.error("Error updating user:", err);
      alert("❌ An error occurred while updating user.");
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`${BASE_URL}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <div className="admin-dashboard">
      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Col xs={12} sm={6} lg={3} key={index}>
              <div className="summary-card">
                <div className="summary-card__header">
                  <div className="summary-card__icon" style={{ background: `${card.color}20`, color: card.color }}>
                    <Icon size={24} />
                  </div>
                  <div className="summary-card__content">
                    <h3 className="summary-card__title">{card.title}</h3>
                    <p className="summary-card__value">{card.value}</p>
                    <p className="summary-card__change">{card.change}</p>
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* User Management Section */}
      <div className="admin-section">
        <div className="admin-section__header">
          <div>
            <h2 className="admin-section__title">User Management</h2>
            <p className="admin-section__subtitle">Manage all users and their permissions.</p>
          </div>
        </div>

        <div className="admin-section__toolbar">
          <div className="admin-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="admin-btn-primary">
            <Plus size={18} className="me-2" />
            Add User
          </Button>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-white">No users found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Credits</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, 5).map((user, index) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-table__user">
                        <img
                          src={user.avatar || getAvatarURL()}
                          alt={user.name}
                          className="admin-table__avatar"
                        />
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className="admin-badge admin-badge--role">{user.role}</span>
                    </td>
                    <td>{user.credits || "1250"}</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          user.status === "active" ? "admin-badge--success" : "admin-badge--danger"
                        }`}
                      >
                        {user.status || "active"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          className="admin-action-btn"
                          onClick={() => openEditModal(user)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn--danger"
                          onClick={() => deleteUser(user.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="admin-pagination">
              <span>Showing 5 of {filteredUsers.length} users</span>
              <div className="pagination-controls">
                <button className="pagination-btn">Previous</button>
                <span>Page 1 of 2</span>
                <button className="pagination-btn">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row - Charts and Lists */}
      <Row className="g-4 mt-4">
        <Col xs={12} lg={8}>
          <div className="admin-chart-card">
            <h3 className="admin-chart-card__title">Credit Consumption Trend</h3>
            <p className="admin-chart-card__subtitle">Credits consumed over the last 12 months.</p>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={creditConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="credits"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>
        <Col xs={12} lg={4}>
          <div className="admin-list-card">
            <h3 className="admin-list-card__title">Top Credit Consumers</h3>
            <p className="admin-list-card__subtitle">Users with the highest credit usage.</p>
            <div className="admin-consumer-list">
              {topCreditConsumers.map((consumer, index) => (
                <div key={index} className="admin-consumer-item">
                  <img
                    src={consumer.avatar}
                    alt={consumer.name}
                    className="admin-consumer-avatar"
                  />
                  <div className="admin-consumer-info">
                    <div className="admin-consumer-name">{consumer.name}</div>
                    <div className="admin-consumer-credits">Credits used: {consumer.credits}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-actions-card">
            <h3 className="admin-actions-card__title">Quick Credit Actions</h3>
            <p className="admin-actions-card__subtitle">Perform common credit management tasks.</p>
            <div className="admin-actions-buttons">
              <Button className="admin-action-button">
                <Plus size={18} className="me-2" />
                Add Credits
              </Button>
              <Button className="admin-action-button">
                <Edit size={18} className="me-2" />
                Adjust User Plan
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Edit Modal */}
      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Edit User</h3>
              <button className="admin-modal__close" onClick={() => setEditingUser(null)}>
                ×
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label>Name</label>
                <input
                  className="admin-form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="admin-form-group">
                <label>Email</label>
                <input
                  className="admin-form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="admin-form-group">
                <label>Role</label>
                <select
                  className="admin-form-control"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="COLLABORATOR">COLLABORATOR</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select
                  className="admin-form-control"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Designation</label>
                <input
                  className="admin-form-control"
                  name="designation"
                  placeholder="e.g. Frontend Developer"
                  value={formData.designation}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn-secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
              <button className="admin-btn-primary" onClick={handleUpdateUser}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
