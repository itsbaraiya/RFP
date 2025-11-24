// AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  status?: string;
  isBusy?: boolean;
  role?: string;
  designation?: string;
  updatedAt?: string | number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  isLoggedIn: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const getAvatarURL = (avatar?: string) => {
  const BASE_URL = import.meta.env.VITE_BASE_URL; // https://rfp-a4lu.onrender.com/api

  if (!avatar) {
    return `${BASE_URL}/uploads/images/user/userplaceholder.avif`;
  }

  let clean = avatar.trim();

  // ❌ Remove any localhost URL
  clean = clean.replace("http://localhost:5000", "");
  clean = clean.replace("http://127.0.0.1:5000", "");

  // If avatar STILL begins with full external URL (like Cloudinary)
  if (clean.startsWith("http") || clean.startsWith("blob:")) {
    return clean;
  }

  // Ensure it starts with /
  if (!clean.startsWith("/")) clean = "/" + clean;

  // Ensure it has /api
  if (!clean.startsWith("/api")) clean = "/api" + clean;

  // Attach correct deployed base URL
  return `${BASE_URL.replace(/\/api$/, "")}${clean}`;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = !!user;

  useEffect(() => {
  const init = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    try {
      const res = await api.get("/auth/user");
      const userData = {
        ...res.data,
        avatar: getAvatarURL(res.data.avatar),
        designation: res.data.designation || "",
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err) {
      setUser(null);
    }

    setLoading(false);
    setInitialized(true);
  };

  init();
}, []);

  const normalizeUser = (userData: User) => ({
  ...userData,
  avatar: getAvatarURL(userData.avatar),
  designation: userData.designation || "",
});

const login = (token: string, userData: User) => {
  const normalizedUser = normalizeUser(userData);
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(normalizedUser));
  setUser(normalizedUser);
};

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };


  const updateUser = (userData: User) => {
  const normalizedUser = normalizeUser(userData);
  localStorage.setItem("user", JSON.stringify(normalizedUser));
  setUser(normalizedUser);
};


  return (
    <AuthContext.Provider value={{ user, loading, initialized, login, logout, updateUser,isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
