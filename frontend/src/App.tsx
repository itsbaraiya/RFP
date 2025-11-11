import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import EditProfile from "./pages/EditProfile";
import type { ReactNode } from "react";
import { ProtectedRoute, AuthRedirect } from "./components/routes/ProtectedRoute";

// Wrapper component to handle conditional header/footer rendering
interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const hideHeaderFooterPaths = ["/login", "/register", "/dashboard"];
  const showHeaderFooter = !hideHeaderFooterPaths.includes(location.pathname);

  return (
    <>
      {showHeaderFooter && <Header />}
      <main>{children}</main>
      {showHeaderFooter && <Footer />}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/edit-profile" element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={
                <AuthRedirect>
                  <Login />
                </AuthRedirect>
              }
            />
            <Route path="/register" element={
                <AuthRedirect>
                  <Register />
                </AuthRedirect>
              }
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
