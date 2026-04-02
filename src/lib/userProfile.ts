import type { User } from '@supabase/supabase-js';

const sanitizeValue = (value: string) => value.replace(/\s+/g, ' ').trim();

export function capitalizeFirstLetter(value: string): string {
  const sanitized = sanitizeValue(value);
  if (!sanitized) return '';
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
}

export function getFormattedFirstName(user: User | null): string {
  const metadataFirstName = user?.user_metadata?.first_name;
  if (typeof metadataFirstName === 'string' && metadataFirstName.trim()) {
    return capitalizeFirstLetter(metadataFirstName);
  }

  const emailPrefix = user?.email?.split('@')[0] ?? '';
  return capitalizeFirstLetter(emailPrefix);
}

export function getFormattedLastName(user: User | null): string {
  const metadataLastName = user?.user_metadata?.last_name;
  if (typeof metadataLastName !== 'string') return '';
  return capitalizeFirstLetter(metadataLastName);
}

export function getFormattedDisplayName(user: User | null): string {
  const firstName = getFormattedFirstName(user);
  const lastName = getFormattedLastName(user);

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;

  const emailPrefix = user?.email?.split('@')[0] ?? '';
  return capitalizeFirstLetter(emailPrefix) || 'Profil';
}

export function getUserInitials(user: User | null): string {
  const firstName = getFormattedFirstName(user);
  const lastName = getFormattedLastName(user);

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) return firstName[0].toUpperCase();

  const emailInitial = user?.email?.[0]?.toUpperCase();
  return emailInitial || '?';
}
