import { useNavigate } from "react-router-dom";
import { Container, Button } from "react-bootstrap";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's a valid history entry from the same origin
    if (window.history.length > 1 && document.referrer && new URL(document.referrer).origin === window.location.origin) {
      navigate(-1);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="legal-page">
      <Container>
        <Button variant="link" onClick={handleBack} className="back-button">
          <ArrowLeft size={18} className="me-2" />
          Back
        </Button>

        <div className="legal-content">
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the RFP AI platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use the Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the Service</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2>4. Service Availability</h2>
            <p>
              We strive to ensure the Service is available 24/7, but we do not guarantee uninterrupted access. The Service may be unavailable due to maintenance, updates, or unforeseen circumstances.
            </p>
          </section>

          <section>
            <h2>5. Limitation of Liability</h2>
            <p>
              In no event shall RFP AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Service.
            </p>
          </section>

          <section>
            <h2>6. Revisions</h2>
            <p>
              RFP AI may revise these terms of service at any time without notice. By using this Service you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2>7. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at support@rfpai.com
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default TermsOfService;

