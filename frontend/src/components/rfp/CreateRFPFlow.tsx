import { useState } from "react";
import { Button, Form, Spinner, ProgressBar, Alert } from "react-bootstrap";
import api from "../../api/axios";
import RFPUpload from "../RFPUpload";

interface CreateRFPFlowProps {
  onSuccess: () => Promise<void>;
}

const CreateRFPFlow: React.FC<CreateRFPFlowProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"upload" | "ai" | "">("");
  const [fileData, setFileData] = useState<{ id: number; filePath: string } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(33);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const handleNext = () => {
    if (step === 1 && (!title || !description)) {
      setError("Please enter both title and description.");
      return;
    }
    setError("");
    setStep(step + 1);
    setProgress(progress + 33);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
    setProgress(progress - 33);
  };

const handleFileSelect = (rfp) => {
  setTitle(rfp.title || "");
  setDescription(rfp.description || "");
  setCategory(rfp.category || "");

  setFileData({
    id: rfp.id,
    filePath: rfp.filePath,
  });

  setType("upload");
  setStep(3);
  setProgress(99);
};



  const handleSubmit = async () => {
    if (!type) return setError("Please select an option.");
    if (type === "upload" && !fileData) return setError("Please upload a file.");
    if (type === "ai" && !prompt) return setError("Please enter a prompt.");

    setError("");
    setLoading(true);
    setMessage("Processing your RFP...");

    try {
      if (!token) throw new Error("Authentication required.");

      if (type === "upload" && fileData) {
        await api.post(
        `/rfps/${fileData.id}/analyze`,
        {
          title,
          description,
          category,
          filePath: fileData.filePath,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );


        setMessage("✅ RFP uploaded and analyzed successfully!");
      } else if (type === "ai") {
        await api.post("/rfps/generate", { title, description, category, prompt }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMessage("✅ AI-generated RFP created successfully!");
      }

      setTimeout(() => onSuccess(), 1200);
    } catch (err: any) {
      console.error("RFP submit error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to create RFP. Please try again.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rfp-flow-container">
      <div className="rfp-header">
        <h3>Create your RFP</h3>
        <p>AI-powered RFP creation in 3 simple steps</p>
      </div>

      <div className="rfp-stepper mb-4">
        <div className={`step ${step >= 1 ? "active" : ""}`}>1</div>
        <div className={`line ${step >= 2 ? "active" : ""}`}></div>
        <div className={`step ${step >= 2 ? "active" : ""}`}>2</div>
        <div className={`line ${step >= 3 ? "active" : ""}`}></div>
        <div className={`step ${step >= 3 ? "active" : ""}`}>3</div>
      </div>

      <ProgressBar now={progress} className="mb-3" />

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="rfp-card">
        {step === 1 && (
          <Form className="fade-in">
            <Form.Group className="mb-3">
              <Form.Label>RFP Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. CRM Software Development RFP"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Briefly describe your project requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="Software">Software Development</option>
                <option value="Marketing">Marketing</option>
                <option value="Construction">Construction</option>
              </Form.Select>
            </Form.Group>
          </Form>
        )}

        {step === 2 && (
          <div className="fade-in">
            <Form.Group className="mb-4">
              <Form.Label>Choose creation method *</Form.Label>
              <div className="rfp-options">
                <div
                  className={`rfp-option-card ${type === "upload" ? "selected" : ""}`}
                  onClick={() => setType("upload")}
                >
                  <h5>📄 Upload Existing RFP</h5>
                  <p>Upload your document and let AI process it.</p>
                </div>

                <div
                  className={`rfp-option-card ${type === "ai" ? "selected" : ""}`}
                  onClick={() => setType("ai")}
                >
                  <h5>🤖 Generate with AI</h5>
                  <p>Describe your needs and AI will generate the RFP.</p>
                </div>
              </div>
            </Form.Group>

            {type === "upload" && <RFPUpload onSuccess={handleFileSelect} hideTitle compact />}
            {type === "ai" && (
              <Form.Group className="fade-in">
                <Form.Label>Describe your requirements *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Example: I need a proposal for redesigning our CRM system..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </Form.Group>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center fade-in">
            {loading ? (
              <>
                <Spinner animation="border" className="mb-3" />
                <p className="fw-semibold">{message}</p>
              </>
            ) : (
              <p className="fw-semibold">{message || "Ready to submit your RFP."}</p>
            )}
          </div>
        )}
      </div>

      <div className="d-flex justify-content-between mt-4">
        {step > 1 && step < 3 && <Button variant="outline-secondary" onClick={handleBack}>Back</Button>}
        {step === 1 && <Button variant="primary" onClick={handleNext}>Next</Button>}
        {step === 2 && type === "ai" && <Button variant="primary" onClick={() => setStep(3)}>Continue</Button>}
        {step === 3 && <Button variant="success" onClick={handleSubmit} disabled={loading}>{loading ? "Processing..." : "Submit RFP"}</Button>}
      </div>
    </div>
  );
};

export default CreateRFPFlow;
