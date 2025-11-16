// AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser: User = JSON.parse(userData);
        setIsLoggedIn(true);
        setUser(parsedUser);

        // Fetch latest user from backend
        fetch(`${BASE_URL}/api/users/${parsedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })
          .then(async (res) => {
            if (!res.ok) {
              // If user not found, clear storage and logout
              console.warn(`User ${parsedUser.id} not found, clearing storage`);
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setIsLoggedIn(false);
              setUser(null);
              return null;
            }
            return res.json();
          })
          .then((data) => {
            if (data) {
              setUser(data);
              localStorage.setItem("user", JSON.stringify(data));
            }
          })
          .catch((err) => console.error("Error fetching user data:", err))
          .finally(() => setInitialized(true));
      } catch (err) {
        console.error("Error parsing user data:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setInitialized(true);
      }
    } else {
      setInitialized(true);
    }
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
