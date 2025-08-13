import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">{t('login')}</h1>
        <input className="border rounded p-2 w-full" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="usuario" />
        <input className="border rounded p-2 w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="contraseña" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{t('login')}</button>
      </form>
    </div>
  );
};

export default LoginPage;

