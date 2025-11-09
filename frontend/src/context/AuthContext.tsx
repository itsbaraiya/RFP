// 
// AuthContext
// 
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface User {
  updatedAt: number;
  id: number;
  name: string;
  email: string;
  avatar?: string;
  status?: string;
  isBusy?: boolean;
  role?: string;
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
        const parsedUser = JSON.parse(userData);
        setIsLoggedIn(true);
        setUser(parsedUser);
        
        // Optional: Verify with backend and get latest user data
        fetch(`${BASE_URL}/api/users/${parsedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error("Failed to fetch user data");
          })
          .then((data) => {
            if (data) {
              setUser(data);
              localStorage.setItem("user", JSON.stringify(data));
            }
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);            
          })
          .finally(() => setInitialized(true));
      } catch (error) {
        console.error("Error parsing user data:", error);
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
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      user, 
      login, 
      logout, 
      initialized,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};