export type SettingsSection = 'general' | 'profile' | 'notifications' | 'ai' | 'appearance';

export interface NotificationPreferences {
  updates: boolean;
  alerts: boolean;
  reminders: boolean;
  desktop: boolean;
  sounds: boolean;
  digest: boolean;
}

export interface AppearancePreferences {
  density: 'comfortable' | 'compact';
  reduceMotion: boolean;
  accent: 'notorious-blue' | 'steel' | 'emerald';
}

export interface ProfilePreferences {
  phone: string;
  role: string;
  company: string;
  city: string;
  country: string;
  bio: string;
  language: string;
  timezone: string;
  publicProfile: boolean;
  productTips: boolean;
}

export interface LocalSettingsV1 {
  notifications: NotificationPreferences;
  appearance: AppearancePreferences;
  profile: ProfilePreferences;
}

export const LOCAL_SETTINGS_STORAGE_KEY = 'notorious_settings_v1';

export const DEFAULT_LOCAL_SETTINGS: LocalSettingsV1 = {
  notifications: {
    updates: true,
    alerts: true,
    reminders: true,
    desktop: true,
    sounds: false,
    digest: true,
  },
  appearance: {
    density: 'comfortable',
    reduceMotion: false,
    accent: 'notorious-blue',
  },
  profile: {
    phone: '',
    role: '',
    company: '',
    city: '',
    country: '',
    bio: '',
    language: 'fr-FR',
    timezone: 'Africa/Kinshasa',
    publicProfile: false,
    productTips: true,
  },
};
