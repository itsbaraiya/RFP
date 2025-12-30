// 
// Dashboard Home
// 

import { useState, useEffect } from "react";
import { Row, Col, Button, Spinner } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard } from "lucide-react";
import api from "../../api/axios";

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
  const [rfps, setRfps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchRFPs();
    }
  }, [user?.id]);

  const fetchRFPs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/rfps");
      const userRfps = res.data.filter((r: any) => r.userId === user?.id);
      setRfps(userRfps);
    } catch (err) {
      console.error("Failed to fetch RFPs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) return <Loader />;
  if (!user) return <div className="no-user">No user found. Please log in.</div>;

  // Calculate stats from real data
  const draftCount = rfps.filter((r: any) => r.status === "DRAFT").length;
  const analyzedCount = rfps.filter((r: any) => r.status === "ANALYZED").length;
  const completedCount = rfps.filter((r: any) => r.status === "COMPLETED").length;

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
    value: draftCount.toString(),
    description: "Proposals currently in draft",
    icon: FileText,
    action: "View Drafts",
    actionKey: "draft",
    color: "#3b82f6",
  },
  {
    title: "Analyzed Proposals",
    value: analyzedCount.toString(),
    description: "Proposals analyzed and ready",
    icon: Send,
    action: "View Analyzed",
    actionKey: "analyzed",
    color: "#8b5cf6",
  },
  {
    title: "Completed Proposals",
    value: completedCount.toString(),
    description: "Proposals completed",
    icon: CheckCircle2,
    action: "View Completed",
    actionKey: "completed",
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

  // Use real RFP data
  const recentProposals = rfps
    .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .map((rfp: any) => ({
      id: rfp.id,
      title: rfp.title,
      status: rfp.status,
      lastUpdated: new Date(rfp.updatedAt || rfp.createdAt).toLocaleDateString(),
      actions: "",
    }));

  const totalProposals = recentProposals.length;
  const totalPages = Math.ceil(totalProposals / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedProposals = recentProposals.slice(startIndex, endIndex);

  const handleGlanceAction = (key: string) => {
    switch (key) {
      case "credits":
        window.location.href = "/dashboard?tab=credits";
        break;

      case "draft":
        window.location.href = "/dashboard?tab=myrfps";
        break;

      case "analyzed":
        window.location.href = "/dashboard?tab=myrfps";
        break;

      case "completed":
        window.location.href = "/dashboard?tab=myrfps";
        break;

      default:
        break;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "new-proposal":
        window.location.href = "/dashboard?tab=proposalbuilder";
        break;
      case "import-document":
        window.location.href = "/dashboard?tab=proposalbuilder";
        break;
      case "view-all":
        window.location.href = "/dashboard?tab=myrfps";
        break;
      default:
        break;
    }
  };

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "badge-success";
    case "ANALYZED":
      return "badge-primary";
    case "IN_PROGRESS":
      return "badge-info";
    case "PENDING":
      return "badge-warning";
    case "DRAFT":
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
          <Button 
            className="quick-action-btn primary"
            onClick={() => handleQuickAction("new-proposal")}
          >
            <Plus size={18} className="me-2" />
            New Proposal
          </Button>
          <Button 
            className="quick-action-btn secondary"
            onClick={() => handleQuickAction("import-document")}
          >
            <Upload size={18} className="me-2" />
            Import Document
          </Button>
          <Button 
            className="quick-action-btn secondary"
            onClick={() => handleQuickAction("view-all")}
          >
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
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : (
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
                      {paginatedProposals.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted">
                            No proposals yet. Create your first RFP!
                          </td>
                        </tr>
                      ) : (
                        paginatedProposals.map((proposal, index) => (
                          <tr key={proposal.id || index}>
                            <td>{proposal.title}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(proposal.status)}`}>
                                {proposal.status}
                              </span>
                            </td>
                            <td>{proposal.lastUpdated}</td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => window.location.href = "/dashboard?tab=myrfps"}
                                className="p-0"
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
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
