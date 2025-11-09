// 
// RFP Upload
// 

import { useState } from "react";

const RFPUpload = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    setLoading(true);

    const formData = new FormData();
    formData.append("rfp", file);

    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/rfps/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    alert(data.message);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2>Upload RFP</h2>
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        className="btn btn-primary mt-3"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default RFPUpload;
