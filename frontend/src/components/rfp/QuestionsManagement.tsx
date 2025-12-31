//
// Questions Management Component
// Enhanced question management with workflow, compliance, and assignments
//

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Badge,
  Form,
  Modal,
  Dropdown,
  ProgressBar,
  Alert,
  Spinner,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import {
  Edit,
  CheckCircle,
  XCircle,
  Send,
  User,
  FileText,
  MessageSquare,
  Search,
  Filter,
  Download,
  Wand2,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";
import ErrorBoundary from "./ErrorBoundary";

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
  }>;
  _count?: {
    answerVersions: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface QuestionsManagementProps {
  rfpId: number;
  userId: number;
}

const QuestionsManagement: React.FC<QuestionsManagementProps> = ({ rfpId, userId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [complianceFilter, setComplianceFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "danger" } | null>(null);

  // Fetch questions
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (complianceFilter !== "all") params.complianceStatus = complianceFilter;
      if (sectionFilter !== "all") params.section = sectionFilter;

      const res = await api.get(`/rfps/${rfpId}/questions`, { params });
      
      // Handle both old format { summary, questions } and new format (array)
      let questionsData = [];
      if (Array.isArray(res.data)) {
        questionsData = res.data;
      } else if (res.data && res.data.questions) {
        questionsData = res.data.questions;
      } else if (res.data && Array.isArray(res.data)) {
        questionsData = res.data;
      }
      
      // Ensure all questions have required fields with defaults
      questionsData = questionsData.map((q: any) => ({
        ...q,
        status: q.status || "DRAFT",
        complianceStatus: q.complianceStatus || null,
        confidenceScore: q.confidenceScore || null,
        finalAnswer: q.finalAnswer || null,
        assignedEditor: q.assignedEditor || null,
        assignedReviewer: q.assignedReviewer || null,
        answerSources: q.answerSources || [],
        _count: q._count || { answerVersions: 0 },
      }));
      
      setQuestions(questionsData);
    } catch (err: any) {
      console.error("Failed to fetch questions:", err);
      setError(err.response?.data?.error || "Failed to load questions");
      setQuestions([]); // Set empty array on error to prevent crashes
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rfpId && userId) {
      // Fetch immediately and also retry after a delay to handle analysis completion
      fetchQuestions();
      const timer = setTimeout(() => {
        fetchQuestions();
      }, 2000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfpId, userId]);
  
  // Refetch when filters change
  useEffect(() => {
    if (rfpId && userId) {
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, complianceFilter, sectionFilter]);

  // Filter questions based on search
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      searchTerm === "" ||
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.section?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get unique sections for filter
  const sections = Array.from(new Set(questions.map((q) => q.section).filter(Boolean)));

  // Toggle row expansion
  const toggleRow = (questionId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedRows(newExpanded);
  };

  // Toggle question selection
  const toggleSelection = (questionId: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  // Get status badge variant
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

  // Get compliance badge variant
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

  // Get confidence color
  const getConfidenceColor = (score: number | null | undefined) => {
    if (!score) return "#6c757d";
    if (score >= 80) return "#28a745";
    if (score >= 60) return "#ffc107";
    return "#dc3545";
  };

  // Handle submit answer
  const handleSubmit = async (questionId: number) => {
    try {
      await api.post(`/rfps/${rfpId}/questions/${questionId}/submit`);
      setToast({ message: "Answer submitted for review", variant: "success" });
      fetchQuestions();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to submit answer",
        variant: "danger",
      });
    }
  };

  // Handle approve answer
  const handleApprove = async (questionId: number) => {
    try {
      await api.post(`/rfps/${rfpId}/questions/${questionId}/approve`);
      setToast({ message: "Answer approved", variant: "success" });
      fetchQuestions();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to approve answer",
        variant: "danger",
      });
    }
  };

  // Handle reject answer
  const handleReject = async (questionId: number, reason: string) => {
    try {
      await api.post(`/rfps/${rfpId}/questions/${questionId}/reject`, { reason });
      setToast({ message: "Answer rejected", variant: "success" });
      fetchQuestions();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to reject answer",
        variant: "danger",
      });
    }
  };

  // Handle update compliance
  const handleUpdateCompliance = async (questionId: number, complianceStatus: string) => {
    try {
      await api.put(`/rfps/${rfpId}/questions/${questionId}/compliance`, { complianceStatus });
      setToast({ message: "Compliance status updated", variant: "success" });
      fetchQuestions();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to update compliance",
        variant: "danger",
      });
    }
  };

  // Handle generate answer
  const handleGenerateAnswer = async (questionId: number) => {
    setGenerating(true);
    try {
      await api.post(`/rfps/${rfpId}/questions/${questionId}/generate`);
      setToast({ message: "Answer generated successfully", variant: "success" });
      fetchQuestions();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to generate answer",
        variant: "danger",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Handle bulk generate
  const handleBulkGenerate = async () => {
    if (selectedQuestions.size === 0) {
      setToast({ message: "Please select questions to generate answers", variant: "danger" });
      return;
    }

    setGenerating(true);
    try {
      await api.post(`/rfps/${rfpId}/questions/generate-answers`, {
        questionIds: Array.from(selectedQuestions),
      });
      setToast({
        message: `Generated answers for ${selectedQuestions.size} questions`,
        variant: "success",
      });
      setSelectedQuestions(new Set());
      fetchQuestions();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || "Failed to generate answers",
        variant: "danger",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Open question detail modal
  const openDetailModal = (question: Question) => {
    setSelectedQuestion(question);
    setShowDetailModal(true);
  };

  // Refresh questions after update
  const handleQuestionUpdate = () => {
    fetchQuestions();
  };

  // Get current answer text
  const getAnswerText = (question: Question) => {
    return question.finalAnswer || question.userEditedAnswer || question.aiSuggestedAnswer || "";
  };

  // Calculate completion stats
  const stats = {
    total: questions.length,
    draft: questions.filter((q) => q.status === "DRAFT").length,
    submitted: questions.filter((q) => q.status === "SUBMITTED").length,
    approved: questions.filter((q) => q.status === "APPROVED").length,
    compliant: questions.filter((q) => q.complianceStatus === "COMPLIANT").length,
  };

  const completionPercent = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;

  // Safety check
  if (!rfpId || !userId) {
    return (
      <div className="questions-management p-4">
        <Alert variant="warning">
          Missing required information. Please refresh the page.
        </Alert>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="questions-management">
      {/* Header with Stats */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Questions Management</h4>
          <p className="mb-0">
            {stats.total} questions • {stats.approved} approved ({completionPercent.toFixed(0)}%)
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => fetchQuestions()}
            disabled={loading}
            title="Refresh questions"
          >
            <RefreshCw size={16} className="me-1" />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkGenerate}
            disabled={selectedQuestions.size === 0 || generating}
          >
            <Wand2 size={16} className="me-1" />
            Generate Answers ({selectedQuestions.size})
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        now={completionPercent}
        variant="success"
        className="mb-3"
        style={{ height: "8px" }}
      />

      {/* Filters and Search */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <InputGroup style={{ maxWidth: "300px" }}>
          <InputGroup.Text>
            <Search size={16} />
          </InputGroup.Text>
          <FormControl
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <Form.Select
          style={{ width: "150px" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Form.Select>

        <Form.Select
          style={{ width: "180px" }}
          value={complianceFilter}
          onChange={(e) => setComplianceFilter(e.target.value)}
        >
          <option value="all">All Compliance</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="NON_COMPLIANT">Non-Compliant</option>
          <option value="PARTIAL">Partial</option>
          <option value="NOT_APPLICABLE">N/A</option>
        </Form.Select>

        {sections.length > 0 && (
          <Form.Select
            style={{ width: "150px" }}
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
          >
            <option value="all">All Sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </Form.Select>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Questions Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading questions...</p>
        </div>
      ) : filteredQuestions.length === 0 && questions.length === 0 ? (
        <Alert variant="warning">
          <strong>No questions found.</strong>
          <br />
          Questions should appear here after the RFP is analyzed. 
          If you just analyzed the document, please wait a moment and click "Refresh" above.
          <br />
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="mt-2"
            onClick={() => fetchQuestions()}
          >
            Refresh Now
          </Button>
        </Alert>
      ) : filteredQuestions.length === 0 ? (
        <Alert variant="info">No questions match your current filters. Try adjusting the filters above.</Alert>
      ) : (
        <div className="table-responsive">
          <Table hover>
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <Form.Check
                    type="checkbox"
                    checked={selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0}
                    onChange={selectAll}
                  />
                </th>
                <th style={{ width: "40px" }}></th>
                <th>Requirement</th>
                <th>Response</th>
                <th>Compliance</th>
                <th>Trust & Workflow</th>
                <th style={{ width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question) => {
                const isExpanded = expandedRows.has(question.id);
                const isSelected = selectedQuestions.has(question.id);
                const answerText = getAnswerText(question);

                return (
                  <React.Fragment key={question.id}>
                    <tr>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(question.id)}
                        />
                      </td>
                      <td>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => toggleRow(question.id)}
                          className="p-0"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                      </td>
                      <td>
                        <div>
                          <div className="fw-semibold">{question.questionText}</div>
                          {question.section && (
                            <Badge bg="light" text="dark" className="me-1">
                              {question.section}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: "400px" }}>
                          {answerText ? (
                            <>
                              {question.aiSuggestedAnswer && !question.finalAnswer && (
                                <div className="small text-muted mb-1">
                                  <strong>AI Draft:</strong> {question.aiSuggestedAnswer.substring(0, 100)}
                                  {question.aiSuggestedAnswer.length > 100 && "..."}
                                </div>
                              )}
                              {question.finalAnswer && (
                                <div className="small">{question.finalAnswer.substring(0, 150)}...</div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">No answer yet</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={question.complianceStatus || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                              handleUpdateCompliance(question.id, value);
                            }
                          }}
                          style={{ width: "150px" }}
                        >
                          <option value="">Not Set</option>
                          <option value="COMPLIANT">Compliant</option>
                          <option value="NON_COMPLIANT">Non-Compliant</option>
                          <option value="PARTIAL">Partial</option>
                          <option value="NOT_APPLICABLE">N/A</option>
                        </Form.Select>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          {question.confidenceScore !== null && question.confidenceScore !== undefined && (
                            <div className="d-flex align-items-center gap-1">
                              <div
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  backgroundColor: getConfidenceColor(question.confidenceScore),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                }}
                              >
                                {question.confidenceScore}
                              </div>
                              <span className="small">Confidence</span>
                            </div>
                          )}
                          {question.assignedEditor && (
                            <Badge bg="primary" className="d-inline-flex align-items-center">
                              <User size={12} className="me-1" />
                              Editor: {question.assignedEditor.name}
                            </Badge>
                          )}
                          {question.assignedReviewer && (
                            <Badge bg="success" className="d-inline-flex align-items-center">
                              <User size={12} className="me-1" />
                              Reviewer: {question.assignedReviewer.name}
                            </Badge>
                          )}
                          <Badge bg={getStatusBadge(question.status || "DRAFT")}>{question.status || "DRAFT"}</Badge>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openDetailModal(question)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </Button>
                          {question.status === "DRAFT" && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleSubmit(question.id)}
                              title="Submit for Review"
                            >
                              <Send size={14} />
                            </Button>
                          )}
                          {question.status === "SUBMITTED" && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleApprove(question.id)}
                                title="Approve"
                              >
                                <CheckCircle size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  const reason = prompt("Rejection reason:");
                                  if (reason) handleReject(question.id, reason);
                                }}
                                title="Reject"
                              >
                                <XCircle size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-light">
                          <div className="p-3">
                            <div className="row">
                              <div className="col-md-6">
                                <h6>Answer Details</h6>
                                <div className="mb-2">
                                  <strong>AI Suggested:</strong>
                                  <div className="small text-muted">{question.aiSuggestedAnswer || "N/A"}</div>
                                </div>
                                <div className="mb-2">
                                  <strong>Final Answer:</strong>
                                  <div className="small">{question.finalAnswer || "N/A"}</div>
                                </div>
                                {question.answerSources && question.answerSources.length > 0 && (
                                  <div className="mb-2">
                                    <strong>Sources:</strong>
                                    <ul className="small">
                                      {question.answerSources.map((source) => (
                                        <li key={source.id}>
                                          {source.sourceName}
                                          {source.relevanceScore && (
                                            <span className="text-muted">
                                              {" "}
                                              ({Math.round(source.relevanceScore * 100)}%)
                                            </span>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div className="col-md-6">
                                <h6>Workflow</h6>
                                <div className="mb-2">
                                  <strong>Status:</strong> <Badge bg={getStatusBadge(question.status)}>{question.status}</Badge>
                                </div>
                                <div className="mb-2">
                                  <strong>Compliance:</strong>{" "}
                                  <Badge bg={getComplianceBadge(question.complianceStatus)}>
                                    {question.complianceStatus || "Not Set"}
                                  </Badge>
                                </div>
                                <div className="mb-2">
                                  <strong>Confidence Score:</strong> {question.confidenceScore || "N/A"}
                                </div>
                                {question._count && question._count.answerVersions > 0 && (
                                  <div className="mb-2">
                                    <strong>Versions:</strong> {question._count.answerVersions}
                                  </div>
                                )}
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleGenerateAnswer(question.id)}
                                  disabled={generating}
                                  className="mt-2"
                                >
                                  <Wand2 size={14} className="me-1" />
                                  Generate Answer
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

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

      {/* Question Detail Modal - Will be created next */}
      {showDetailModal && selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          rfpId={rfpId}
          show={showDetailModal}
          onHide={() => {
            setShowDetailModal(false);
            setSelectedQuestion(null);
          }}
          onUpdate={() => {
            // Refresh questions list immediately
            fetchQuestions();
          }}
        />
      )}
      </div>
    </ErrorBoundary>
  );
};

import QuestionDetailModal from "./QuestionDetailModal";

export default QuestionsManagement;

