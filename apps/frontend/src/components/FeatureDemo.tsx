import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/useAuth';
import { useAvailableFeatures } from '../auth/useFeatures';
import { FeatureGate, FeatureButton } from './FeatureGate';
import { Shield, Users, BookOpen, Calendar, Bell, DollarSign, Settings } from 'lucide-react';

const FeatureDemo: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const availableFeatures = useAvailableFeatures();

  const featureGroups = [
    {
      title: 'Student Management',
      icon: Users,
      features: ['students.view', 'students.create', 'students.edit', 'students.delete'] as const,
    },
    {
      title: 'Class Management',
      icon: BookOpen,
      features: ['classes.view', 'classes.create', 'classes.edit', 'classes.delete', 'classes.enroll'] as const,
    },
    {
      title: 'Schedule',
      icon: Calendar,
      features: ['schedule.view', 'schedule.edit'] as const,
    },
    {
      title: 'Announcements',
      icon: Bell,
      features: ['announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete'] as const,
    },
    {
      title: 'Finance',
      icon: DollarSign,
      features: ['finance.view', 'finance.create', 'finance.edit', 'finance.delete'] as const,
    },
    {
      title: 'Settings',
      icon: Settings,
      features: ['settings.view', 'settings.edit'] as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">{t('feature_flag_demo')}</h2>
        </div>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          {t('current_user')}: <strong>{user?.displayName}</strong> ({user?.role})
        </p>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          {t('available_features')}: {availableFeatures.length}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.title}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-medium text-gray-900 dark:text-white">{group.title}</h3>
              </div>
              <div className="space-y-2">
                {group.features.map((feature) => (
                  <FeatureGate key={feature} feature={feature}>
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <span className="text-sm text-green-800 dark:text-green-200">{feature}</span>
                      <FeatureButton
                        feature={feature}
                        onClick={() => console.log(`Clicked ${feature}`)}
                        size="sm"
                        variant="outline"
                      >
                        {t('test')}
                      </FeatureButton>
                    </div>
                  </FeatureGate>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('available_features_list')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {availableFeatures.map((feature) => (
            <div
              key={feature}
              className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureDemo;
