import React from 'react';
import { useAuth } from '../auth/useAuth';
import { useTranslation } from 'react-i18next';
import { loginSchema } from '../validation/schemas';
import { LogIn } from 'lucide-react';
import styles from './LoginPage.module.css';
import { useZodForm } from '../hooks/useZodForm';
import Field from '../components/forms/Field';
import { PasswordField, TextField } from '../components/forms/inputs';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, verify2fa } = useAuth();
  const form = useZodForm(loginSchema, { username: 'admin', password: 'admin123' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [requires2fa, setRequires2fa] = React.useState(false);
  const [twoFactorCode, setTwoFactorCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await login(data.username, data.password);
      if (result && result.requires2fa) {
        setRequires2fa(true);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; details?: string } } };
      const errorMessage =
        axiosError.response?.data?.message || axiosError.response?.data?.details || t('login_failed') || 'Login failed';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  });

  const onVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length < 6) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await verify2fa(form.values.username, form.values.password, twoFactorCode);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; details?: string } } };
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.details ||
        t('verification_failed') ||
        'Verification failed';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${styles.container}`}>
      <div className="card rounded-lg shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <LogIn className={`w-6 h-6 ${styles.icon}`} aria-hidden="true" />
          <h1 className={`text-2xl font-semibold ${styles.title}`}>{t('login')}</h1>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
        {!requires2fa ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field id="username" label={t('username')} error={form.errors.username && t(form.errors.username)}>
              <TextField
                id="username"
                value={form.values.username}
                onChange={(v) => form.setField('username', v)}
                placeholder={t('username')}
                className={styles.input}
              />
            </Field>

            <Field id="password" label={t('password')} error={form.errors.password && t(form.errors.password)}>
              <PasswordField
                id="password"
                value={form.values.password}
                onChange={(v) => form.setField('password', v)}
                placeholder={t('password')}
                className={styles.input}
              />
            </Field>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting}
              {...(isSubmitting && { 'aria-busy': 'true' })}
            >
              {isSubmitting ? t('loading') : t('login')}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerify2fa} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">{t('two_factor_required') || 'Please enter your 2FA code'}</p>
            <Field id="twoFactorCode" label={t('two_factor_code') || '2FA Code'}>
              <TextField
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(v) => setTwoFactorCode(v)}
                placeholder={t('two_factor_code') || '000000'}
                className={styles.input}
                maxLength={8}
                autoFocus
              />
            </Field>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting || twoFactorCode.length < 6}
              {...(isSubmitting && { 'aria-busy': 'true' })}
            >
              {isSubmitting ? t('loading') : t('verify') || 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRequires2fa(false);
                setTwoFactorCode('');
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline w-full"
            >
              {t('back') || 'Back'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
