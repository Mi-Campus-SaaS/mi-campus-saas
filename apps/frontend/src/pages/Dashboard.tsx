import React from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton, SkeletonText } from '../components/Skeleton';
import FeatureDemo from '../components/FeatureDemo';
import { Home } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Home className={`w-6 h-6 ${styles.icon}`} />
        <h1 className={`text-xl font-semibold ${styles.title}`}>{t('dashboard')}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card rounded-lg shadow-sm p-4">
          <Skeleton className="w-32 h-4" />
          <SkeletonText lines={3} />
        </div>
        <div className="card rounded-lg shadow-sm p-4">
          <Skeleton className="w-32 h-4" />
          <SkeletonText lines={3} />
        </div>
        <div className="card rounded-lg shadow-sm p-4">
          <Skeleton className="w-32 h-4" />
          <SkeletonText lines={3} />
        </div>
      </div>

      <div className="card rounded-lg shadow-sm p-6">
        <FeatureDemo />
      </div>
    </div>
  );
};

export default Dashboard;
