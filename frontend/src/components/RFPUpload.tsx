//
// RFP Upload
//

import React, { useState } from "react";
import api from "../api/axios";
import { CloudUpload } from "lucide-react";
import { Spinner } from "react-bootstrap";

interface RFPUploadProps {
  onSuccess?: () => Promise<void> | void;
}

const RFPUpload: React.FC<RFPUploadProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setMessage("");

      const res = await api.post("/rfp/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(`✅ ${res.data.message || "RFP uploaded successfully!"}`);
      console.log("Upload Response:", res.data);

      if (onSuccess) await onSuccess();
    } catch (error: any) {
      console.error("Upload error:", error);

      if (error.response) {
        const backendError =
          error.response.data?.error ||
          error.response.data?.message ||
          "Upload failed from backend.";
        setMessage(`❌ ${backendError}`);
      } else if (error.request) {
        setMessage("❌ No response from server. Please check your connection.");
      } else {
        setMessage(`❌ ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="text-center py-3">
      <div
        className="d-flex align-items-center justify-content-center mx-auto rounded-circle mb-3"
        style={{
          width: "80px",
          height: "80px",
          background: "rgba(37,99,235,0.1)",
        }}
      >
        <CloudUpload size={40} color="#2563eb" />
      </div>

      <h5 className="fw-semibold mb-2">Upload Your RFP Document</h5>
      <p className="text-muted mb-4 small">
        Supported formats: <strong>PDF, DOCX, TXT, PNG, JPG</strong>
      </p>
      
      <div
        className="p-4 mb-4 text-center mx-auto"
        style={{
          border: "2px dashed #cbd5e1",
          borderRadius: "12px",
          background: "#f8fafc",
          cursor: "pointer",
          maxWidth: "420px",
        }}
        onClick={() => document.getElementById("rfpFile")?.click()}
      >
        <CloudUpload size={26} color="#3b82f6" className="mb-2" />
        <p className="mb-1 fw-semibold text-primary">Click to choose a file</p>
        <p className="text-muted small mb-0">or drag it here</p>

        <input
          id="rfpFile"
          type="file"
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {file && (
        <p className="text-success small mb-3">
          ✅ Selected: <strong>{file.name}</strong>
        </p>
      )}

      <button
        className="btn btn-primary fw-semibold px-4 py-2"
        onClick={handleUpload}
        disabled={isUploading}
        style={{
          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
          border: "none",
          borderRadius: "8px",
          minWidth: "180px",
        }}
      >
        {isUploading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Uploading...
          </>
        ) : (
          <>
            <CloudUpload size={18} className="me-2" />
            Upload & Analyze
          </>
        )}
      </button>

      {message && (
        <p
          className={`mt-3 fw-semibold ${
            message.startsWith("✅") ? "text-success" : "text-danger"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default RFPUpload;
