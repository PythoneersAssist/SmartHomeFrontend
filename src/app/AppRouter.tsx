import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDeletionPage } from '../pages/ConfirmDeletionPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { FrontPage } from '../pages/FrontPage';
import { HouseDetailPage } from '../pages/HouseDetailPage';
import { HousesPage } from '../pages/HousesPage';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RegisterPage } from '../pages/RegisterPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';

function AuthAwareRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/houses' : '/'} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/confirm-deletion" element={<ConfirmDeletionPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/houses" element={<HousesPage />} />
          <Route path="/houses/:houseId" element={<HouseDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<AuthAwareRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
