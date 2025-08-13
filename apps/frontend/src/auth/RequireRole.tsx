import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

export const RequireRole: React.FC<{ roles?: Array<'student' | 'parent' | 'teacher' | 'admin'> }> = ({ roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/es/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/es" replace />;
  return <Outlet />;
};

