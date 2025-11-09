
//
//  My RFPs
//

import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Badge,
  Form,
  ListGroup,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FileText,
  Clock,
  CheckCircle2,
  UploadCloud,
  Users,
  Trash2,
} from "lucide-react";
import api from "../../api/axios";
import RFPUpload from "../RFPUpload";

const MyRFPs: React.FC = () => {
  const [rfps, setRfps] = useState<any[]>([]);
  const [loadingRfps, setLoadingRfps] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);

  const [selectedRFP, setSelectedRFP] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [collabLoading, setCollabLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserId(parsedUser.id);
    }
  }, []);
  
  const fetchRFPs = async () => {
    setLoadingRfps(true);
    setError(null);
    try {
      const res = await api.get("/rfps");
      const filteredRfps = userId ? res.data.filter((r: any) => r.userId === userId) : [];
      setRfps(filteredRfps);
    } catch (err: any) {
      console.error("Failed to load RFPs:", err);
      setError("Failed to load RFPs.");
    } finally {
      setLoadingRfps(false);
    }
  };

  useEffect(() => {
    if (userId !== null) fetchRFPs();    
  }, [userId]);
  
  const handleCollaboratorClick = async (rfp: any) => {
    setSelectedRFP(rfp);
    setShowCollaboratorModal(true);
    setCollaborators([]);
    setCollabLoading(true);
    setError(null);
    try {      
      const res = await api.get(`/rfps/${rfp.id}/collaborators`);
      setCollaborators(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch collaborators:", err);
      setError(err?.response?.data?.error || "Failed to fetch collaborators");
      setCollaborators([]);
    } finally {
      setCollabLoading(false);
    }
  };
  
  const handleAddCollaborator = async () => {
    if (!collaboratorEmail.trim()) return;
    setAdding(true);
    setError(null);

    try {
      const res = await api.post(`/rfps/${selectedRFP.id}/collaborators`, {
        email: collaboratorEmail.trim(),
      });

      // Option A: optimistic update from response
      const newCollaborator = res.data.collaborator;
      setCollaborators((prev) => [...prev, newCollaborator]);
      setCollaboratorEmail("");

      // Optionally refresh RFP list to show updated data
      await fetchRFPs();
    } catch (err: any) {
      console.error("Failed to add collaborator:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to add collaborator");
    } finally {
      setAdding(false);
    }
  };
  
  const handleRemoveCollaborator = async (userToRemoveId: number) => {
    if (!selectedRFP) return;
    setRemovingId(userToRemoveId);
    setError(null);
    try {
      await api.delete(`/rfps/${selectedRFP.id}/collaborators/${userToRemoveId}`);      
      setCollaborators((prev) => prev.filter((c) => c.id !== userToRemoveId));      
      await fetchRFPs();
    } catch (err: any) {
      console.error("Failed to remove collaborator:", err);
      setError(err?.response?.data?.error || "Failed to remove collaborator");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="p-4">      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-semibold mb-1">My RFPs</h2>
          <p className="text-muted small mb-0">Manage and collaborate on your uploaded RFPs</p>
        </div>

        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          onClick={() => setShowUploadModal(true)}
          style={{
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
          }}
        >
          <UploadCloud size={18} /> Create RFP
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loadingRfps ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : rfps.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FileText size={48} className="mb-3 opacity-50" />
          <p className="fs-5">No RFPs uploaded yet</p>
          <p className="small text-secondary">Start by uploading your first RFP to analyze and collaborate.</p>
        </div>
      ) : (
        <div className="row g-4">
          {rfps.map((rfp) => (
            <div key={rfp.id} className="col-md-6 col-lg-4">
              <div
                className="shadow-sm p-4 bg-white rounded-4 h-100"
                style={{ border: "1px solid #e5e7eb", transition: "all 0.3s ease" }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <FileText size={22} color="#2563eb" />
                    <h6 className="mb-0 fw-semibold">{rfp.title}</h6>
                  </div>
                  <Badge
                    bg={rfp.status === "ANALYZED" ? "success" : rfp.status === "PENDING" ? "secondary" : "info"}
                    pill
                    className="text-uppercase"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {rfp.status}
                  </Badge>
                </div>

                <div className="small text-muted mb-3">
                  <Clock size={14} className="me-1" />
                  {new Date(rfp.createdAt).toLocaleString()}
                </div>

                <div className="d-flex flex-wrap justify-content-between gap-2 mt-3">
                  <Button variant="outline-primary" size="sm" onClick={() => window.open(`${BASE_URL}${rfp.filePath}`, "_blank")}>
                    View File
                  </Button>

                  <Button variant="outline-dark" size="sm" onClick={() => handleCollaboratorClick(rfp)}>
                    <Users size={14} className="me-1" /> Collaborators
                  </Button>

                  {rfp.status === "ANALYZED" && (
                    <Button variant="success" size="sm">
                      <CheckCircle2 size={14} className="me-1" /> View Analysis
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Create New RFP</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <RFPUpload
            onSuccess={async () => {
              setShowUploadModal(false);
              await fetchRFPs();
            }}
          />
        </Modal.Body>
      </Modal>
      
      <Modal show={showCollaboratorModal} onHide={() => setShowCollaboratorModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Collaborators — <span className="text-primary">{selectedRFP?.title}</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {collabLoading ? (
            <div className="text-center py-3">
              <Spinner />
            </div>
          ) : collaborators.length > 0 ? (
            <ListGroup className="mb-3">
              {collaborators.map((col) => (
                <ListGroup.Item key={col.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{col.name || col.email}</strong>
                    <div className="small text-muted">{col.email}</div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="light" text="dark">
                      {col.role || "Collaborator"}
                    </Badge>
                    
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(col.id)}
                      disabled={removingId === col.id}
                      title="Remove collaborator"
                    >
                      {removingId === col.id ? <Spinner as="span" animation="border" size="sm" /> : <Trash2 size={14} />}
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p className="text-muted text-center mb-3">No collaborators added yet.</p>
          )}

          <Form>
            <Form.Group>
              <Form.Label>Add Collaborator</Form.Label>
              <Form.Control type="email" placeholder="Enter collaborator's email" value={collaboratorEmail} onChange={(e) => setCollaboratorEmail(e.target.value)} />
            </Form.Group>

            <Button variant="primary" className="mt-3 w-100" onClick={handleAddCollaborator} disabled={adding}>
              {adding ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" /> Adding...
                </>
              ) : (
                "Add Collaborator"
              )}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MyRFPs;
