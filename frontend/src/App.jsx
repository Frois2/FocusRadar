import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from '@/store/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/layouts/AppLayout';
import AuthPage from '@/pages/Auth';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import VerifyEmail from '@/pages/VerifyEmail';
import Dashboard from '@/pages/Dashboard';
import RegistroDiario from '@/pages/RegistroDiario';
import SessoesFoco from '@/pages/SessoesFoco';
import Analytics from '@/pages/Analytics';
import Perfil from '@/pages/Perfil';

const router = createBrowserRouter([
  { path: '/login',           element: <AuthPage /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password',  element: <ResetPassword /> },
  { path: '/verify-email',    element: <VerifyEmail /> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true,       element: <Dashboard /> },
      { path: 'registro',  element: <RegistroDiario /> },
      { path: 'sessoes',   element: <SessoesFoco /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'perfil',    element: <Perfil /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
], {
  future: { v7_startTransition: true, v7_relativeSplatPath: true },
});

export default function App() {
  const init = useAuthStore(s => s.init);
  useEffect(() => { init(); }, [init]);
  return <RouterProvider router={router} />;
}
