// src/components/rfp/MyRFPs.tsx
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
  Users,
  Trash2,
  ArrowRight,
} from "lucide-react";
import api from "../../api/axios";
import Lottie from "lottie-react";
import emptyAnimation from "../../assets/lottie/empty.json";


interface MyRFPsProps {
  setActiveTab?: (tab: string) => void;
}

const MyRFPs: React.FC<MyRFPsProps> = ({ setActiveTab }) => {
  const [rfps, setRfps] = useState<any[]>([]);
  const [loadingRfps, setLoadingRfps] = useState(false);

  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisQuestions, setAnalysisQuestions] = useState<any[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<string>("");

  const [selectedRFP, setSelectedRFP] = useState<any>(null);
  const [rfpToDelete, setRfpToDelete] = useState<any>(null);

  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [collabLoading, setCollabLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "danger" } | null>(null);

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

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);


  // ---------------- Collaborators ----------------
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

      const newCollaborator = res.data.collaborator;
      setCollaborators((prev) => [...prev, newCollaborator]);
      setCollaboratorEmail("");
      await fetchRFPs();
      setToast({ message: "Collaborator added successfully", variant: "success" });
    } catch (err: any) {
      console.error("Failed to add collaborator:", err);
      setToast({ message: err?.response?.data?.error || "Failed to add collaborator", variant: "danger" });
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
      setToast({ message: "Collaborator removed", variant: "success" });
    } catch (err: any) {
      console.error("Failed to remove collaborator:", err);
      setToast({ message: err?.response?.data?.error || "Failed to remove collaborator", variant: "danger" });
    } finally {
      setRemovingId(null);
    }
  };

  // ---------------- Delete RFP ----------------
  const confirmDeleteRFP = (rfp: any) => {
    setRfpToDelete(rfp);
    setShowDeleteModal(true);
  };

  const handleDeleteRFP = async () => {
    if (!rfpToDelete) return;

    setDeletingId(rfpToDelete.id);
    setError(null);

    try {
      await api.delete(`/rfps/${rfpToDelete.id}`);
      setRfps((prev) => prev.filter((r) => r.id !== rfpToDelete.id));
      setToast({ message: "RFP deleted successfully", variant: "success" });
    } catch (err: any) {
      console.error("Failed to delete RFP:", err);
      setToast({ message: err?.response?.data?.error || "Failed to delete RFP", variant: "danger" });
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setRfpToDelete(null);
    }
  };

  // ---------------- Analysis (fixed) ----------------
  const handleViewAnalysis = async (rfp: any) => {
    setSelectedRFP(rfp);
    setAnalysisQuestions([]);
    setAnalysisSummary("");
    try {
      const res = await api.get(`/rfps/${rfp.id}/questions`);
      setAnalysisSummary(res.data.summary || rfp.description || "");
      const questions = (res.data.questions || []).map((q: any) => ({
        id: q.id,
        questionText: q.questionText ?? q.question ?? q.text ?? "",
        aiSuggestedAnswer: q.aiSuggestedAnswer ?? "",
        userEditedAnswer: q.userEditedAnswer ?? "",
        section: q.section ?? null,
      }));
      setAnalysisQuestions(questions);
      setShowAnalysisModal(true);
    } catch (err: any) {
      console.error("Failed to load analysis:", err?.response?.data || err?.message);
      setToast({ message: "Failed to load analysis", variant: "danger" });
    }
  };

  // ---------------- View File helper ----------------
  const handleViewFile = (rfp: any) => {
    const relativePath = rfp.filePath.replace("uploads/", "");
    window.open(`/files/${relativePath}`, "_blank");
 };


  return (
    <div className="myrfp-list">
      <div className="section-header">
        <div className="section-header__title">
          <FileText size={40} />
          <h1>My RFPs</h1>
        </div>
        <p className="section-header__subtitle">
          Track, manage, and revisit your submitted proposals.
        </p>
      </div>
      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
        >
          {error}
        </Alert>
      )}

      {loadingRfps ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : rfps.length === 0 ? (
        <div className="empty-lottie__animation">
          <Lottie animationData={emptyAnimation} loop={false} className="empty-lottie"/>
          <p>No RFPs uploaded yet</p>
          <p className="small text-secondary">Start your first RFP to analyze and collaborate.</p>
          {setActiveTab && (
            <Button              
              className="proposal-builder__button"
              onClick={() => setActiveTab("proposalbuilder")}
            >
              Let's Start <ArrowRight size={16} />
            </Button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {rfps.map((rfp) => (
            <div key={rfp.id} className="col-md-6 col-lg-4">
              <div className="my-proposal__card">
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

                <div className="small mb-3">
                  <Clock size={14} className="me-1" />
                  {new Date(rfp.createdAt).toLocaleString()}
                </div>

                <div className="d-flex flex-wrap justify-content-between gap-2 mt-3">
                  <Button variant="primary" size="sm" onClick={() => handleViewFile(rfp)}>
                    View File
                  </Button>

                  <Button variant="dark" size="sm" onClick={() => handleCollaboratorClick(rfp)}>
                    <Users size={14} className="me-1" /> Collaborators
                  </Button>

                  {rfp.status === "ANALYZED" && (
                    <Button variant="success" size="sm" onClick={() => handleViewAnalysis(rfp)}>
                      <CheckCircle2 size={14} className="me-1" /> View Analysis
                    </Button>
                  )}

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => confirmDeleteRFP(rfp)}
                    disabled={deletingId === rfp.id}
                  >
                    {deletingId === rfp.id ? (
                      <Spinner as="span" animation="border" size="sm" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Collaborators Modal */}
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
              <Form.Control
                type="email"
                placeholder="Enter collaborator's email"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
              />
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{rfpToDelete?.title}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteRFP} disabled={deletingId === rfpToDelete?.id}>
            {deletingId === rfpToDelete?.id ? <Spinner as="span" animation="border" size="sm" /> : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Analysis Modal (fixed) */}
      <Modal show={showAnalysisModal} onHide={() => setShowAnalysisModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Analysis — {selectedRFP?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Summary */}
          {(analysisSummary || selectedRFP?.description) ? (
            <div className="mb-4">
              <h6 className="mb-1">Summary</h6>
              <div className="p-3 rounded" style={{ background: "#f7f9fc", border: "1px solid #e5e9f0" }}>
                <p className="text-muted mb-0">{analysisSummary || selectedRFP?.description}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted">No summary available.</p>
          )}

          {/* Questions */}
          <h6 className="fw-semibold mb-2">AI-Generated Questions</h6>

          {analysisQuestions.length === 0 ? (
            <p className="text-muted">No questions found.</p>
          ) : (
            <ListGroup>
              {analysisQuestions.map((q) => (
                <ListGroup.Item key={q.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold">{q.questionText}</div>
                      {q.section && <div className="small text-muted">Section: {q.section}</div>}
                      {q.aiSuggestedAnswer && (
                        <div className="mt-2">
                          <strong>AI Suggested:</strong>
                          <div className="small text-muted">{q.aiSuggestedAnswer}</div>
                        </div>
                      )}
                      {q.userEditedAnswer && (
                        <div className="mt-2">
                          <strong>Your Answer:</strong>
                          <div className="small text-muted">{q.userEditedAnswer}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAnalysisModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1050,
            minWidth: "250px",
          }}
        >
          <Alert
            variant={toast.variant}
            dismissible
            onClose={() => setToast(null)}
            className="shadow-sm fade show"
          >
            {toast.message}
          </Alert>
        </div>
      )}

    </div>
  );
};

export default MyRFPs;
