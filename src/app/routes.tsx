import { createBrowserRouter } from 'react-router';
import { AuthenticationScreen } from './pages/AuthenticationScreen';
import { SecureDrive } from './pages/SecureDrive';
import { AuditLog } from './pages/AuditLog';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AuthenticationScreen,
  },
  {
    path: '/vault',
    element: (
      <ProtectedRoute>
        <SecureDrive />
      </ProtectedRoute>
    ),
  },
  {
    path: '/audit',
    element: (
      <ProtectedRoute>
        <AuditLog />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    Component: AuthenticationScreen,
  },
]);
