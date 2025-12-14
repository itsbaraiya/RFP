import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AuthRedirect } from "./components/routes/ProtectedRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));

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
          <Suspense fallback={<div>Loading...</div>}>
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
            </Routes>
          </Suspense>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
