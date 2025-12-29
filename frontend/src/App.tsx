import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AuthRedirect } from "./components/routes/ProtectedRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Loader from "./components/common/Loader";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/auth/ResetPassword"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideHeaderFooter = ["/login", "/register", "/forgot-password", "/reset-password", "/dashboard"];
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
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
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
              <Route
                path="/forgot-password"
                element={
                  <AuthRedirect>
                    <ForgotPassword />
                  </AuthRedirect>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <AuthRedirect>
                    <ResetPassword />
                  </AuthRedirect>
                }
              />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
