// 
// Dashboard Home - Customer Dashboard
// 

import { useState } from "react";
import { Row, Col, Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

import { 
  DollarSign, 
  FileText, 
  Send, 
  CheckCircle2, 
  Plus, 
  Upload, 
  Eye,
  Edit,
  MessageCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import Loader from "../common/Loader";

const Home = () => {
  const { user, initialized } = useAuth();  
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  if (!initialized) return <Loader />;
  if (!user) return <div className="no-user">No user found. Please log in.</div>;

  // Mock data - replace with actual API calls
  const atAGlanceData = [
  {
    title: "AI Credits",
    value: "5,200",
    description: "Your current AI credit balance",
    icon: DollarSign,
    action: "Purchase More Credits",
    actionKey: "credits",
    color: "#2563eb",
  },
  {
    title: "Draft Proposals",
    value: "12",
    description: "Proposals currently in draft",
    icon: FileText,
    action: "View Drafts",
    actionKey: "draft",
    color: "#3b82f6",
  },
  {
    title: "Submitted Proposals",
    value: "8",
    description: "Proposals submitted for review",
    icon: Send,
    action: "View Submitted",
    actionKey: "submitted",
    color: "#8b5cf6",
  },
  {
    title: "Approved Proposals",
    value: "5",
    description: "Proposals approved and active",
    icon: CheckCircle2,
    action: "View Approved",
    actionKey: "approved",
    color: "#10b981",
  },
];


  const creditUsageData = [
    { month: "Jan", credits: 45 },
    { month: "Feb", credits: 52 },
    { month: "Mar", credits: 68 },
    { month: "Apr", credits: 75 },
    { month: "May", credits: 88 },
    { month: "Jun", credits: 95 },
  ];

  const proposalSuccessData = [
    { category: "Approved", value: 75 },
    { category: "Pending", value: 45 },
    { category: "Rejected", value: 20 },
  ];

  const recentActivity = [
    { icon: Edit, text: "Edited 'Project Omega RFP'", time: "2 hours ago" },
    { icon: MessageCircle, text: "Commented on 'Marketing Campaign Proposal'", time: "1 day ago" },
    { icon: Plus, text: "Created new proposal 'Q4 Budget Review'", time: "2 days ago" },
    { icon: CheckCircle2, text: "Approved 'Website Redesign Proposal'", time: "3 days ago" },
  ];

  const recentProposals = [
    { title: "Project Alpha", status: "Approved", lastUpdated: "2024-01-15", actions: "" },
    { title: "Marketing Campaign", status: "Submitted", lastUpdated: "2024-01-14", actions: "" },
    { title: "Budget Review Q4", status: "Draft", lastUpdated: "2024-01-13", actions: "" },
    { title: "Website Redesign", status: "Approved", lastUpdated: "2024-01-12", actions: "" },
    { title: "Mobile App Update", status: "Draft", lastUpdated: "2024-01-11", actions: "" },
    { title: "Mobile App Update", status: "Draft", lastUpdated: "2024-01-11", actions: "" },
    { title: "Mobile App Update", status: "Draft", lastUpdated: "2024-01-11", actions: "" },
    { title: "Mobile App Update", status: "Draft", lastUpdated: "2024-01-11", actions: "" },
    { title: "Mobile App Update", status: "Draft", lastUpdated: "2024-01-11", actions: "" },
    { title: "Mobile App Update", status: "Draft", lastUpdated: "2024-01-11", actions: "" },
  ];

  const totalProposals = recentProposals.length;
  const totalPages = Math.ceil(totalProposals / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedProposals = recentProposals.slice(startIndex, endIndex);

  const handleGlanceAction = (key: string) => {
  switch (key) {
    case "credits":
      navigate("/dashboard?tab=credits");
      break;

    case "draft":
      navigate("/dashboard?tab=myrfps&status=Draft");
      break;

    case "submitted":
      navigate("/dashboard?tab=myrfps&status=Submitted");
      break;

    case "approved":
      navigate("/dashboard?tab=myrfps&status=Approved");
      break;

    default:
      break;
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "Approved":
      return "badge-success";
    case "Submitted":
      return "badge-primary";
    case "Draft":
      return "badge-secondary";
    default:
      return "badge-secondary";
  }
};

  return (
    <div className="customer-dashboard">
      <div className="section-header">
        <div className="section-header__title">
          <LayoutDashboard size={40} />
          <h1>Dashboard</h1>
        </div>
        <p className="section-header__subtitle">
          Welcome back, {user.name?.split(" ")[0] || "User"}! Here's an overview of your RFP activities.
        </p>
      </div>

      {/* At a Glance Section */}
      <section className="dashboard-section">
        <h2 className="section-title">At a Glance</h2>
        <Row className="g-4">
          {atAGlanceData.map((card, index) => {
            const Icon = card.icon;
            return (
              <Col xs={12} sm={6} lg={3} key={index}>
                <div className="glance-card">
                  <div className="glance-card__header">
                    <div className="glance-card__icon" style={{ background: `${card.color}20`, color: card.color }}>
                      <Icon size={24} />
                    </div>
                    <div className="glance-card__content">
                      <h3 className="glance-card__title">{card.title}</h3>
                      <p className="glance-card__value">{card.value}</p>
                      <p className="glance-card__description">{card.description}</p>
                    </div>
                  </div>
                  <button
                    className="glance-card__action"
                    onClick={() => handleGlanceAction(card.actionKey)}
                  >
                    {card.action}
                  </button>
                </div>
              </Col>
            );
          })}
        </Row>
      </section>

      {/* Quick Actions Section */}
      <section className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <Button className="quick-action-btn primary">
            <Plus size={18} className="me-2" />
            New Proposal
          </Button>
          <Button className="quick-action-btn secondary">
            <Upload size={18} className="me-2" />
            Import Document
          </Button>
          <Button className="quick-action-btn secondary">
            <Eye size={18} className="me-2" />
            View All Proposals
          </Button>
        </div>
      </section>

      {/* Your Analytics Section */}
      <section className="dashboard-section">
        <h2 className="section-title">Your Analytics</h2>
        <Row className="g-4">
          <Col xs={12} lg={6}>
            <div className="analytics-card">
              <h3 className="analytics-card__title">AI Credit Usage</h3>
              <p className="analytics-card__subtitle">Monthly AI credit consumption over the last 6 months</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={creditUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
                  <YAxis stroke="rgba(255,255,255,0.6)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a2e', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
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
          <Col xs={12} lg={6}>
            <div className="analytics-card">
              <h3 className="analytics-card__title">Proposal Success Rate</h3>
              <p className="analytics-card__subtitle">Breakdown of proposal success by category</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={proposalSuccessData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="category" stroke="rgba(255,255,255,0.6)" />
                  <YAxis stroke="rgba(255,255,255,0.6)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a2e', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="value" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>
        </Row>
      </section>

      {/* Activity & Proposals Section */}
      <section className="dashboard-section">
        <h2 className="section-title">Activity & Proposals</h2>
        <Row className="g-4">
          <Col xs={12} lg={6}>
            <div className="activity-card">
              <h3 className="activity-card__title">Recent Activity</h3>
              <p className="activity-card__subtitle">Your latest interactions and updates.</p>
              <div className="activity-list">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="activity-item">
                      <div className="activity-item__icon">
                        <Icon size={18} />
                      </div>
                      <div className="activity-item__content">
                        <p className="activity-item__text">{activity.text}</p>
                        <span className="activity-item__time">{activity.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <a href="#" className="activity-card__link">View All Activity</a>
            </div>
          </Col>
          <Col xs={12} lg={6}>
            <div className="proposals-card">
              <h3 className="proposals-card__title">Recent Proposals</h3>
              <p className="proposals-card__subtitle">A list of your most recently updated proposals.</p>
              <div className="proposals-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProposals.map((proposal, index) => (
                      <tr key={index}>
                        <td>{proposal.title}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(proposal.status)}`}>
                            {proposal.status}
                          </span>
                        </td>
                        <td>{proposal.lastUpdated}</td>
                        <td>{proposal.actions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="proposals-pagination">
                <span>
                  {startIndex + 1}-
                  {Math.min(endIndex, totalProposals)} of {totalProposals} proposals
                </span>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    Previous
                  </button>

                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default Home;
