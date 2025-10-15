// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './layout/PublicLayout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AppLayout from './layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ItemListPage from './pages/ItemListPage';
import ProtectedRoute from './components/ProtectedRoute';
import { SnackbarProvider } from 'notistack';

function App() {
  return (
    <AuthProvider>
       <SnackbarProvider maxSnack={3}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="itemlist" element={<ItemListPage />} />
          </Route>

          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SnackbarProvider>
    </AuthProvider>
  );
}

export default App;