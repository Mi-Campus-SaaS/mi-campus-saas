import React from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton, SkeletonText } from '../components/Skeleton';
import FeatureDemo from '../components/FeatureDemo';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight dark:text-white">{t('dashboard')}</h1>
      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <div className="card p-4 dark:bg-gray-800 dark:border-gray-700">
          <Skeleton className="w-32 h-4" />
          <SkeletonText lines={3} />
        </div>
        <div className="card p-4 dark:bg-gray-800 dark:border-gray-700">
          <Skeleton className="w-32 h-4" />
          <SkeletonText lines={3} />
        </div>
        <div className="card p-4 dark:bg-gray-800 dark:border-gray-700">
          <Skeleton className="w-32 h-4" />
          <SkeletonText lines={3} />
        </div>
      </div>

      {/* Feature Flag System Demo */}
      <div className="mt-8">
        <FeatureDemo />
      </div>
    </div>
  );
};

export default Dashboard;
