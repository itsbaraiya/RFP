import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import api from "../../api/axios";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {    
    setParticles(Array.from({ length: 40 }, (_, i) => i));
  }, []);

  const isValidEmail = (email: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      await api.post("/auth/register", { name, email, password });
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const handleGoogleSignUp = () => {    
    console.log("Google sign-up clicked");
  };

  return (
    <div className="register-container">
      <div className="particles">
        {particles.map((i) => (
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
            <div className="register-form">
              <h2>Sign Up</h2>
              <p className="subtitle">Sign up to your RFP AI account</p>
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
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
                <button type="submit">Sign Up</button>
              </form>

              <div className="divider">
                <span className="divider-line"></span>
                <span className="divider-text">or</span>
                <span className="divider-line"></span>
              </div>

              <button type="button" className="google-signin-btn" onClick={handleGoogleSignUp}>
                <FcGoogle className="google-icon" />
                Sign up with Google
              </button>

              <p className="already-have__account">Already have an account? <a href="/login">Login</a></p>
            </div>
          </Col>

          <Col xs={12} md={6} className="image-side d-none d-md-block">
            <img src="/Images/register/signup.jpeg" alt="RFP AI Illustration" />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
