import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { FaUser, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Lottie from "lottie-react";
import successAnimation from "../../assets/lottie/Success.json";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const particles = Array.from({ length: 30 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1600);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Google sign-in clicked");
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
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

      <div className="mini-robot">🤖</div>

      <Container fluid className="h-100">
        <Row className="h-100 g-0">
          <Col xs={12} md={6} className="form-side d-flex align-items-center justify-content-center">
            <div className="login-form">
              <h2>Welcome</h2>
              <p className="subtitle">Sign in to your RFP AI account</p>

              {error && <div className="alert alert-danger">{error}</div>}

              {!showSuccess ? (
                <>
                  <form onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                      <FaUser className="input-icon" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    {/* Forgot Password Link */}
                    <div className="forgot-password">
                      <a onClick={handleForgotPassword} aria-label="forget-password" title="forget-password">
                        Forgot Password?
                      </a>
                    </div>

                    <button type="submit">Login</button>
                  </form>

                  <div className="divider">
                    <span className="divider-line"></span>
                    <span className="divider-text">or</span>
                    <span className="divider-line"></span>
                  </div>

                  <button type="button" className="google-signin-btn" onClick={handleGoogleSignIn}>
                    <FcGoogle className="google-icon" />
                    Sign up with Google
                  </button>

                  <p className="tos-privacy">
                    By clicking 'Submit' or 'Sign up with Google' you agree to our{" "}
                    <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">
                      Terms of Service
                    </a>{" "}
                    and acknowledge that you have read and understand our{" "}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                      Privacy Policy
                    </a>.
                  </p>
                </>
              ) : (
                <div className="lottie-success">
                  <Lottie animationData={successAnimation} loop={false} />
                  <p>Login Successful!</p>
                </div>
              )}

              <p className="signup-paragraph">
                Don't have an account? <a href="/register">Sign Up</a>
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
};

export default Login;
