// 
// Register
// 
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Simple and effective email validation regex
  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Frontend email validation
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
    <div className="container-fluid vh-100">
      <div className="row h-100">

        {/* Left Side Form */}
        <div className="col-md-6 d-flex align-items-center justify-content-center bg-light">
          <div className="register-form p-5 w-100" style={{ maxWidth: "400px" }}>
            <h2 className="text-center mb-4">Sign Up</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <input
                type="text"
                className="form-control"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary w-100 mt-2">
                Sign Up
              </button>
            </form>

            <p className="text-center mt-3 mb-0">
              Already have an account?{" "}
              <a href="/login" className="text-decoration-none">Login</a>
            </p>
          </div>
        </div>

        {/* Right Side Image */}
        <div className="col-md-6 d-none d-md-block p-0">
          <img
            src="https://www.tachyontech.com/wp-content/uploads/2025/07/AI-powered-RFP-automation-scaled.png"
            alt="RFP AI Illustration"
            className="img-fluid vh-100 w-100 object-fit-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;
