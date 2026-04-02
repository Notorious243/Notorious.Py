import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronsUpDown,
  CircleAlert,
  Eye,
  EyeOff,
  Filter,
  Paintbrush2,
  Save,
  Settings2,
  Sparkles,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { fr } from 'date-fns/locale';

import type { ApiKeys, Provider, ProviderToggleMap } from '@/components/builder/dayanna-ai/types';
import { ProviderBrandIcon } from '@/components/builder/dayanna-ai/provider-brand-icons';
import {
  defaultNotificationsFr,
  type NotificationCategory,
} from '@/components/builder/NotificationsFilter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/useAuth';
import { BackgroundPathsLayer } from '@/components/ui/background-paths';
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { fetchApiKeysFromSupabase, saveApiKeysToSupabase } from '@/lib/supabaseService';
import {
  capitalizeFirstLetter,
  getFormattedDisplayName,
  getFormattedFirstName,
  getFormattedLastName,
  getUserInitials,
} from '@/lib/userProfile';
import {
  DEFAULT_LOCAL_SETTINGS,
  LOCAL_SETTINGS_STORAGE_KEY,
  type LocalSettingsV1,
  type SettingsSection,
} from '@/types/settings';
import {
  COUNTRY_OPTIONS,
  NATIONALITY_OPTIONS,
  normalizeCountryLabel,
  normalizeNationalityLabel,
  type CountryOption,
} from '@/lib/country-nationality';

type SettingsHubProps = {
  onClose: () => void;
  initialSection: SettingsSection;
};

const DEFAULT_PROVIDER_TOGGLES: ProviderToggleMap = {
  google: true,
  openai: true,
  anthropic: true,
  huggingface: true,
  openrouter: true,
  groq: true,
  deepseek: true,
};

const getProviderToggleStorageKey = (userId: string | null | undefined) =>
  `dayanna:provider-toggles:${userId || 'guest'}`;

const PROFILE_IMAGE_MAX_BYTES = 1024 * 1024;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeBirthDate = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (ISO_DATE_PATTERN.test(trimmed)) return trimmed;

  const frMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (frMatch) {
    const [, day, month, year] = frMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-');
};

const AI_FIELDS: {
  key: keyof ApiKeys;
  provider: Provider;
  label: string;
  placeholder: string;
  free?: boolean;
}[] = [
  { key: 'google', provider: 'google', label: 'Google Gemini', placeholder: 'AIzaSy...' },
  { key: 'openrouter', provider: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...', free: true },
  { key: 'groq', provider: 'groq', label: 'Groq', placeholder: 'gsk_...', free: true },
  { key: 'openai', provider: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { key: 'anthropic', provider: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { key: 'deepseek', provider: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...' },
  { key: 'huggingface', provider: 'huggingface', label: 'Hugging Face', placeholder: 'hf_...', free: true },
];

const sectionItems: {
  key: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'general', label: 'General', icon: Settings2 },
  { key: 'profile', label: 'Mon profil', icon: UserRound },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'ai', label: 'IA et cles API', icon: Sparkles },
  { key: 'appearance', label: 'Apparence', icon: Paintbrush2 },
];

const PythonGlyph = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 110 110"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M53.8,4.1c-24.8,0-23.3,10.7-23.3,10.7l0,11h23.8v3.4H30.4c0,0-15.3,2.4-15.3,21.8c0,19.4,13.3,20.6,13.3,20.6h6.7v-9.6c0,0-0.4-11.2,11.4-11.2h16c0,0,10.1-0.8,10.1-10.5V14.1C72.5,14.1,72.6,4.1,53.8,4.1z M39.4,11.5c2.4,0,4.4,2,4.4,4.4c0,2.4-2,4.4-4.4,4.4c-2.4,0-4.4-2-4.4-4.4C35.1,13.5,37,11.5,39.4,11.5z" />
    <path d="M55.7,105.8c24.8,0,23.3-10.7,23.3-10.7l0-11H55.2v-3.4h23.8c0,0,15.3-2.4,15.3-21.8c0-19.4-13.3-20.6-13.3-20.6H74.3v9.6c0,0,0.4,11.2-11.4,11.2H46.9c0,0-10.1,0.8-10.1,10.5v26.2C36.9,95.8,36.8,105.8,55.7,105.8z M70.1,98.4c-2.4,0-4.4-2-4.4-4.4c0-2.4,2-4.4,4.4-4.4c2.4,0,4.4,2,4.4,4.4C74.5,96.4,72.5,98.4,70.1,98.4z" />
  </svg>
);

type ProfileComboboxProps = {
  id: string;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  value: string;
  options: CountryOption[];
  onChange: (nextValue: string) => void;
};

function ProfileCombobox({
  id,
  label,
  placeholder,
  searchPlaceholder,
  emptyText,
  value,
  options,
  onChange,
}: ProfileComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.label === value) ?? null;

  return (
    <Field className="space-y-2">
      <FieldLabel htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 w-full justify-between border-slate-200 bg-white px-3 text-left font-normal text-slate-700"
          >
            <span className="truncate text-sm text-slate-700">
              {selectedOption ? `${selectedOption.flag} ${selectedOption.label}` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-500 opacity-80" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-[95] w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-72">
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = option.label === value;

                  return (
                    <CommandItem
                      key={option.code}
                      value={`${option.label} ${option.searchLabel} ${option.code} ${option.flag}`}
                      onSelect={() => {
                        onChange(option.label);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate text-sm">
                        {option.flag} {option.label}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export function SettingsHub({ onClose, initialSection }: SettingsHubProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [settings, setSettings] = useState<LocalSettingsV1>(DEFAULT_LOCAL_SETTINGS);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [nationality, setNationality] = useState('');
  const [isBirthDateOpen, setIsBirthDateOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [providerToggles, setProviderToggles] = useState<ProviderToggleMap>(DEFAULT_PROVIDER_TOGGLES);
  const [isLoadingAiSettings, setIsLoadingAiSettings] = useState(false);
  const [isSavingAiSettings, setIsSavingAiSettings] = useState(false);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Partial<Record<keyof ApiKeys, boolean>>>({});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState('');
  const [pendingAvatarDataUrl, setPendingAvatarDataUrl] = useState<string | null>(null);
  const [selectedNotificationCategory, setSelectedNotificationCategory] = useState<
    'all' | NotificationCategory
  >('all');

  const convertFileToDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('invalid_result'));
          return;
        }
        resolve(reader.result);
      };
      reader.onerror = () => reject(new Error('read_error'));
      reader.readAsDataURL(file);
    });
  }, []);

  const [
    { files: avatarFiles, isDragging: isAvatarDragging, errors: avatarUploadErrors },
    {
      inputRef: avatarInputRef,
      clearFiles: clearAvatarFiles,
      removeFile: removeAvatarFile,
      handleDragEnter: handleAvatarDragEnter,
      handleDragLeave: handleAvatarDragLeave,
      handleDragOver: handleAvatarDragOver,
      handleDrop: handleAvatarDrop,
      openFileDialog: openAvatarFileDialog,
      getInputProps: getAvatarInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize: PROFILE_IMAGE_MAX_BYTES,
    accept: 'image/*',
    multiple: false,
    onFilesChange: (files) => {
      const selectedFile = files[0];
      if (!selectedFile) {
        setPendingAvatarDataUrl(null);
        return;
      }
      void convertFileToDataUrl(selectedFile.file)
        .then((dataUrl) => {
          setPendingAvatarDataUrl(dataUrl);
          toast.success('Photo prete. Cliquez sur "Enregistrer le profil".');
        })
        .catch(() => {
          setPendingAvatarDataUrl(null);
          toast.error("Impossible de charger l'image.");
        });
    },
  });

  const activeAvatarFile = avatarFiles[0] ?? null;
  const isGuest = !user;
  const displayName = getFormattedDisplayName(user);
  const email = user?.email ?? 'Aucune adresse e-mail';
  const initials = getUserInitials(user);
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? '';
  const displayedAvatarUrl = pendingAvatarDataUrl ?? activeAvatarFile?.preview ?? localAvatarUrl;
  const profileInitial = (capitalizeFirstLetter(firstName).charAt(0) || initials.charAt(0) || 'U').toUpperCase();

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    setFirstName(getFormattedFirstName(user));
    setLastName(getFormattedLastName(user));
    setBirthDate(normalizeBirthDate((user?.user_metadata?.birth_date as string | undefined) ?? ''));
    setCountry(normalizeCountryLabel((user?.user_metadata?.country as string | undefined) ?? ''));
    setNationality(normalizeNationalityLabel((user?.user_metadata?.nationality as string | undefined) ?? ''));
  }, [user]);

  useEffect(() => {
    setLocalAvatarUrl(avatarUrl);
    setPendingAvatarDataUrl(null);
    clearAvatarFiles();
  }, [avatarUrl, clearAvatarFiles, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncMotionPreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMotionPreference);
      return () => mediaQuery.removeEventListener('change', syncMotionPreference);
    }

    mediaQuery.addListener(syncMotionPreference);
    return () => mediaQuery.removeListener(syncMotionPreference);
  }, []);

  useEffect(() => {
    const detectedLanguage = typeof navigator !== 'undefined' ? navigator.language : 'fr-FR';
    const detectedTimezone =
      typeof Intl !== 'undefined' && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'Africa/Kinshasa';

    setSettings((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        language: prev.profile.language || detectedLanguage,
        timezone: prev.profile.timezone || detectedTimezone,
      },
    }));
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_SETTINGS_STORAGE_KEY);
      if (!raw) {
        setSettings(DEFAULT_LOCAL_SETTINGS);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<LocalSettingsV1>;
      setSettings({
        notifications: {
          ...DEFAULT_LOCAL_SETTINGS.notifications,
          ...(parsed.notifications ?? {}),
        },
        appearance: {
          ...DEFAULT_LOCAL_SETTINGS.appearance,
          ...(parsed.appearance ?? {}),
        },
        profile: {
          ...DEFAULT_LOCAL_SETTINGS.profile,
          ...(parsed.profile ?? {}),
        },
      });
    } catch {
      setSettings(DEFAULT_LOCAL_SETTINGS);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignored: localStorage unavailable.
    }
  }, [settings]);

  useEffect(() => {
    const storageKey = getProviderToggleStorageKey(user?.id);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setProviderToggles(DEFAULT_PROVIDER_TOGGLES);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<ProviderToggleMap>;
      setProviderToggles({
        ...DEFAULT_PROVIDER_TOGGLES,
        ...Object.fromEntries(
          Object.entries(parsed).map(([provider, enabled]) => [provider, Boolean(enabled)])
        ),
      } as ProviderToggleMap);
    } catch {
      setProviderToggles(DEFAULT_PROVIDER_TOGGLES);
    }
  }, [user?.id]);

  useEffect(() => {
    const storageKey = getProviderToggleStorageKey(user?.id);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(providerToggles));
    } catch {
      // Ignored: localStorage unavailable.
    }
  }, [providerToggles, user?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setApiKeys({});
      return;
    }

    (async () => {
      setIsLoadingAiSettings(true);
      try {
        const dbKeys = await fetchApiKeysFromSupabase();
        if (cancelled) return;
        setApiKeys((dbKeys ?? {}) as ApiKeys);
      } catch {
        if (!cancelled) toast.error("Impossible de charger les cles API.");
      } finally {
        if (!cancelled) setIsLoadingAiSettings(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const notificationItems = useMemo(() => {
    return selectedNotificationCategory === 'all'
      ? defaultNotificationsFr
      : defaultNotificationsFr.filter((item) => item.category === selectedNotificationCategory);
  }, [selectedNotificationCategory]);

  const configuredProvidersCount = useMemo(
    () => AI_FIELDS.filter(({ key }) => Boolean(apiKeys[key]?.trim())).length,
    [apiKeys]
  );

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error('Connexion requise pour modifier le profil.');
      return;
    }

    const nextFirstName = capitalizeFirstLetter(firstName);
    const nextLastName = capitalizeFirstLetter(lastName);

    if (!nextFirstName) {
      toast.error('Le prenom est obligatoire.');
      return;
    }

    setIsProfileSaving(true);
    const fullName = [nextFirstName, nextLastName].filter(Boolean).join(' ').trim();
    const normalizedCountry = normalizeCountryLabel(country.trim());
    const normalizedNationality = normalizeNationalityLabel(nationality.trim());
    const metadataPayload: Record<string, string> = {
      first_name: nextFirstName,
      last_name: nextLastName,
      full_name: fullName,
      birth_date: birthDate,
      country: normalizedCountry,
      nationality: normalizedNationality,
    };
    if (pendingAvatarDataUrl) {
      metadataPayload.avatar_url = pendingAvatarDataUrl;
    }

    const { error } = await supabase.auth.updateUser({
      data: metadataPayload,
    });

    if (error) {
      toast.error(error.message || 'Echec de mise a jour du profil.');
      setIsProfileSaving(false);
      return;
    }

    setFirstName(nextFirstName);
    setLastName(nextLastName);
    setCountry(normalizedCountry);
    setNationality(normalizedNationality);
    if (pendingAvatarDataUrl) {
      setLocalAvatarUrl(pendingAvatarDataUrl);
      setPendingAvatarDataUrl(null);
      if (activeAvatarFile) {
        removeAvatarFile(activeAvatarFile.id);
      }
    }
    setIsProfileSaving(false);
    toast.success('Profil mis a jour avec succes.');
  };

  const handleSaveAiSettings = async () => {
    if (!user) {
      toast.error('Connexion requise pour enregistrer les cles API.');
      return;
    }

    setIsSavingAiSettings(true);
    try {
      await saveApiKeysToSupabase(apiKeys as Record<string, string | undefined>);
      toast.success('Parametres IA enregistres.');
    } catch {
      toast.error("Impossible d'enregistrer les cles API.");
    } finally {
      setIsSavingAiSettings(false);
    }
  };

  const renderGeneralSection = () => (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-white/80 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Vue d'ensemble</h3>
        <p className="mt-1 text-sm text-slate-600">
          Cette page centralise toutes les configurations principales de Notorious.PY.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[#0F3460]/20 bg-[#0F3460]/5 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Type de compte</p>
            <p className="mt-1 text-sm font-semibold text-[#0F3460]">Premium</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Profil actif</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{displayName}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Notifications</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {settings.notifications.alerts ? 'Alertes activees' : 'Alertes desactivees'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white/80 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Acces rapide</h3>
        <p className="mt-1 text-sm text-slate-600">
          Accedez directement aux sections les plus utilisees.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setActiveSection('profile')}>
            Modifier mon profil
          </Button>
          <Button variant="outline" onClick={() => setActiveSection('notifications')}>
            Gerer les notifications
          </Button>
          <Button variant="outline" onClick={() => setActiveSection('ai')}>
            Configurer les cles API
          </Button>
        </div>
      </div>
    </section>
  );

  const renderProfileSection = () => {
    const profileMotifs: Array<{
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
      size: number;
      opacity: number;
      duration: string;
      delay: string;
    }> = [
      { top: '14%', left: '10%', size: 15, opacity: 0.05, duration: '17s', delay: '0s' },
      { top: '24%', right: '11%', size: 14, opacity: 0.05, duration: '18s', delay: '1.1s' },
      { bottom: '30%', left: '17%', size: 12, opacity: 0.04, duration: '16s', delay: '0.5s' },
      { bottom: '24%', right: '14%', size: 16, opacity: 0.05, duration: '19s', delay: '1.3s' },
      { top: '48%', left: '4%', size: 11, opacity: 0.04, duration: '15s', delay: '0.9s' },
      { top: '44%', right: '5%', size: 11, opacity: 0.04, duration: '15s', delay: '1.6s' },
    ];
    const subtleFlowPaths = [
      { d: 'M -30 78 C 170 42, 335 136, 620 64', width: 1.1, opacity: 0.08, delay: '0s' },
      { d: 'M -20 122 C 178 80, 342 168, 632 102', width: 0.95, opacity: 0.07, delay: '1.2s' },
      { d: 'M -34 166 C 164 136, 358 226, 624 158', width: 0.9, opacity: 0.06, delay: '2.1s' },
    ];
    const headerCodeMotifs: Array<{
      token: string;
      top: string;
      right?: string;
      left?: string;
      opacity: number;
    }> = [
      { token: '</>', top: '10%', left: '18%', opacity: 0.24 },
      { token: '{ }', top: '20%', right: '21%', opacity: 0.22 },
      { token: 'fn()', top: '64%', left: '12%', opacity: 0.2 },
      { token: 'py', top: '62%', right: '15%', opacity: 0.21 },
      { token: '[ ]', top: '40%', right: '6%', opacity: 0.19 },
    ];
    const formCodeMotifs: Array<{
      token: string;
      top: string;
      right?: string;
      left?: string;
      opacity: number;
    }> = [
      { token: 'class', top: '12%', left: '5%', opacity: 0.09 },
      { token: 'import', top: '16%', right: '7%', opacity: 0.08 },
      { token: 'if ()', top: '56%', left: '9%', opacity: 0.08 },
      { token: 'return', top: '54%', right: '11%', opacity: 0.08 },
      { token: 'dict{}', top: '80%', left: '14%', opacity: 0.07 },
      { token: 'API', top: '82%', right: '16%', opacity: 0.07 },
    ];
    const disableMotion = settings.appearance.reduceMotion || prefersReducedMotion;
    const avatarInputProps = getAvatarInputProps();

    return (
      <section className="flex h-full items-center justify-center py-1">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="overflow-hidden border-[#0F3460]/14 bg-white/90 shadow-[0_20px_48px_rgba(15,52,96,0.12)]">
            <CardHeader className="relative overflow-hidden border-b border-[#0F3460]/10 px-5 pb-5 pt-5 sm:px-7">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(246,249,255,0.96)_0%,rgba(237,243,252,0.92)_52%,rgba(229,239,252,0.9)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(15,52,96,0.09),transparent_34%),radial-gradient(circle_at_84%_16%,rgba(31,90,160,0.08),transparent_33%)]" />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.11]"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(15,52,96,0.22) 0.65px, transparent 0.65px)',
                  backgroundSize: '24px 24px',
                }}
              />

              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                viewBox="0 0 640 220"
                fill="none"
                aria-hidden="true"
              >
                {subtleFlowPaths.map((path, index) => (
                  <path
                    key={`profile-flow-${index}`}
                    d={path.d}
                    style={{
                      stroke: '#0F3460',
                      strokeWidth: path.width,
                      opacity: path.opacity,
                      strokeDasharray: '8 12',
                      animation: disableMotion
                        ? undefined
                        : 'settings-profile-line-shift 28s linear infinite',
                      animationDelay: path.delay,
                    }}
                  />
                ))}
              </svg>

              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {profileMotifs.map((motif, index) => (
                  <div
                    key={index}
                    className="absolute text-[#0F3460]"
                    style={{
                      top: motif.top,
                      right: motif.right,
                      bottom: motif.bottom,
                      left: motif.left,
                      width: motif.size,
                      height: motif.size,
                      opacity: motif.opacity,
                      animation: disableMotion
                        ? undefined
                        : `settings-profile-motif-float ${motif.duration} ease-in-out infinite`,
                      animationDelay: motif.delay,
                    }}
                  >
                    <PythonGlyph className="h-full w-full" />
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-0 overflow-hidden font-mono">
                {headerCodeMotifs.map((motif, index) => (
                  <span
                    key={`header-token-${index}`}
                    className="absolute text-[12px] font-semibold tracking-[0.12em] text-[#0F3460]"
                    style={{
                      top: motif.top,
                      right: motif.right,
                      left: motif.left,
                      opacity: motif.opacity,
                      animation: disableMotion
                        ? undefined
                        : `settings-profile-token-float ${12 + index * 1.5}s ease-in-out infinite`,
                    }}
                  >
                    {motif.token}
                  </span>
                ))}
              </div>

              <div className="relative z-10 mx-auto w-full max-w-3xl">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div
                      className={cn(
                        'cursor-pointer rounded-full bg-gradient-to-b from-[#d7e4f8] to-[#c3d6f0] p-[2px] shadow-[0_16px_32px_rgba(15,52,96,0.2)] transition-all',
                        isAvatarDragging && 'scale-[1.02] ring-4 ring-[#1F5AA0]/25'
                      )}
                      onDragEnter={handleAvatarDragEnter}
                      onDragLeave={handleAvatarDragLeave}
                      onDragOver={handleAvatarDragOver}
                      onDrop={handleAvatarDrop}
                      onClick={openAvatarFileDialog}
                    >
                      <div className="rounded-full border border-white/85 bg-white/82 p-[4px]">
                        <Avatar className="h-28 w-28 rounded-full border-2 border-[#0F3460]/20 bg-white/80">
                          <AvatarImage
                            src={displayedAvatarUrl || undefined}
                            alt={displayName}
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-full bg-[#0F3460] text-3xl font-semibold text-white">
                            {profileInitial}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <input ref={avatarInputRef} {...avatarInputProps} className="sr-only" />
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openAvatarFileDialog();
                      }}
                      title="Changer la photo de profil"
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0F3460] text-white shadow-[0_8px_16px_rgba(15,52,96,0.3)] transition hover:scale-105 hover:bg-[#1F5AA0]"
                    >
                      <PythonGlyph className="h-4 w-4" />
                    </button>
                    {activeAvatarFile ? (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeAvatarFile(activeAvatarFile.id);
                          setPendingAvatarDataUrl(null);
                        }}
                        className="absolute -left-1 -top-1 h-7 w-7 rounded-full border border-slate-200 bg-white/90 shadow-sm hover:bg-white"
                        aria-label="Retirer la photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-slate-900">{displayName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{email}</p>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    <Badge className="border border-[#0F3460]/20 bg-gradient-to-r from-[#1E4F9A] to-[#2C67C3] text-white hover:from-[#1E4F9A] hover:to-[#2C67C3]">
                      <Star className="mr-1.5 h-3 w-3 fill-current" />
                      Premium
                    </Badge>
                    {pendingAvatarDataUrl ? (
                      <span className="text-xs font-medium text-[#0F3460]">Photo prete a enregistrer</span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    {activeAvatarFile
                      ? `Photo selectionnee: ${activeAvatarFile.name} (${formatBytes(activeAvatarFile.size)})`
                      : `PNG, JPG, WEBP jusqu'a ${formatBytes(PROFILE_IMAGE_MAX_BYTES)}`}
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    Cliquez sur le badge Python bleu ou deposez une image sur l'avatar.
                  </p>
                  {avatarUploadErrors.length > 0 ? (
                    <Alert variant="destructive" className="mt-3 w-full max-w-xl text-left">
                      <CircleAlert className="h-4 w-4" />
                      <AlertTitle>Import impossible</AlertTitle>
                      <AlertDescription>
                        {avatarUploadErrors.map((error, index) => (
                          <p key={`${error}-${index}`}>{error}</p>
                        ))}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative mx-auto w-full max-w-3xl overflow-hidden px-5 pt-5 sm:px-7">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(100,116,139,0.22) 0.62px, transparent 0.62px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="pointer-events-none absolute inset-0 overflow-hidden font-mono">
                {formCodeMotifs.map((motif, index) => (
                  <span
                    key={`form-token-${index}`}
                    className="absolute text-[10px] font-medium tracking-[0.08em] text-slate-500"
                    style={{
                      top: motif.top,
                      right: motif.right,
                      left: motif.left,
                      opacity: motif.opacity,
                      animation: disableMotion
                        ? undefined
                        : `settings-profile-token-float ${16 + index * 1.7}s ease-in-out infinite`,
                    }}
                  >
                    {motif.token}
                  </span>
                ))}
              </div>

              <div className="relative z-10 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="profile-firstname"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                  >
                    Prenom
                  </Label>
                  <Input
                    id="profile-firstname"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Votre prenom"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="profile-lastname"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                  >
                    Nom
                  </Label>
                  <Input
                    id="profile-lastname"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Votre nom"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor="profile-email"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                  >
                    Adresse e-mail
                  </Label>
                  <Input
                    id="profile-email"
                    value={email}
                    disabled
                    className="cursor-not-allowed border-[#0F3460]/15 bg-slate-100/90 text-slate-500"
                  />
                </div>

                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor="profile-birthdate"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                  >
                    Date de naissance
                  </FieldLabel>
                  <Popover open={isBirthDateOpen} onOpenChange={setIsBirthDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        id="profile-birthdate"
                        className="h-11 w-full justify-start border-slate-200 bg-white text-left font-normal text-slate-700"
                      >
                        <CalendarDays className="mr-2 h-4 w-4 text-slate-500" />
                        {birthDate
                          ? new Date(`${birthDate}T12:00:00`).toLocaleDateString('fr-FR')
                          : 'Selectionner une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="z-[95] w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate ? new Date(`${birthDate}T12:00:00`) : undefined}
                        defaultMonth={birthDate ? new Date(`${birthDate}T12:00:00`) : undefined}
                        captionLayout="dropdown"
                        locale={fr}
                        onSelect={(date) => {
                          if (!date) {
                            setBirthDate('');
                            setIsBirthDateOpen(false);
                            return;
                          }
                          const isoDate = [
                            date.getFullYear(),
                            String(date.getMonth() + 1).padStart(2, '0'),
                            String(date.getDate()).padStart(2, '0'),
                          ].join('-');
                          setBirthDate(isoDate);
                          setIsBirthDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <ProfileCombobox
                  id="profile-country"
                  label="Pays"
                  placeholder="Selectionner un pays"
                  searchPlaceholder="Rechercher un pays..."
                  emptyText="Aucun pays trouve."
                  value={country}
                  options={COUNTRY_OPTIONS}
                  onChange={setCountry}
                />

                <div className="sm:col-span-2">
                  <ProfileCombobox
                    id="profile-nationality"
                    label="Nationalite"
                    placeholder="Selectionner une nationalite"
                    searchPlaceholder="Rechercher une nationalite..."
                    emptyText="Aucune nationalite trouvee."
                    value={nationality}
                    options={NATIONALITY_OPTIONS}
                    onChange={setNationality}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="mx-auto w-full max-w-3xl justify-end border-t border-[#0F3460]/10 px-5 pb-5 pt-4 sm:px-7">
              <Button onClick={() => void handleSaveProfile()} disabled={isProfileSaving} className="min-w-60">
                <CheckCircle className="mr-2 h-4 w-4" />
                {isProfileSaving ? 'Enregistrement...' : 'Enregistrer le profil'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <style>{`
          @keyframes settings-profile-line-shift {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -240; }
          }
          @keyframes settings-profile-motif-float {
            0% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-4px) scale(1.02); }
            100% { transform: translateY(0px) scale(1); }
          }
          @keyframes settings-profile-token-float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
            100% { transform: translateY(0px); }
          }
        `}</style>
      </section>
    );
  };

  const renderNotificationsSection = () => (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-white/80 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Preferences de notifications</h3>
        <p className="mt-1 text-sm text-slate-600">
          Definissez les categories et canaux de notifications a afficher.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">Mises a jour produit</p>
              <Switch
                checked={settings.notifications.updates}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, updates: checked },
                  }))
                }
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">Alertes de securite</p>
              <Switch
                checked={settings.notifications.alerts}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, alerts: checked },
                  }))
                }
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">Rappels de projet</p>
              <Switch
                checked={settings.notifications.reminders}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, reminders: checked },
                  }))
                }
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">Digest hebdomadaire</p>
              <Switch
                checked={settings.notifications.digest}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, digest: checked },
                  }))
                }
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">Notification desktop</p>
              <Switch
                checked={settings.notifications.desktop}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, desktop: checked },
                  }))
                }
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">Son des alertes</p>
              <Switch
                checked={settings.notifications.sounds}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, sounds: checked },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Apercu des notifications</h4>
            <p className="text-xs text-slate-600">Donnees mock en francais pour la V1.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-white p-1">
            {[
              { key: 'all', label: 'Tout' },
              { key: 'updates', label: 'Mises a jour' },
              { key: 'alerts', label: 'Alertes' },
              { key: 'reminders', label: 'Rappels' },
            ].map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={selectedNotificationCategory === item.key ? 'secondary' : 'ghost'}
                onClick={() =>
                  setSelectedNotificationCategory(item.key as 'all' | NotificationCategory)
                }
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
          {notificationItems.map((item) => (
            <div key={item.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  {item.icon}
                  {item.title}
                </div>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderAiSection = () => (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
        <h3 className="text-base font-semibold text-slate-900">IA et cles API</h3>
            <p className="mt-1 text-sm text-slate-600">
              Reutilise la meme logique de configuration que Dayanna AI.
            </p>
          </div>
          <Badge variant="secondary">
            {configuredProvidersCount}/{AI_FIELDS.length} fournisseurs configures
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          {AI_FIELDS.map((field) => {
            const value = apiKeys[field.key] || '';
            const isVisible = Boolean(visibleApiKeys[field.key]);
            const isEnabled = providerToggles[field.provider] ?? true;

            return (
              <div key={field.key} className="rounded-xl border border-border bg-white p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border">
                      <ProviderBrandIcon provider={field.provider} className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{field.label}</p>
                        {field.free && (
                          <Badge className="h-5 bg-emerald-600 px-2 text-[10px] text-white hover:bg-emerald-600">
                            Gratuit
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {value.trim() ? 'Configure' : 'Non configure'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">{isEnabled ? 'Actif' : 'Off'}</span>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        setProviderToggles((prev) => ({ ...prev, [field.provider]: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="relative">
                  <Input
                    type={isVisible ? 'text' : 'password'}
                    value={value}
                    onChange={(event) =>
                      setApiKeys((prev) => ({ ...prev, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleApiKeys((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    title={isVisible ? 'Masquer la cle' : 'Afficher la cle'}
                  >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={() => void handleSaveAiSettings()}
            disabled={isLoadingAiSettings || isSavingAiSettings}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSavingAiSettings ? 'Enregistrement...' : 'Enregistrer les cles API'}
          </Button>
        </div>
      </div>
    </section>
  );

  const renderAppearanceSection = () => (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-white/80 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Apparence</h3>
        <p className="mt-1 text-sm text-slate-600">
          Preferences locales stockees dans <code>notorious_settings_v1</code>.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Reduire les animations</p>
                <p className="text-xs text-slate-500">Mode confort visuel</p>
              </div>
              <Switch
                checked={settings.appearance.reduceMotion}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, reduceMotion: checked },
                  }))
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-3">
            <p className="text-sm font-medium text-slate-900">Densite</p>
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant={settings.appearance.density === 'comfortable' ? 'secondary' : 'outline'}
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, density: 'comfortable' },
                  }))
                }
              >
                Confortable
              </Button>
              <Button
                size="sm"
                variant={settings.appearance.density === 'compact' ? 'secondary' : 'outline'}
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, density: 'compact' },
                  }))
                }
              >
                Compact
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-white p-3">
          <p className="text-sm font-medium text-slate-900">Accent visuel</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {[
              { value: 'notorious-blue', label: 'Bleu Notorious', classes: 'bg-[#0F3460]' },
              { value: 'steel', label: 'Acier', classes: 'bg-slate-600' },
              { value: 'emerald', label: 'Emeraude', classes: 'bg-emerald-600' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium',
                  settings.appearance.accent === option.value
                    ? 'border-slate-900 bg-slate-100 text-slate-900'
                    : 'border-border bg-white text-slate-600'
                )}
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    appearance: {
                      ...prev.appearance,
                      accent: option.value as LocalSettingsV1['appearance']['accent'],
                    },
                  }))
                }
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', option.classes)} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const renderActiveSection = () => {
    if (activeSection === 'general') return renderGeneralSection();
    if (activeSection === 'profile') return renderProfileSection();
    if (activeSection === 'notifications') return renderNotificationsSection();
    if (activeSection === 'ai') return renderAiSection();
    return renderAppearanceSection();
  };
  const isProfileSection = activeSection === 'profile';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eff4fb]">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#f9fbff_0%,#f4f7fc_44%,#eef3fa_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(15,52,96,0.12),transparent_38%),radial-gradient(circle_at_82%_82%,rgba(31,90,160,0.10),transparent_42%)]" />
      <BackgroundPathsLayer className="text-[#0F3460] opacity-[0.22]" />

      <div className="relative z-10 h-full px-4 pb-4 pt-5 lg:px-6">
        <button
          onClick={onClose}
          className="group mb-4 inline-flex h-11 items-center gap-2 rounded-xl border border-[#1F5AA0]/55 bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,52,96,0.28)] transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au projet
        </button>

        <div className="grid h-[calc(100%-3.8rem)] grid-cols-1 gap-4 lg:grid-cols-[290px_1fr]">
          <aside className="flex min-h-0 flex-col rounded-2xl border border-border/70 bg-white/85 shadow-[0_18px_40px_rgba(15,52,96,0.08)] backdrop-blur-sm">
            <div className="border-b border-border/70 p-4">
              <p className="text-xl font-semibold tracking-tight text-slate-900">Parametres</p>
              <p className="mt-1 text-sm text-slate-600">Configuration generale de Notorious.PY</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Configuration
              </p>
              <nav className="space-y-1">
                {sectionItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      activeSection === item.key
                        ? 'bg-[#0F3460] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <Separator />
            <div className="p-4 pt-3">
              {isGuest ? (
                <Button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-auth-page'))}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-4 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(15,52,96,0.20)] transition-all hover:brightness-110"
                >
                  Se connecter
                </Button>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
                  <Avatar className="h-10 w-10 rounded-full border border-[#0F3460]/15 bg-[#0F3460]/8">
                    <AvatarImage src={displayedAvatarUrl || undefined} alt={displayName} className="object-cover" />
                    <AvatarFallback className="rounded-full bg-[#0F3460] font-semibold text-white">
                      {profileInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="truncate text-xs text-slate-500">{email}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section
            className={cn(
              'min-h-0 rounded-2xl',
              isProfileSection
                ? 'overflow-hidden border-0 bg-transparent p-0 shadow-none'
                : 'overflow-y-auto border border-border/70 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,52,96,0.08)] backdrop-blur-sm lg:p-5'
            )}
          >
            {!isProfileSection && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    {sectionItems.find((item) => item.key === activeSection)?.label ?? 'Parametres'}
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Espace de configuration actif
                </div>
              </div>
            )}

            <div className={cn(isProfileSection ? 'h-full' : 'space-y-4')}>{renderActiveSection()}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
