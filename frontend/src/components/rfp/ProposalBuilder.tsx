import { useState } from "react";
import { Row, Col, Button, Form, Alert, Spinner, Modal } from "react-bootstrap";
import { CheckCircle2, Send, Paperclip, Download, Eye, Upload, Sparkles, Wand2, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import RFPUpload from "../RFPUpload";
import jsPDF from "jspdf";
import { openFile, downloadFile } from "../../utils/fileUtils";

const ProposalBuilder: React.FC = () => {  
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [creationType, setCreationType] = useState<"upload" | "ai" | "">("");
  const [fileData, setFileData] = useState<{ id: number; filePath: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({    
    title: "",
    description: "",
    category: "",
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
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedRFP, setGeneratedRFP] = useState<{ id: number; title: string; filePath: string } | null>(null);

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

  const handleSaveDraft = async () => {
    if (!formData.title) {
      setError("Please enter at least a title to save as draft.");
      return;
    }

    setError("");
    setLoading(true);
    setMessage("Saving draft...");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required.");

      let rfpResponse;

      if (creationType === "upload" && fileData) {
        // Update existing RFP as draft
        rfpResponse = await api.put(`/rfps/${fileData.id}`, {
          title: formData.title,
          description: formData.description || "",
          category: formData.category || "",
          status: "DRAFT",
        });
        setGeneratedRFP({
          id: fileData.id,
          title: formData.title,
          filePath: fileData.filePath,
        });
      } else if (creationType === "ai") {
        // Create new RFP as draft (without generating PDF)
        rfpResponse = await api.post("/rfps/create-draft", {
          title: formData.title,
          description: formData.description || "",
          category: formData.category || "",
          aiPrompt: formData.aiPrompt || "",
        });
        setGeneratedRFP({
          id: rfpResponse.data.rfp.id,
          title: rfpResponse.data.rfp.title,
          filePath: rfpResponse.data.rfp.filePath || "",
        });
      } else {
        // No creation type selected, create minimal draft
        rfpResponse = await api.post("/rfps/create-draft", {
          title: formData.title,
          description: formData.description || "",
          category: formData.category || "",
        });
        setGeneratedRFP({
          id: rfpResponse.data.rfp.id,
          title: rfpResponse.data.rfp.title,
          filePath: rfpResponse.data.rfp.filePath || "",
        });
      }

      setMessage("✅ Draft saved successfully!");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Save draft error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to save draft. Please try again.");
      setMessage("");
    } finally {
      setLoading(false);
    }
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

      let rfpResponse;

      if (creationType === "upload" && fileData) {
        // First update the RFP with title, description, category
        await api.put(`/rfps/${fileData.id}`, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          status: "PENDING",
        });
        
        // Then analyze
        rfpResponse = await api.post(`/rfps/${fileData.id}/analyze`);
        setGeneratedRFP({
          id: fileData.id,
          title: formData.title,
          filePath: fileData.filePath,
        });
      } else if (creationType === "ai") {
        rfpResponse = await api.post("/rfps/generate", {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          prompt: formData.aiPrompt,
        });
        setGeneratedRFP({
          id: rfpResponse.data.rfp.id,
          title: rfpResponse.data.rfp.title,
          filePath: rfpResponse.data.rfp.filePath,
        });
      }

      setMessage("✅ RFP created successfully!");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("RFP submit error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to create RFP. Please try again.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || aiLoading) return;

    const newUserMessage = {
      role: "user" as const,
      content: userMessage,
    };

    setAiMessages((prev) => [...prev, newUserMessage]);
    setUserMessage("");
    setAiLoading(true);

    try {
      // Prepare proposal context
      const proposalContext = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        aiPrompt: formData.aiPrompt,
      };

      // Call AI chat API
      const response = await api.post("/rfps/ai-chat", {
        messages: [
          ...aiMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          newUserMessage,
        ],
        proposalContext,
      });

      const aiResponse = {
        role: "assistant" as const,
        content: response.data.message,
      };

      setAiMessages((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      const errorMessage = {
        role: "assistant" as const,
        content: error.response?.data?.error || "Sorry, I encountered an error. Please try again.",
      };
      setAiMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  const generatePreview = () => {
    return {
      title: formData.title || "Your RFP Title",
      category: formData.category || "Not specified",
      description: formData.description || "Description will appear here...",
      introduction: "Introduction will appear here...",
      aiPrompt:
        creationType === "ai"
          ? formData.aiPrompt || "AI requirements will appear here..."
          : null,
      uploadStatus:
        creationType === "upload"
          ? fileData
            ? "Document uploaded and ready for analysis."
            : "No document uploaded."
          : null,
    };
  };

  const preview = generatePreview();  

  const handleFullPreview = () => {
    if (!preview) {
      setError("No data available for preview.");
      return;
    }
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let y = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(formData.title || "Request for Proposal", pageWidth / 2, y, { align: "center" });
      y += 15;

      // Category & Date
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      if (formData.category) doc.text(`Category: ${formData.category}`, 20, y);
      y += 7;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
      y += 10;

      // Description
      if (formData.description) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Description:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.splitTextToSize(formData.description, pageWidth - 40).forEach((line: string) => {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(line, 20, y);
          y += 6;
        });
        y += 5;
      }

      // AI Prompt
      if (creationType === "ai" && formData.aiPrompt) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("AI Generation Requirements:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.splitTextToSize(formData.aiPrompt, pageWidth - 40).forEach((line: string) => {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(line, 20, y);
          y += 6;
        });
        y += 5;
      }

      // Upload Status
      if (creationType === "upload" && fileData) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Document Status:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("File uploaded and ready for analysis.", 20, y);
      }

      const blobUrl = doc.output("datauristring");
      setPdfPreviewUrl(blobUrl);

      setShowPreviewModal(true);
    } catch {
      setError("Failed to generate preview.");
    }
  };

  const handleCopyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadPDF = () => {
    if (!preview) {
      setError("No data available for PDF download.");
      return;
    }
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let y = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(formData.title || "Request for Proposal", pageWidth / 2, y, { align: "center" });
      y += 15;

      // Category & Date
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      if (formData.category) doc.text(`Category: ${formData.category}`, 20, y);
      y += 7;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
      y += 10;

      // Description
      if (formData.description) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Description:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.splitTextToSize(formData.description, pageWidth - 40).forEach((line: string) => {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(line, 20, y);
          y += 6;
        });
        y += 5;
      }

      // AI Prompt
      if (creationType === "ai" && formData.aiPrompt) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("AI Generation Requirements:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.splitTextToSize(formData.aiPrompt, pageWidth - 40).forEach((line: string) => {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(line, 20, y);
          y += 6;
        });
        y += 5;
      }

      // Upload Status
      if (creationType === "upload" && fileData) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Document Status:", 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("File uploaded and ready for analysis.", 20, y);
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
        <Col xs={12} lg={9} className="proposal-builder__left">
        <div className="section-header">
        <div className="section-header__title">
          <Wand2 size={22} />
          <h1>Proposal Builder</h1>
        </div>
        <p className="section-header__subtitle">
          Create, edit, and generate AI-powered proposals.
        </p>
      </div>
          <div className="proposal-builder__content">
            <div className="proposal-progress">
              {steps.map((step) => (
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
                      <Form.Text>
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
                      <Button 
                        variant="outline-primary" 
                        onClick={handleSaveDraft} 
                        disabled={loading}
                        className="me-2"
                      >
                        {loading ? "Saving..." : "Save as Draft"}
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
                  <h5>2. Description</h5>
                    <p>{preview.description}</p>

                    {preview.aiPrompt && (
                      <>
                        <h5>3. AI Generation Requirements</h5>
                        <p>{preview.aiPrompt}</p>
                      </>
                    )}

                    {preview.uploadStatus && (
                      <>
                        <h5>3. Document Status</h5>
                        <p>{preview.uploadStatus}</p>
                      </>
                    )}

                </div>
              </div>
              <div className="proposal-preview__actions">
                <Button variant="outline-secondary" onClick={handleFullPreview}>
                  <Eye size={16} className="me-2" />
                  Full Preview
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
                  <div className="ai-message__content">
                  <p>{message.content}</p>
                  </div>
                  {message.role === "assistant" && (
                    <button
                      className="ai-message__copy"
                      onClick={() => handleCopyMessage(message.content, index)}
                      title="Copy message"
                    >
                      {copiedIndex === index ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="ai-assistant__input">
              <Button variant="link" className="ai-assistant__attach" disabled>
                <Paperclip size={18} />
              </Button>
              <input
                type="text"
                placeholder={aiLoading ? "AI is thinking..." : "Type your message..."}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !aiLoading && handleSendMessage()}
                disabled={aiLoading}
              />
              <Button 
                variant="primary" 
                onClick={handleSendMessage}
                disabled={aiLoading || !userMessage.trim()}
              >
                {aiLoading ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                <Send size={18} />
                )}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* PDF Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Proposal PDF Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pdfPreviewUrl ? (
            <iframe src={pdfPreviewUrl} width="100%" height="600px" style={{ border: "none" }} />
          ) : (
            <Spinner animation="border" />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>Close</Button>
          <Button variant="success" onClick={handleDownloadPDF}>Download PDF</Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal 
        show={showSuccessModal} 
        onHide={() => {
          setShowSuccessModal(false);
          // Reset form when modal closes
          setCurrentStep(1);
          setCreationType("");
          setFileData(null);
          setFormData({
            title: "",
            description: "",
            category: "",
            aiPrompt: "",
          });
          setError("");
          setMessage("");
          setPdfPreviewUrl(null);
          setAiMessages([
            {
              role: "assistant",
              content: "Hello! I am your AI Assistant. How can I help you with your proposal today?",
            },
          ]);
          setUserMessage("");
        }} 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <CheckCircle2 size={24} className="text-success me-2" />
            RFP Created Successfully!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-3">
            <p className="mb-4">Your RFP <strong>"{generatedRFP?.title}"</strong> has been created and is ready to use.</p>
            <div className="d-flex flex-column gap-2">
              {generatedRFP && (
                <>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      if (generatedRFP?.filePath) {
                        openFile(generatedRFP.filePath);
                      }
                    }}
                  >
                    <Eye size={18} className="me-2" />
                    View Generated RFP
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={async () => {
                      if (generatedRFP?.filePath) {
                        const fileName = `${generatedRFP.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
                        await downloadFile(generatedRFP.filePath, fileName);
                      }
                    }}
                  >
                    <Download size={18} className="me-2" />
                    Download PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowSuccessModal(false);
              // Reset form
              setCurrentStep(1);
              setCreationType("");
              setFileData(null);
              setFormData({
                title: "",
                description: "",
                category: "",
                aiPrompt: "",
              });
              setError("");
              setMessage("");
              setPdfPreviewUrl(null);
              setAiMessages([
                {
                  role: "assistant",
                  content: "Hello! I am your AI Assistant. How can I help you with your proposal today?",
                },
              ]);
              setUserMessage("");
            }}
          >
            Create Another RFP
          </Button>
          <Button 
            variant="success" 
            onClick={() => {
              setShowSuccessModal(false);
              // Reset form
              setCurrentStep(1);
              setCreationType("");
              setFileData(null);
              setFormData({
                title: "",
                description: "",
                category: "",
                aiPrompt: "",
              });
              setError("");
              setMessage("");
              setPdfPreviewUrl(null);
              setAiMessages([
                {
                  role: "assistant",
                  content: "Hello! I am your AI Assistant. How can I help you with your proposal today?",
                },
              ]);
              setUserMessage("");
              navigate("/dashboard");
            }}
          >
            Go to Dashboard
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProposalBuilder;

