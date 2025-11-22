import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

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
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  initialized: boolean;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

useEffect(() => {
  const initializeAuth = async () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser: User = JSON.parse(userData);
        setIsLoggedIn(true);
        setUser(parsedUser);

        // Verify token with backend
        const res = await fetch(`${BASE_URL}/api/users/${parsedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        } else if (res.status === 401) {
          // Token invalid
          logout();
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        // Do NOT logout for parse errors, just mark initialized
      }
    }
    setInitialized(true);
  };

  initializeAuth();
}, []);


  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, login, logout, initialized, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
