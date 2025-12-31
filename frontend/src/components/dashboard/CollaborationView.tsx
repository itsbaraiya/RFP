import { useState, useEffect } from "react";
import { Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import {
  Share2,
  History,
  Send,
  Lightbulb,
  ArrowRight,
  X,
  FileQuestion,
} from "lucide-react";
import api from "../../api/axios";
import QuestionsManagement from "../rfp/QuestionsManagement";
import ErrorBoundary from "../rfp/ErrorBoundary";

interface Collaborator {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
}

interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

interface Activity {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  action: string;
  details?: string;
  createdAt: string;
}

interface RFPData {
  id: number;
  title: string;
  description?: string;
  content?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  lastEditor?: string;
  lastEditedAt?: string;
  collaborators: Collaborator[];
}

interface CollaborationViewProps {
  rfp: RFPData;
  onClose: () => void;
}

const CollaborationView: React.FC<CollaborationViewProps> = ({ rfp, onClose }) => {
  const [activeTab, setActiveTab] = useState<"questions" | "comments" | "activity">("questions");
  const [userId, setUserId] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from localStorage
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
      } else {
        setError("User not found. Please log in again.");
      }
    } catch (err) {
      console.error("Error parsing user:", err);
      setError("Failed to load user information.");
    }
    
    if (rfp?.id) {
      fetchComments();
      fetchActivities();
      generateAISuggestion();
    } else {
      setError("Invalid RFP data.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfp?.id]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/rfps/${rfp.id}/comments`);
      setComments(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch comments:", err);
      setComments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const generateAISuggestion = async () => {
    try {
      // TODO: Replace with actual AI suggestion API
      setAiSuggestion(
        "Based on the current content, consider adding a section on 'Project Timeline and Milestones' to strengthen your proposal's clarity and completeness. This will provide a clear roadmap for stakeholders."
      );
    } catch (err) {
      console.error("Failed to generate AI suggestion:", err);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/rfps/${rfp.id}/comments`, { content: newComment });
      // Add the new comment to the top of the list
      setComments([res.data, ...comments]);
      setNewComment("");
      // Refresh activities to show the new comment activity
      fetchActivities();
    } catch (err: any) {
      console.error("Failed to submit comment:", err);
      alert(err?.response?.data?.error || "Failed to add comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await api.get(`/rfps/${rfp.id}/activities`);
      setActivities(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch activities:", err);
      setActivities([]); // Set empty array on error
    } finally {
      setLoadingActivities(false);
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.action) {
      case "commented":
        return "added a comment";
      case "added_collaborator":
        return activity.details || "added a collaborator";
      case "accepted_invite":
        return "accepted the collaboration invitation";
      case "updated":
        return activity.details || "updated the document";
      case "status_changed":
        return "changed the status";
      default:
        return activity.action;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Safety checks
  if (!rfp || !rfp.id) {
    return (
      <div className="collaboration-view p-4">
        <Alert variant="danger">
          <strong>Error:</strong> Invalid RFP data. Please go back and try again.
        </Alert>
        <Button variant="outline-secondary" onClick={onClose} className="mt-3">
          Go Back
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collaboration-view p-4">
        <Alert variant="warning">
          <strong>Warning:</strong> {error}
        </Alert>
        <Button variant="outline-secondary" onClick={onClose} className="mt-3">
          Go Back
        </Button>
      </div>
    );
  }

  // Safety checks
  if (!rfp || !rfp.id) {
    return (
      <div className="collaboration-view p-4">
        <Alert variant="danger">
          <strong>Error:</strong> Invalid RFP data. Please go back and try again.
        </Alert>
        <Button variant="outline-secondary" onClick={onClose} className="mt-3">
          Go Back
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collaboration-view p-4">
        <Alert variant="warning">
          <strong>Warning:</strong> {error}
        </Alert>
        <Button variant="outline-secondary" onClick={onClose} className="mt-3">
          Go Back
        </Button>
      </div>
    );
  }

  const activeCollaborators = (rfp.collaborators || []).filter((c: any) => c.status === "ACCEPTED");

  return (
    <div className="collaboration-view">
      <Row className="g-0 h-100">
        {/* Left Side - Document Editor */}
        <Col xs={12} lg={8} className="collaboration-view__editor">
          <div className="document-editor">
            {/* Header */}
            <div className="document-editor__header">
              <div className="document-editor__title-section">
                <h2>{rfp.title}</h2>
                <div className="document-editor__meta">
                  <span>
                    {rfp.lastEditor || "John Doe"}, {formatTimeAgo(rfp.lastEditedAt || rfp.createdAt)}
                  </span>
                </div>
              </div>
              <div className="document-editor__actions">
                <Button variant="outline-secondary" size="sm">
                  <History size={16} className="me-2" />
                  View Versions
                </Button>
                <Button variant="primary" size="sm">
                  <Share2 size={16} className="me-2" />
                  Share
                </Button>
                <Button variant="link" onClick={onClose} className="ms-2">
                  <X size={20} />
                </Button>
              </div>
            </div>

            {/* Document Content */}
            <div className="document-editor__content">
              <div className="document-content">
                <h3># Executive Summary</h3>
                <p>
                  This Request for Proposal (RFP) outlines the requirements for upgrading our existing
                  cloud infrastructure to a next-generation solution that can scale with our growing
                  business needs.
                </p>

                <h3># Project Background</h3>
                <p>
                  Our current cloud infrastructure has served us well, but we're reaching limitations
                  in terms of scalability, performance, and cost efficiency. This project aims to
                  address these challenges while ensuring minimal disruption to ongoing operations.
                </p>

                <h3># Scope of Work</h3>
                <p>The selected vendor will be responsible for:</p>
                <ul>
                  <li>Infrastructure Assessment: Comprehensive evaluation of current setup</li>
                  <li>Solution Design: Architecture planning for the new infrastructure</li>
                  <li>Migration Strategy: Detailed plan for transitioning to the new system</li>
                  <li>Implementation: Deployment and configuration of the new infrastructure</li>
                  <li>Testing & Validation: Ensuring all systems function correctly</li>
                  <li>Training & Documentation: Knowledge transfer to our team</li>
                </ul>

                {rfp.description && (
                  <>
                    <h3># Additional Details</h3>
                    <p>{rfp.description}</p>
                  </>
                )}
              </div>

              {/* AI Assistant Suggestions */}
              {aiSuggestion && (
                <div className="ai-suggestion-box">
                  <div className="ai-suggestion-box__header">
                    <Lightbulb size={18} />
                    <span>AI Assistant Suggestions</span>
                  </div>
                  <p className="ai-suggestion-box__content">{aiSuggestion}</p>
                  <Button variant="link" className="ai-suggestion-box__action">
                    <ArrowRight size={16} className="me-1" />
                    Incorporate suggestion
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="document-editor__actions-bottom">
                <Button variant="outline-secondary">Save Draft</Button>
                <Button variant="success">Submit for Review</Button>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Side - Collaboration Hub */}
        <Col xs={12} lg={4} className="collaboration-view__hub">
          <div className="collaboration-hub">
            <div className="collaboration-hub__header">
              <h3>Collaboration Hub</h3>
            </div>

            {/* Active Collaborators */}
            <div className="collaboration-hub__collaborators">
              <p className="collaboration-hub__label">Active Collaborators:</p>
              <div className="collaborator-avatars">
                {activeCollaborators.slice(0, 4).map((collab) => (
                  <div key={collab.id} className="collaborator-avatar-small" title={collab.name}>
                    {collab.avatar ? (
                      <img src={collab.avatar} alt={collab.name} />
                    ) : (
                      <span>{getInitials(collab.name)}</span>
                    )}
                  </div>
                ))}
                {activeCollaborators.length > 4 && (
                  <div className="collaborator-avatar-small collaborator-avatar-more">
                    +{activeCollaborators.length - 4}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="collaboration-hub__tabs">
              <button
                className={`tab ${activeTab === "questions" ? "active" : ""}`}
                onClick={() => setActiveTab("questions")}
              >
                <FileQuestion size={16} className="me-1" />
                Questions
              </button>
              <button
                className={`tab ${activeTab === "comments" ? "active" : ""}`}
                onClick={() => setActiveTab("comments")}
              >
                Comments
              </button>
              <button
                className={`tab ${activeTab === "activity" ? "active" : ""}`}
                onClick={() => setActiveTab("activity")}
              >
                Activity
              </button>
            </div>

            {/* Questions Tab */}
            {activeTab === "questions" && userId ? (
              <div className="collaboration-hub__content" style={{ padding: 0, height: "100%", overflow: "auto" }}>
                <ErrorBoundary>
                  <QuestionsManagement rfpId={rfp.id} userId={userId} />
                </ErrorBoundary>
              </div>
            ) : activeTab === "questions" ? (
              <div className="collaboration-hub__content">
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                  <p className="mt-2">Loading...</p>
                </div>
              </div>
            ) : null}

            {activeTab === "comments" && (
              <div className="collaboration-hub__content">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4">
                    <p>No comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="comments-list">
                    {comments.map((comment) => {
                      const user = JSON.parse(localStorage.getItem("user") || "{}");
                      const isCurrentUser = comment.userId === user.id;
                      
                      return (
                        <div key={comment.id} className={`comment ${isCurrentUser ? "comment--own" : ""}`}>
                          <div className="comment__content">
                            <div className="comment__header">
                              <span className="comment__author">{comment.userName}</span>
                              <span className="comment__time">{formatTimeAgo(comment.createdAt)}</span>
                            </div>
                            <p className="comment__text">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="comment-input">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSubmitComment()}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="collaboration-hub__content">
                {loadingActivities ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-4">
                    <p>No activity yet.</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {activities.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-item__content">
                          <p className="activity-item__text">
                            <strong>{activity.userName}</strong> {getActivityText(activity)}
                          </p>
                          <span className="activity-item__time">{formatTimeAgo(activity.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CollaborationView;


