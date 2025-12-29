import { useState, useEffect } from "react";
import { Users, UserCheck, UserPlus, FileText, ArrowRight } from "lucide-react";
import { Alert, Spinner } from "react-bootstrap";
import api from "../../api/axios";
import CollaborationView from "./CollaborationView";

interface Collaborator {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
}

interface RFPWithCollaborators {
  id: number;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  collaborators: Collaborator[];
}

const Collaborators = () => {
  const [rfps, setRfps] = useState<RFPWithCollaborators[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRFP, setSelectedRFP] = useState<RFPWithCollaborators | null>(null);

  useEffect(() => {
    fetchRFPsWithCollaborators();
  }, []);

  const fetchRFPsWithCollaborators = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/rfps/with-collaborators");
      setRfps(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch RFPs with collaborators:", err);
      setError(err?.response?.data?.error || "Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCollaboration = (rfp: RFPWithCollaborators) => {
    setSelectedRFP(rfp);
  };

  const handleCloseCollaboration = () => {
    setSelectedRFP(null);
  };

  const totalCollaborators = rfps.reduce((sum, rfp) => sum + rfp.collaborators.length, 0);
  const activeCollaborators = rfps.reduce(
    (sum, rfp) => sum + rfp.collaborators.filter((c) => c.status === "ACCEPTED").length,
    0
  );
  const pendingCollaborators = rfps.reduce(
    (sum, rfp) => sum + rfp.collaborators.filter((c) => c.status === "INVITED").length,
    0
  );


  // Show collaboration view if RFP is selected
  if (selectedRFP) {
    return (
      <CollaborationView
        rfp={{
          ...selectedRFP,
          lastEditor: "John Doe",
          lastEditedAt: selectedRFP.createdAt,
        }}
        onClose={handleCloseCollaboration}
      />
    );
  }

  return (
    <div className="dashboard-page collaborators">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-header__title">
          <Users size={22} />
          <h1>Team & Collaborators</h1>
        </div>
        <p className="section-header__subtitle">
          Manage collaborators for each RFP document. Click on an RFP to open collaboration view.
        </p>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="collaborators__stats">
        <div className="stat-card">
          <FileText />
          <div>
            <h3>{rfps.length}</h3>
            <p>Total RFPs</p>
          </div>
        </div>
        <div className="stat-card">
          <Users />
          <div>
            <h3>{totalCollaborators}</h3>
            <p>Total Collaborators</p>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck />
          <div>
            <h3>{activeCollaborators}</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="stat-card">
          <UserPlus />
          <div>
            <h3>{pendingCollaborators}</h3>
            <p>Pending</p>
          </div>
        </div>
      </div>

      {/* RFPs List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : rfps.length === 0 ? (
        <div className="text-center py-5">
          <FileText size={48} className="text-muted mb-3" />
          <p className="text-muted">No RFPs with collaborators yet.</p>
          <p className="text-muted small">Start by adding collaborators to your RFPs.</p>
        </div>
      ) : (
        <div className="collaborators__rfp-list">
          {rfps.map((rfp) => (
            <div
              key={rfp.id}
              className="collaborators__rfp-card"
              onClick={() => handleOpenCollaboration(rfp)}
            >
              <div className="collaborators__rfp-header">
                <div className="collaborators__rfp-info">
                  <FileText size={20} className="me-2" />
                  <div>
                    <h4>{rfp.title}</h4>
                    <p>
                      {rfp.collaborators.length} collaborator{rfp.collaborators.length !== 1 ? "s" : ""} •{" "}
                      {new Date(rfp.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="collaborators__rfp-actions">
                  <span className={`badge bg-${rfp.status === "ANALYZED" ? "success" : "secondary"}`}>
                    {rfp.status}
                  </span>
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collaborators;
