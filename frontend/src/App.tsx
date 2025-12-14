import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import EditProfile from "./pages/EditProfile";
import { ProtectedRoute, AuthRedirect } from "./components/routes/ProtectedRoute";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideHeaderFooter = ["/login", "/register", "/dashboard"];

  const show = !hideHeaderFooter.includes(location.pathname);

  return (
    <>
      {show && <Header />}
      <main>{children}</main>
      {show && <Footer />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} /><Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/edit-profile"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/login"
              element={
                <AuthRedirect>
                  <Login />
                </AuthRedirect>
              }
            />

            <Route
              path="/register"
              element={
                <AuthRedirect>
                  <Register />
                </AuthRedirect>
              }
            />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}


export default App;
