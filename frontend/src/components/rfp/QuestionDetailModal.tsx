//
// Question Detail Modal
// Full question editing with answer editor, sources, history, and assignments
//

import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Badge,
  Tab,
  Tabs,
  ListGroup,
  Alert,
  Spinner,
  Dropdown,
} from "react-bootstrap";
import {
  Edit,
  Save,
  X,
  User,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Send,
  Wand2,
} from "lucide-react";
import api from "../../api/axios";

interface Question {
  id: number;
  questionText: string;
  aiSuggestedAnswer?: string | null;
  userEditedAnswer?: string | null;
  finalAnswer?: string | null;
  section?: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  complianceStatus?: "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL" | "NOT_APPLICABLE" | null;
  confidenceScore?: number | null;
  assignedEditorId?: number | null;
  assignedReviewerId?: number | null;
  assignedEditor?: {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  assignedReviewer?: {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  answerSources?: Array<{
    id: number;
    sourceType: string;
    sourceName: string;
    relevanceScore?: number | null;
    metadata?: any;
  }>;
  wordCount?: number | null;
  rejectionReason?: string | null;
}

interface AnswerVersion {
  id: number;
  answerText: string;
  version: number;
  createdBy: number;
  createdAt: string;
  creator: {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

interface Collaborator {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface QuestionDetailModalProps {
  question: Question;
  rfpId: number;
  show: boolean;
  onHide: () => void;
  onUpdate: () => void;
}

const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  rfpId,
  show,
  onHide,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("answer");
  const [answer, setAnswer] = useState("");
  const [complianceStatus, setComplianceStatus] = useState<string>(question.complianceStatus || "");
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<AnswerVersion[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "danger" } | null>(null);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (show && question) {
      const currentAnswer = question.finalAnswer || question.userEditedAnswer || question.aiSuggestedAnswer || "";
      setAnswer(currentAnswer);
      setComplianceStatus(question.complianceStatus || "");
      setWordCount(currentAnswer.split(/\s+/).filter(Boolean).length);
      fetchVersions();
      fetchCollaborators();
    }
  }, [show, question]);

  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await api.get(`/rfps/${rfpId}/questions/${question.id}/history`);
      setVersions(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const res = await api.get(`/rfps/${rfpId}/collaborators`);
      setCollaborators(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch collaborators:", err);
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    setWordCount(value.split(/\s+/).filter(Boolean).length);
  };

  const handleSave = async () => {
    if (!answer.trim()) {
      setToast({
        message: "Please enter an answer before saving",
        variant: "danger",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/rfps/${rfpId}/questions/${question.id}`, {
        finalAnswer: answer.trim(),
        userEditedAnswer: answer.trim(),
      });
      
      // Update local state with the response
      if (response.data) {
        setAnswer(response.data.finalAnswer || response.data.userEditedAnswer || answer);
      }
      
      setToast({ message: "Answer saved successfully", variant: "success" });
      onUpdate(); // Refresh the questions list
      
      // Also refresh the question data
      const res = await api.get(`/rfps/${rfpId}/questions/${question.id}`);
      if (res.data) {
        const updatedAnswer = res.data.finalAnswer || res.data.userEditedAnswer || res.data.aiSuggestedAnswer || "";
        setAnswer(updatedAnswer);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setToast({
        message: err.response?.data?.error || err.message || "Failed to save answer",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.post(`/rfps/${rfpId}/questions/${question.id}/submit`);
      setToast({ message: "Answer submitted for review", variant: "success" });
      onUpdate();
      onHide();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to submit answer",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await api.post(`/rfps/${rfpId}/questions/${question.id}/approve`);
      setToast({ message: "Answer approved", variant: "success" });
      onUpdate();
      onHide();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to approve answer",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setSaving(true);
    try {
      await api.post(`/rfps/${rfpId}/questions/${question.id}/reject`, { reason });
      setToast({ message: "Answer rejected", variant: "success" });
      onUpdate();
      onHide();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to reject answer",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAnswer = async () => {
    setSaving(true);
    try {
      await api.post(`/rfps/${rfpId}/questions/${question.id}/generate`);
      setToast({ message: "Answer generated successfully", variant: "success" });
      onUpdate();
      // Refresh the question data
      const res = await api.get(`/rfps/${rfpId}/questions/${question.id}`);
      const updatedQuestion = res.data;
      setAnswer(updatedQuestion.finalAnswer || updatedQuestion.userEditedAnswer || updatedQuestion.aiSuggestedAnswer || "");
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to generate answer",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (type: "editor" | "reviewer", userId: number | null) => {
    try {
      await api.put(`/rfps/${rfpId}/questions/${question.id}/assign`, {
        [type === "editor" ? "editorId" : "reviewerId"]: userId,
      });
      setToast({ message: "Assignment updated", variant: "success" });
      onUpdate();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to update assignment",
        variant: "danger",
      });
    }
  };

  const handleUpdateCompliance = async (value: string) => {
    setComplianceStatus(value);
    try {
      await api.put(`/rfps/${rfpId}/questions/${question.id}/compliance`, {
        complianceStatus: value,
      });
      setToast({ message: "Compliance status updated", variant: "success" });
      onUpdate();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to update compliance",
        variant: "danger",
      });
      setComplianceStatus(question.complianceStatus || "");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary";
      case "SUBMITTED":
        return "warning";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getComplianceBadge = (status: string | null | undefined) => {
    switch (status) {
      case "COMPLIANT":
        return "success";
      case "NON_COMPLIANT":
        return "danger";
      case "PARTIAL":
        return "warning";
      case "NOT_APPLICABLE":
        return "secondary";
      default:
        return "light";
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Question Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Question Info */}
          <div className="mb-4">
            <h5>{question.questionText}</h5>
            <div className="d-flex gap-2 mt-2">
              {question.section && (
                <Badge bg="light" text="dark">
                  {question.section}
                </Badge>
              )}
              <Badge bg={getStatusBadge(question.status)}>{question.status}</Badge>
              {question.complianceStatus && (
                <Badge bg={getComplianceBadge(question.complianceStatus)}>
                  {question.complianceStatus}
                </Badge>
              )}
              {question.confidenceScore !== null && question.confidenceScore !== undefined && (
                <Badge bg="info">Confidence: {question.confidenceScore}%</Badge>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)} className="mb-3">
            {/* Answer Tab */}
            <Tab eventKey="answer" title="Answer">
              <div className="mt-3">
                {question.aiSuggestedAnswer && (
                  <Alert variant="info" className="mb-3">
                    <strong>AI Suggested Answer:</strong>
                    <div className="mt-2">{question.aiSuggestedAnswer}</div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="mt-2"
                      onClick={() => setAnswer(question.aiSuggestedAnswer || "")}
                    >
                      Use AI Answer
                    </Button>
                  </Alert>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Your Answer</strong>
                    {question.wordCount && (
                      <span className="text-muted ms-2">
                        (Target: {question.wordCount} words, Current: {wordCount} words)
                      </span>
                    )}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    value={answer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Enter your answer here..."
                  />
                  {question.wordCount && (
                    <Form.Text
                      className={
                        Math.abs(wordCount - question.wordCount) <= 5
                          ? "text-success"
                          : "text-warning"
                      }
                    >
                      {wordCount} / {question.wordCount} words
                    </Form.Text>
                  )}
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Spinner size="sm" /> : <Save size={16} className="me-1" />}
                    Save
                  </Button>
                  <Button variant="outline-primary" onClick={handleGenerateAnswer} disabled={saving}>
                    <Wand2 size={16} className="me-1" />
                    Generate Answer
                  </Button>
                  {question.status === "DRAFT" && (
                    <Button variant="warning" onClick={handleSubmit} disabled={saving || !answer}>
                      <Send size={16} className="me-1" />
                      Submit for Review
                    </Button>
                  )}
                  {question.status === "SUBMITTED" && (
                    <>
                      <Button variant="success" onClick={handleApprove} disabled={saving}>
                        <CheckCircle size={16} className="me-1" />
                        Approve
                      </Button>
                      <Button variant="danger" onClick={handleReject} disabled={saving}>
                        <XCircle size={16} className="me-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Tab>

            {/* Sources Tab */}
            <Tab eventKey="sources" title="Sources">
              <div className="mt-3">
                {question.answerSources && question.answerSources.length > 0 ? (
                  <ListGroup>
                    {question.answerSources.map((source) => (
                      <ListGroup.Item key={source.id}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{source.sourceName}</strong>
                            <div className="small text-muted mt-1">
                              Type: {source.sourceType}
                              {source.relevanceScore && (
                                <span className="ms-2">
                                  Relevance: {Math.round(source.relevanceScore * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <Alert variant="info">No sources available for this answer.</Alert>
                )}
              </div>
            </Tab>

            {/* History Tab */}
            <Tab eventKey="history" title="Version History">
              <div className="mt-3">
                {loadingVersions ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" />
                  </div>
                ) : versions.length > 0 ? (
                  <ListGroup>
                    {versions.map((version) => (
                      <ListGroup.Item key={version.id}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Badge bg="secondary">Version {version.version}</Badge>
                              <span className="small text-muted">
                                by {version.creator.name} • {new Date(version.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="small">{version.answerText}</div>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <Alert variant="info">No version history available.</Alert>
                )}
              </div>
            </Tab>

            {/* Assignment Tab */}
            <Tab eventKey="assignment" title="Assignment">
              <div className="mt-3">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Assign Editor</strong>
                  </Form.Label>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-primary" size="sm">
                      {question.assignedEditor
                        ? question.assignedEditor.name
                        : "Select Editor"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleAssign("editor", null)}>
                        None
                      </Dropdown.Item>
                      {collaborators.map((collab) => (
                        <Dropdown.Item
                          key={collab.id}
                          onClick={() => handleAssign("editor", collab.id)}
                        >
                          {collab.name} ({collab.email})
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Assign Reviewer</strong>
                  </Form.Label>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-success" size="sm">
                      {question.assignedReviewer
                        ? question.assignedReviewer.name
                        : "Select Reviewer"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleAssign("reviewer", null)}>
                        None
                      </Dropdown.Item>
                      {collaborators.map((collab) => (
                        <Dropdown.Item
                          key={collab.id}
                          onClick={() => handleAssign("reviewer", collab.id)}
                        >
                          {collab.name} ({collab.email})
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </Form.Group>
              </div>
            </Tab>

            {/* Compliance Tab */}
            <Tab eventKey="compliance" title="Compliance">
              <div className="mt-3">
                <Form.Group>
                  <Form.Label>
                    <strong>Compliance Status</strong>
                  </Form.Label>
                  <Form.Select
                    value={complianceStatus}
                    onChange={(e) => handleUpdateCompliance(e.target.value)}
                  >
                    <option value="">Not Set</option>
                    <option value="COMPLIANT">Compliant</option>
                    <option value="NON_COMPLIANT">Non-Compliant</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="NOT_APPLICABLE">Not Applicable</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Mark this question's compliance status based on the answer provided.
                  </Form.Text>
                </Form.Group>

                {question.rejectionReason && (
                  <Alert variant="warning" className="mt-3">
                    <strong>Rejection Reason:</strong>
                    <div className="mt-2">{question.rejectionReason}</div>
                  </Alert>
                )}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1051,
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
    </>
  );
};

export default QuestionDetailModal;

