import { useAuth } from './useAuth';
import { checkFeature, getFeatureMessage, getAvailableFeatures, type FeatureKey } from './features';

export const useFeature = (feature: FeatureKey): boolean => {
  const { user } = useAuth();
  return checkFeature(feature, user?.role);
};

export const useFeatureMessage = (feature: FeatureKey): string => {
  return getFeatureMessage(feature);
};

export const useAvailableFeatures = (): FeatureKey[] => {
  const { user } = useAuth();
  return getAvailableFeatures(user?.role);
};

export const useCan = (feature: FeatureKey): boolean => {
  return useFeature(feature);
};

export const useCannot = (feature: FeatureKey): boolean => {
  return !useFeature(feature);
};
