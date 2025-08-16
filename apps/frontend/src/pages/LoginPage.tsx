import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useTranslation } from 'react-i18next';
import { loginSchema } from '../validation/schemas';
import { LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ username, password });
    if (!result.success) {
      const fieldErrors: { username?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === 'username') fieldErrors.username = t(issue.message);
        if (issue.path[0] === 'password') fieldErrors.password = t(issue.message);
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await login(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="card rounded-lg shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <LogIn className="w-6 h-6" style={{ color: 'var(--fg)' }} />
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--fg)' }}>
            {t('login')}
          </h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm mb-1" style={{ color: 'var(--muted)' }}>
              {t('username')}
            </label>
            <input
              id="username"
              className="border rounded p-2 w-full"
              style={{
                borderColor: 'var(--card-border)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--fg)',
              }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('username')}
              aria-label={t('username')}
            />
            {errors.username && <div className="text-xs text-red-600 dark:text-red-400">{errors.username}</div>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1" style={{ color: 'var(--muted)' }}>
              {t('password')}
            </label>
            <input
              id="password"
              className="border rounded p-2 w-full"
              style={{
                borderColor: 'var(--card-border)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--fg)',
              }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password')}
              aria-label={t('password')}
            />
            {errors.password && <div className="text-xs text-red-600 dark:text-red-400">{errors.password}</div>}
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700" type="submit">
            {t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
