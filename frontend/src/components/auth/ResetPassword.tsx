import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { FaLock } from "react-icons/fa";
import api from "../../api/axios";
import Lottie from "lottie-react";
import successAnimation from "../../assets/lottie/Success.json";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const particles = Array.from({ length: 30 });

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
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
                <h2>Invalid Reset Link</h2>
                <p className="subtitle">This password reset link is invalid or has expired.</p>
                {error && <div className="alert alert-danger">{error}</div>}
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "linear-gradient(135deg, #00bfff, #0066ff)",
                    color: "#fff",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    marginTop: "1rem",
                  }}
                >
                  Request New Reset Link
                </button>
                <p className="signup-paragraph" style={{ marginTop: "1rem" }}>
                  <a href="/login">Back to Login</a>
                </p>
              </div>
            </Col>
            <Col xs={12} md={6} className="image-side d-none d-md-block">
              <img src="/Images/register/login.jpeg" alt="RFP AI Illustration" />
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

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
              <h2>Reset Password</h2>
              <p className="subtitle">Enter your new password</p>

              {error && <div className="alert alert-danger">{error}</div>}

              {!success ? (
                <>
                  <form onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                    </div>
                    <div className="input-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                    </div>

                    <button type="submit" disabled={loading}>
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>

                  <p className="signup-paragraph">
                    Remember your password? <a href="/login">Back to Login</a>
                  </p>
                </>
              ) : (
                <div className="lottie-success">
                  <Lottie animationData={successAnimation} loop={false} />
                  <p>Password Reset Successful!</p>
                  <p style={{ fontSize: "0.9rem", color: "#aaa", marginTop: "0.5rem" }}>
                    Redirecting to login page...
                  </p>
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

export default ResetPassword;

