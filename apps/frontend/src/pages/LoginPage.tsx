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
  const { login } = useAuth();
  const form = useZodForm(loginSchema, { username: 'admin', password: 'admin123' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await login(data.username, data.password);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${styles.container}`}>
      <div className="card rounded-lg shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <LogIn className={`w-6 h-6 ${styles.icon}`} aria-hidden="true" />
          <h1 className={`text-2xl font-semibold ${styles.title}`}>{t('login')}</h1>
        </div>

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
      </div>
    </div>
  );
};

export default LoginPage;
