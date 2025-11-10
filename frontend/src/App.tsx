import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import EditProfile from "./pages/EditProfile";
import type { ReactNode } from "react";

// Wrapper component to handle conditional header/footer rendering
interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();

  // Pages where header/footer should be hidden
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/edit-profile" element={<EditProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
