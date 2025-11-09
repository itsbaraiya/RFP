// 
// Login
// 

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });      
      login(res.data.token, res.data.user);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">

        {/* Left Side Form */}
        <div className="col-md-6 d-flex align-items-center justify-content-center bg-light">
          <div className="login-form p-5 w-100" style={{ maxWidth: "400px" }}>
            <h2 className="text-center mb-4">Login</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
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
                Login
              </button>
            </form>

            <p className="text-center mt-3 mb-0">
              Don't have an account?{" "}
              <a href="/register" className="text-decoration-none">Register</a>
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

export default Login;
