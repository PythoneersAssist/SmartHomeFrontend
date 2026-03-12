import { AppRouter } from './app/AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { HouseProvider } from './contexts/HouseContext';
import { ToastProvider } from './contexts/ToastContext';

export default function App() {
  return (
    <AuthProvider>
      <HouseProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </HouseProvider>
    </AuthProvider>
  );
}