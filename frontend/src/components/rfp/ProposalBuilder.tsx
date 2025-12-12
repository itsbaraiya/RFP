import { useState } from "react";
import { Row, Col, Button, Form, Alert, Spinner, Modal } from "react-bootstrap";
import { CheckCircle2, Send, Paperclip, Download, Eye, Upload, Sparkles, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import RFPUpload from "../RFPUpload";
import jsPDF from "jspdf";

const ProposalBuilder: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [creationType, setCreationType] = useState<"upload" | "ai" | "">("");
  const [fileData, setFileData] = useState<{ id: number; filePath: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    title: "",
    description: "",
    category: "",
    // Step 2: AI Prompt (if AI generation chosen)
    aiPrompt: "",
  });
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your AI Assistant. How can I help you with your proposal today?",
    },
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Basic Information",
      description: "Enter RFP title, description, and category.",
      completed: currentStep > 1,
    },
    {
      id: 2,
      title: "Choose Method",
      description: "Select how you want to create your RFP.",
      completed: currentStep > 2,
    },
    {
      id: 3,
      title: "Upload or Generate",
      description: creationType === "upload" ? "Upload your RFP document." : "Describe your requirements for AI generation.",
      completed: currentStep > 3,
    },
    {
      id: 4,
      title: "Review & Submit",
      description: "Review and submit your RFP.",
      completed: false,
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileSelect = (rfp: any) => {
    setFormData((prev) => ({
      ...prev,
      title: rfp.title || prev.title,
      description: rfp.description || prev.description,
      category: rfp.category || prev.category,
    }));
    setFileData({
      id: rfp.id,
      filePath: rfp.filePath,
    });
    setCreationType("upload");
    setCurrentStep(4);
  };

  const handleSubmit = async () => {
    if (!creationType) {
      setError("Please select a creation method.");
      return;
    }
    if (creationType === "upload" && !fileData) {
      setError("Please upload a file.");
      return;
    }
    if (creationType === "ai" && !formData.aiPrompt) {
      setError("Please enter a prompt for AI generation.");
      return;
    }
    if (!formData.title || !formData.description) {
      setError("Please fill in title and description.");
      return;
    }

    setError("");
    setLoading(true);
    setMessage("Processing your RFP...");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required.");

      if (creationType === "upload" && fileData) {
        await api.post(
          `/rfps/${fileData.id}/analyze`,
          {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            filePath: fileData.filePath,
          }
        );
        setMessage("✅ RFP uploaded and analyzed successfully!");
      } else if (creationType === "ai") {
        await api.post("/rfps/generate", {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          prompt: formData.aiPrompt,
        });
        setMessage("✅ AI-generated RFP created successfully!");
      }

      setTimeout(() => {
        navigate("/dashboard");
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("RFP submit error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to create RFP. Please try again.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    const newUserMessage = {
      role: "user",
      content: userMessage,
    };

    setAiMessages((prev) => [...prev, newUserMessage]);
    setUserMessage("");

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = "";
      if (userMessage.toLowerCase().includes("opening paragraph")) {
        aiResponse =
          "We are pleased to invite qualified software development firms to submit proposals for the development of a comprehensive web application. This project represents a significant opportunity to partner with an innovative organization committed to delivering exceptional digital solutions.";
      } else if (userMessage.toLowerCase().includes("budget")) {
        aiResponse =
          "To enhance clarity, consider breaking down costs by phase (e.g., discovery, development, testing), resource (e.g., personnel, software licenses), or deliverables. Also, specify payment terms and currency.";
      } else {
        aiResponse =
          "I can help you refine your proposal. Would you like suggestions for any specific section?";
      }

      setAiMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);
    }, 1000);
  };

  const generatePreview = () => {
    return {
      title: formData.title || "Your RFP Title",
      introduction: formData.description || "Your RFP description will appear here...",
      goals: formData.description || "Project goals and objectives will be displayed here.",
    };
  };

  const preview = generatePreview();

  const generateFullPreviewContent = () => {
    let content = `REQUEST FOR PROPOSAL\n\n`;
    content += `Title: ${formData.title || "Not specified"}\n\n`;
    content += `Category: ${formData.category || "Not specified"}\n\n`;
    content += `Description:\n${formData.description || "Not specified"}\n\n`;
    
    if (creationType === "ai" && formData.aiPrompt) {
      content += `AI Generation Requirements:\n${formData.aiPrompt}\n\n`;
    }
    
    if (creationType === "upload" && fileData) {
      content += `Document: Uploaded file ready for analysis\n\n`;
    }
    
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    return content;
  };

  const handleFullPreview = () => {
    setShowPreviewModal(true);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let y = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      const title = formData.title || "Request for Proposal";
      doc.text(title, pageWidth / 2, y, { align: "center" });
      y += 15;

      // Category and Date
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100, 100, 100);
      if (formData.category) {
        doc.text(`Category: ${formData.category}`, margin, y);
        y += 7;
      }
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
      y += 10;

      // Description Section
      if (formData.description) {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Description", margin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        const descLines = doc.splitTextToSize(formData.description, maxWidth);
        descLines.forEach((line: string) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += 6;
        });
        y += 5;
      }

      // AI Prompt Section
      if (creationType === "ai" && formData.aiPrompt) {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("AI Generation Requirements", margin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        const promptLines = doc.splitTextToSize(formData.aiPrompt, maxWidth);
        promptLines.forEach((line: string) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += 6;
        });
        y += 5;
      }

      // Upload Status
      if (creationType === "upload" && fileData) {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("Document Status", margin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        doc.text("File uploaded and ready for analysis.", margin, y);
      }

      const fileName = `${(formData.title || "RFP").replace(/[^a-z0-9]/gi, "_")}-${Date.now()}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="proposal-builder">
      <Row className="g-0 h-100">
        {/* Left Pane - Proposal Builder */}
        <Col xs={12} lg={9} className="proposal-builder__left">
          <div className="proposal-builder__content">
            {/* Progress Steps */}
            <div className="proposal-progress">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`proposal-step ${currentStep === step.id ? "active" : ""} ${
                    step.completed ? "completed" : ""
                  }`}
                >
                  <div className="proposal-step__indicator">
                    {step.completed ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <span className="step-number">{step.id}</span>
                    )}
                  </div>
                  <div className="proposal-step__content">
                    <h4 className="proposal-step__title">{step.title}</h4>
                    <p className="proposal-step__description">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="proposal-details">
                <h3 className="proposal-details__title">
                  Enter basic information for your Request For Proposal.
                </h3>

                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>RFP Title *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g. CRM Software Development RFP"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Briefly describe your project requirements..."
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                    >
                      <option value="">Select Category</option>
                      <option value="Software">Software Development</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Construction">Construction</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Form>

                <div className="proposal-actions">
                  <Button variant="primary" onClick={handleNextStep} disabled={!formData.title || !formData.description}>
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Choose Creation Method */}
            {currentStep === 2 && (
              <div className="proposal-details">
                <h3 className="proposal-details__title">
                  Choose how you want to create your RFP.
                </h3>

                <Form.Group className="mb-4">
                  <Form.Label>Creation Method *</Form.Label>
                  <div className="rfp-creation-options">
                    <div
                      className={`rfp-option-card ${creationType === "upload" ? "selected" : ""}`}
                      onClick={() => setCreationType("upload")}
                    >
                      <Upload size={32} className="mb-2" />
                      <h5>Upload Existing RFP</h5>
                      <p>Upload your document and let AI process it.</p>
                    </div>

                    <div
                      className={`rfp-option-card ${creationType === "ai" ? "selected" : ""}`}
                      onClick={() => setCreationType("ai")}
                    >
                      <Sparkles size={32} className="mb-2" />
                      <h5>Generate with AI</h5>
                      <p>Describe your needs and AI will generate the RFP.</p>
                    </div>
                  </div>
                </Form.Group>

                <div className="proposal-actions">
                  <Button variant="outline-secondary" onClick={handlePreviousStep}>
                    Previous
                  </Button>
                  <Button variant="primary" onClick={handleNextStep} disabled={!creationType}>
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Upload or AI Generation */}
            {currentStep === 3 && (
              <div className="proposal-details">
                <h3 className="proposal-details__title">
                  {creationType === "upload" 
                    ? "Upload your RFP document" 
                    : "Describe your requirements for AI generation"}
                </h3>

                {creationType === "upload" && (
                  <div className="upload-section">
                    <RFPUpload onSuccess={handleFileSelect} hideTitle compact />
                  </div>
                )}

                {creationType === "ai" && (
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Describe your requirements *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        value={formData.aiPrompt}
                        onChange={(e) => handleInputChange("aiPrompt", e.target.value)}
                        placeholder="Example: I need a proposal for redesigning our CRM system with modern UI/UX, cloud-based architecture, mobile app support, and integration with existing ERP systems..."
                      />
                      <Form.Text className="text-muted">
                        Be as detailed as possible. The AI will use this to generate your RFP.
                      </Form.Text>
                    </Form.Group>
                  </Form>
                )}

                <div className="proposal-actions">
                  <Button variant="outline-secondary" onClick={handlePreviousStep}>
                    Previous
                  </Button>
                  {creationType === "upload" && fileData && (
                    <Button variant="primary" onClick={handleNextStep}>
                      Next Step
                    </Button>
                  )}
                  {creationType === "ai" && (
                    <Button 
                      variant="primary" 
                      onClick={handleNextStep}
                      disabled={!formData.aiPrompt.trim()}
                    >
                      Next Step
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="proposal-details">
                <h3 className="proposal-details__title">
                  Review and submit your RFP.
                </h3>

                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                {message && <Alert variant="success" className="mb-3">{message}</Alert>}

                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" className="mb-3" />
                    <p className="fw-semibold">{message || "Processing your RFP..."}</p>
                  </div>
                ) : (
                  <>
                    <div className="review-summary">
                      <h4>RFP Summary</h4>
                      <div className="summary-item">
                        <strong>Title:</strong> {formData.title || "Not specified"}
                      </div>
                      <div className="summary-item">
                        <strong>Description:</strong> {formData.description || "Not specified"}
                      </div>
                      <div className="summary-item">
                        <strong>Category:</strong> {formData.category || "Not specified"}
                      </div>
                      <div className="summary-item">
                        <strong>Creation Method:</strong> {creationType === "upload" ? "Upload Document" : "AI Generation"}
                      </div>
                      {creationType === "upload" && fileData && (
                        <div className="summary-item">
                          <strong>File:</strong> Uploaded successfully
                        </div>
                      )}
                      {creationType === "ai" && (
                        <div className="summary-item">
                          <strong>AI Prompt:</strong> {formData.aiPrompt.substring(0, 100)}...
                        </div>
                      )}
                    </div>

                    <div className="proposal-actions">
                      <Button variant="outline-secondary" onClick={handlePreviousStep} disabled={loading}>
                        Previous
                      </Button>
                      <Button variant="success" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Processing..." : "Submit RFP"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Live Preview */}
            <div className="proposal-preview">
              <h3 className="proposal-preview__title">
                A real-time draft of your proposal as you build it.
              </h3>
              <div className="proposal-preview__content">
                <h4>Draft: {preview.title}</h4>
                <div className="preview-section">
                  <h5>1. Introduction</h5>
                  <p>{preview.introduction}</p>
                </div>
                <div className="preview-section">
                  <h5>2. Project Goals and Objectives</h5>
                  <p>{preview.goals}</p>
                </div>
              </div>
              <div className="proposal-preview__actions">
                <Button variant="outline-secondary" onClick={handleFullPreview}>
                  <Eye size={16} className="me-2" />
                  Full Preview
                </Button>
                <Button variant="primary" onClick={handleDownloadPDF}>
                  <Download size={16} className="me-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Pane - AI Assistant */}
        <Col xs={12} lg={3} className="proposal-builder__right">
          <div className="ai-assistant">
            <div className="ai-assistant__header">
              <h3>AI Assistant</h3>
            </div>
            <div className="ai-assistant__messages">
              {aiMessages.map((message, index) => (
                <div
                  key={index}
                  className={`ai-message ai-message--${message.role}`}
                >
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
            <div className="ai-assistant__input">
              <Button variant="link" className="ai-assistant__attach">
                <Paperclip size={18} />
              </Button>
              <input
                type="text"
                placeholder="Type your message..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button variant="primary" onClick={handleSendMessage}>
                <Send size={18} />
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Full Preview Modal */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)} 
        size="lg" 
        centered
        className="preview-modal"
      >
        <Modal.Header className="preview-modal__header">
          <Modal.Title>Full RFP Preview</Modal.Title>
          <Button 
            variant="link" 
            className="preview-modal__close"
            onClick={() => setShowPreviewModal(false)}
          >
            <X size={20} />
          </Button>
        </Modal.Header>
        <Modal.Body className="preview-modal__body">
          <div className="full-preview-content">
            <h2 className="preview-title">{formData.title || "Untitled RFP"}</h2>
            <div className="preview-meta">
              <p><strong>Category:</strong> {formData.category || "Not specified"}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>
            <div className="preview-section-full">
              <h3>Description</h3>
              <p>{formData.description || "No description provided."}</p>
            </div>
            {creationType === "ai" && formData.aiPrompt && (
              <div className="preview-section-full">
                <h3>AI Generation Requirements</h3>
                <p>{formData.aiPrompt}</p>
              </div>
            )}
            {creationType === "upload" && fileData && (
              <div className="preview-section-full">
                <h3>Document</h3>
                <p>File uploaded and ready for analysis.</p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="preview-modal__footer">
          <Button variant="outline-secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleDownloadPDF}>
            <Download size={16} className="me-2" />
            Download PDF
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProposalBuilder;

