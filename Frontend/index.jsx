import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/auth";

// Pages (to be built in next steps)
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ListingsPage from "./pages/ListingsPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import TenantProfilePage from "./pages/TenantProfilePage";
import OwnerDashboard from "./pages/OwnerDashboard";
import InterestsPage from "./pages/InterestsPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";
import Navbar from "./components/Navbar";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/listings" : "/login"} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/listings" element={<ProtectedRoute><ListingsPage /></ProtectedRoute>} />
        <Route path="/listings/:id" element={<ProtectedRoute><ListingDetailPage /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute roles={["tenant"]}><TenantProfilePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute roles={["owner"]}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/interests" element={<ProtectedRoute><InterestsPage /></ProtectedRoute>} />
        <Route path="/chat/:interestId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
