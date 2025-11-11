import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Particle array
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    // Create 40 particles
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

  return (
    <div className="register-container">
      {/* Particles */}
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

      {/* Mini upside-down robot */}
      <div className="mini-robot">🤖</div>

      {/* Left Form */}
      <div className="form-side">
        <div className="register-form">
          <h2>Sign Up - RFP AI</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Sign Up</button>
          </form>
          <p>Already have an account? <a href="/login">Login</a></p>
        </div>
      </div>

      {/* Right Image */}
      <div className="image-side">
        <img src="/Images/register/signup.jpeg" alt="RFP AI Illustration" />
      </div>
    </div>
  );
};

export default Register;
