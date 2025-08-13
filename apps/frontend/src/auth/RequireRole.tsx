import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from './useAuth';

export const RequireRole: React.FC<{ roles?: Array<'student' | 'parent' | 'teacher' | 'admin'> }> = ({ roles }) => {
  const { user } = useAuth();
  const { locale = 'es' } = useParams();
  if (!user) return <Navigate to={`/${locale}/login`} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${locale}`} replace />;
  return <Outlet />;
};

