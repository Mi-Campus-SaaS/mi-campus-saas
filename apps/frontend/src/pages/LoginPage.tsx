import React, { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useTranslation } from "react-i18next";
import { loginSchema } from "../validation/schemas";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
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
        if (issue.path[0] === "username")
          fieldErrors.username = t(issue.message);
        if (issue.path[0] === "password")
          fieldErrors.password = t(issue.message);
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await login(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">{t("login")}</h1>
        <input
          className="border rounded p-2 w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("username")}
          aria-label={t("username")}
        />
        {errors.username && (
          <div className="text-xs text-red-600">{errors.username}</div>
        )}
        <input
          className="border rounded p-2 w-full"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("password")}
          aria-label={t("password")}
        />
        {errors.password && (
          <div className="text-xs text-red-600">{errors.password}</div>
        )}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          type="submit"
        >
          {t("login")}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
