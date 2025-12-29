import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    // If opened in new tab or no history, go to login, otherwise go back
    if (document.referrer && document.referrer.includes(window.location.origin)) {
      navigate(-1);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="legal-page">
      <Container className="py-5">
        <div className="legal-content">
          <button
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              color: "#00bfff",
              cursor: "pointer",
              marginBottom: "2rem",
              fontSize: "1rem",
            }}
          >
            ← Back
          </button>

          <h1>Terms of Service</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using RFP AI ("the Service"), you accept and agree to be bound by the terms
              and provision of this agreement. If you do not agree to abide by the above, please do not use
              this service.
            </p>
          </section>

          <section>
            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use RFP AI for personal and commercial purposes. This is
              the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose without explicit written consent</li>
              <li>Attempt to reverse engineer any software contained in the Service</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree
              to accept responsibility for all activities that occur under your account or password.
            </p>
          </section>

          <section>
            <h2>4. Service Availability</h2>
            <p>
              We strive to ensure the Service is available 24/7, but we do not guarantee uninterrupted
              access. The Service may be unavailable due to maintenance, updates, or circumstances beyond
              our control.
            </p>
          </section>

          <section>
            <h2>5. User Content</h2>
            <p>
              You retain ownership of any content you submit to the Service. By submitting content, you
              grant us a license to use, store, and process that content as necessary to provide the
              Service.
            </p>
          </section>

          <section>
            <h2>6. Prohibited Uses</h2>
            <p>You may not use the Service:</p>
            <ul>
              <li>In any way that violates any applicable law or regulation</li>
              <li>To transmit any malicious code or viruses</li>
              <li>To impersonate or attempt to impersonate another user</li>
              <li>In any way that infringes upon the rights of others</li>
            </ul>
          </section>

          <section>
            <h2>7. Limitation of Liability</h2>
            <p>
              In no event shall RFP AI or its suppliers be liable for any damages (including, without
              limitation, damages for loss of data or profit, or due to business interruption) arising out
              of the use or inability to use the Service.
            </p>
          </section>

          <section>
            <h2>8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material
              changes. Your continued use of the Service after such modifications constitutes acceptance of
              the updated terms.
            </p>
          </section>

          <section>
            <h2>9. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through the
              support channels provided in the Service.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default TermsOfService;

