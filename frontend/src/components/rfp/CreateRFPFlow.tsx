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
  const [filePath, setFilePath] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(33);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const handleUploadComplete = (uploadedPath: string) => {
    setFilePath(uploadedPath);
    setStep(3); // Move automatically to Step 3 after upload
    setProgress(99);
  };

  const handleSubmit = async () => {
    if (type === "") return setError("Please select an option.");
    if (type === "upload" && !filePath) return setError("Please upload a file.");
    if (type === "ai" && !prompt) return setError("Please enter a prompt.");

    setError("");
    setLoading(true);
    setMessage("Processing your RFP...");

    try {
      if (type === "upload" && filePath) {
        await api.post("/rfp/finalize", {
          title,
          description,
          category,
          filePath,
          type: "upload",
        });
      } else if (type === "ai") {
        await api.post("/rfp/generate", {
          title,
          description,
          category,
          prompt,
          type: "ai",
        });
      }

      setMessage("✅ RFP Created Successfully!");
      setTimeout(() => onSuccess(), 1200);
    } catch (err: any) {
      console.error(err);
      setError("Failed to create RFP. Please try again.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProgressBar now={progress} className="mb-3" />

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Step 1 */}
      {step === 1 && (
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>RFP Title *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter RFP Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe your RFP..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Category</Form.Label>
            <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select Category</option>
              <option value="Software">Software Development</option>
              <option value="Marketing">Marketing</option>
              <option value="Construction">Construction</option>
            </Form.Select>
          </Form.Group>
        </Form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Choose Creation Method *</Form.Label>
            <div className="d-flex gap-4">
              <Form.Check
                type="radio"
                id="upload"
                label="Upload Existing RFP"
                name="rfpType"
                checked={type === "upload"}
                onChange={() => setType("upload")}
              />
              <Form.Check
                type="radio"
                id="ai"
                label="Create with AI"
                name="rfpType"
                checked={type === "ai"}
                onChange={() => setType("ai")}
              />
            </div>
          </Form.Group>

          {type === "upload" && (
            <RFPUpload
              onSuccess={handleUploadComplete}
              hideTitle
              compact
            />
          )}

          {type === "ai" && (
            <Form.Group className="mb-3">
              <Form.Label>Describe your RFP requirements *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Example: I need a proposal for a CRM system redesign..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </Form.Group>
          )}
        </Form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="text-center py-4">
          {loading ? (
            <>
              <Spinner animation="border" className="mb-3" />
              <p>{message}</p>
            </>
          ) : (
            <p>{message || "Ready to submit your RFP."}</p>
          )}
        </div>
      )}

      {/* Footer Buttons */}
      <div className="d-flex justify-content-between mt-4">
        {step > 1 && step < 3 && (
          <Button variant="outline-secondary" onClick={handleBack}>
            Back
          </Button>
        )}
        {step === 1 && (
          <Button variant="primary" onClick={handleNext}>
            Next
          </Button>
        )}
        {step === 2 && type === "ai" && (
          <Button variant="primary" onClick={() => setStep(3)}>
            Continue
          </Button>
        )}
        {step === 3 && (
          <Button variant="success" onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : "Submit RFP"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreateRFPFlow;
