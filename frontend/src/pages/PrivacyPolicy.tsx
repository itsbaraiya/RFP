import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy: React.FC = () => {
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

          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>1. Introduction</h2>
            <p>
              RFP AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              Service.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <p>We may collect personal information that you provide to us, including:</p>
            <ul>
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials (username, password)</li>
              <li>Profile information (avatar, designation)</li>
              <li>Payment information (processed through secure third-party providers)</li>
            </ul>

            <h3>2.2 Usage Data</h3>
            <p>We automatically collect information about how you use the Service, including:</p>
            <ul>
              <li>IP address and browser type</li>
              <li>Pages visited and time spent on pages</li>
              <li>Device information</li>
              <li>Access dates and times</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect, prevent, and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2>4. Information Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information only:</p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in operating the Service (under strict confidentiality agreements)</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your
              personal information. However, no method of transmission over the Internet is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide the Service and
              fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is
              required by law.
            </p>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Request data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2>8. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our Service and hold
              certain information. You can instruct your browser to refuse all cookies or to indicate when
              a cookie is being sent.
            </p>
          </section>

          <section>
            <h2>9. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites. We are not responsible for the privacy
              practices of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2>10. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through the support
              channels provided in the Service.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default PrivacyPolicy;

