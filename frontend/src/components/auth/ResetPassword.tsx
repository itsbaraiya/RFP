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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token");

  const particles = Array.from({ length: 30 });

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset.");
    }
  }, [token]);

  const isValidPassword = (pwd: string) => pwd.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (!isValidPassword(password)) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. The token may have expired.");
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
                        disabled={loading || !token}
                        minLength={8}
                      />
                    </div>
                    <div className="input-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading || !token}
                        minLength={8}
                      />
                    </div>

                    <button type="submit" disabled={loading || !token}>
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
                  <p>Password reset successful!</p>
                  <p style={{ fontSize: "0.9rem", color: "#aaa", marginTop: "0.5rem" }}>
                    Redirecting to login...
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

