import { useNavigate } from "react-router-dom";
import { Container, Button } from "react-bootstrap";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul>
              <li>Name and email address when you create an account</li>
              <li>RFP documents and content you upload or create</li>
              <li>Communication data when you contact us</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our Service</li>
              <li>Process your requests and transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section>
            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only:
            </p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist us in operating our Service</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of certain communications</li>
            </ul>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>
              We use cookies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2>7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
          </section>

          <section>
            <h2>8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@rfpai.com
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default PrivacyPolicy;

