import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import BorrowPage from './pages/BorrowPage';
import ConfirmationPage from './pages/ConfirmationPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import InventoryPage from './pages/admin/InventoryPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import OverduePage from './pages/admin/OverduePage';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/borrow" replace />} />

      {/* Public Routes */}
      <Route
        path="/borrow"
        element={
          <Layout>
            <BorrowPage />
          </Layout>
        }
      />
      <Route
        path="/confirmation/:transactionId"
        element={
          <Layout>
            <ConfirmationPage />
          </Layout>
        }
      />
      <Route
        path="/history"
        element={
          <Layout>
            <HistoryPage />
          </Layout>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <Layout isAdmin>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <ProtectedRoute>
            <Layout isAdmin>
              <InventoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute>
            <Layout isAdmin>
              <TransactionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/overdue"
        element={
          <ProtectedRoute>
            <Layout isAdmin>
              <OverduePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/borrow" replace />} />
    </Routes>
  );
}
