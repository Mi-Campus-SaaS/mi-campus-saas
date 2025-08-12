import React from 'react';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{t('dashboard')}</h1>
      <p>Bienvenido a Mi Campus.</p>
    </div>
  );
};

export default Dashboard;

