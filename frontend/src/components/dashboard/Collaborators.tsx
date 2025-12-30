import { useState, useEffect } from "react";
import { Users, UserCheck, UserPlus, FileText, ArrowRight, X } from "lucide-react";
import { Alert, Spinner, Button } from "react-bootstrap";
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

interface PendingInvite {
  id: number;
  rfpId: number;
  rfpTitle: string;
  rfpDescription?: string;
  ownerName: string;
  ownerEmail: string;
  role: string;
  invitedAt: string;
}

const Collaborators = () => {
  const [rfps, setRfps] = useState<RFPWithCollaborators[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRFP, setSelectedRFP] = useState<RFPWithCollaborators | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRFPsWithCollaborators();
    fetchPendingInvites();
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

  const fetchPendingInvites = async () => {
    setLoadingInvites(true);
    try {
      const res = await api.get("/rfps/pending-invites");
      setPendingInvites(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch pending invites:", err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleAcceptInvite = async (rfpId: number, inviteId: number) => {
    setAcceptingId(inviteId);
    try {
      await api.post(`/rfps/${rfpId}/collaborators/accept`);
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      await fetchRFPsWithCollaborators(); // Refresh the list
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to accept invitation");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectInvite = async (rfpId: number, inviteId: number) => {
    if (!window.confirm("Are you sure you want to reject this invitation? This action cannot be undone.")) {
      return;
    }
    
    setRejectingId(inviteId);
    try {
      await api.post(`/rfps/${rfpId}/collaborators/reject`);
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to reject invitation");
    } finally {
      setRejectingId(null);
    }
  };

  const handleViewCollaboration = (rfp: RFPWithCollaborators) => {
    setSelectedRFP(rfp);
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


  if (selectedRFP) {
    // Transform RFPWithCollaborators to match CollaborationView's expected format
    const rfpData = {
      id: selectedRFP.id,
      title: selectedRFP.title,
      description: selectedRFP.description,
      status: selectedRFP.status,
      createdAt: selectedRFP.createdAt,
      collaborators: selectedRFP.collaborators,
    };
    return <CollaborationView rfp={rfpData as any} onClose={() => setSelectedRFP(null)} />;
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

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <div className="collaborators__pending-invites mb-4">
          <h3 className="mb-3">Pending Invitations</h3>
          <div className="collaborators__invite-list">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="collaborators__invite-card">
                <div className="collaborators__invite-info">
                  <FileText size={18} className="me-2" />
                  <div>
                    <h5>{invite.rfpTitle}</h5>
                    <p>
                      Invited by <strong>{invite.ownerName}</strong>
                    </p>
                    <p>
                      {new Date(invite.invitedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleAcceptInvite(invite.rfpId, invite.id)}
                    disabled={acceptingId === invite.id || rejectingId === invite.id}
                  >
                    {acceptingId === invite.id ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Accepting...
                      </>
                    ) : (
                      "Accept"
                    )}
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRejectInvite(invite.rfpId, invite.id)}
                    disabled={acceptingId === invite.id || rejectingId === invite.id}
                  >
                    {rejectingId === invite.id ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X size={14} className="me-1" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
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

      {/* RFPs with Collaborators */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : rfps.length === 0 ? (
        <div className="text-center py-5">
          <FileText size={48} className="mb-3" />
          <p className="mb-2">No RFPs with collaborators yet.</p>
          <p>Start by adding collaborators to your RFPs.</p>
        </div>
      ) : (
        <div className="collaborators__rfp-list">
          {rfps.map((rfp) => (
            <div key={rfp.id} className="collaborators__rfp-card" onClick={() => handleViewCollaboration(rfp)}>
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
                <Button variant="primary" size="sm">View Collaboration</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collaborators;
