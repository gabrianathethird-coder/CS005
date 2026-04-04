import { useEffect } from 'react';
import { useNavigate } from 'react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem('aegis_key_available');
    const hasKey = !!(window as any).aegisKey;

    if (!isUnlocked || !hasKey) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const isUnlocked = sessionStorage.getItem('aegis_key_available');
  const hasKey = !!(window as any).aegisKey;

  if (!isUnlocked || !hasKey) {
    return null;
  }

  return <>{children}</>;
}
