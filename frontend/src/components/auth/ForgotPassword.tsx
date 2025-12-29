import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { FaEnvelope } from "react-icons/fa";
import api from "../../api/axios";
import Lottie from "lottie-react";
import successAnimation from "../../assets/lottie/Success.json";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const particles = Array.from({ length: 30 });

  const isValidEmail = (email: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="particles">
        {particles.map((_, i) => (
          <span
            key={i}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              animationDuration: `${10 + Math.random() * 20}s`,
            }}
          />
        ))}
      </div>
      <Container fluid className="h-100">
        <Row className="h-100 g-0">
          <Col xs={12} md={6} className="form-side d-flex align-items-center justify-content-center">
            <div className="login-form">
              <h2>Forgot Password</h2>
              <p className="subtitle">Enter your email to receive a password reset link</p>

              {error && <div className="alert alert-danger">{error}</div>}

              {!success ? (
                <>
                  <form onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    <button type="submit" disabled={loading}>
                      {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>

                  <p className="signup-paragraph">
                    Remember your password? <a href="/login">Back to Login</a>
                  </p>
                </>
              ) : (
                <div className="lottie-success">
                  <Lottie animationData={successAnimation} loop={false} />
                  <p>Reset link sent!</p>
                  <p style={{ fontSize: "0.9rem", color: "#aaa", marginTop: "0.5rem" }}>
                    Please check your email for instructions to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    style={{
                      marginTop: "1.5rem",
                      padding: "0.75rem 1rem",
                      background: "linear-gradient(135deg, #00bfff, #0066ff)",
                      color: "#fff",
                      fontWeight: 600,
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </Col>

          <Col xs={12} md={6} className="image-side d-none d-md-block">
            <img src="/Images/register/login.jpeg" alt="RFP AI Illustration" />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ForgotPassword;

