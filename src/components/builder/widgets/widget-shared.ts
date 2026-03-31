import React from 'react';
import { WidgetData, type WidgetProperties } from '@/types/widget';
import { ContainerMetrics } from '@/lib/widgetLayout';

export interface WidgetRenderContext {
  widget: WidgetData;
  isPreviewMode: boolean;
  isDark: boolean;
  colors: CtkColorScheme;
  baseStyle: React.CSSProperties;
  textColor: string;
  fgColor: string;
  borderColor: string;
  effectiveBorderWidth: number;
  effectiveBorderColor: string;
  cornerRadius: number;
  properties: WidgetProperties;
  style: Partial<WidgetData['style']>;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  // Container-specific
  contentRef?: React.RefObject<HTMLDivElement | null>;
  childElements?: React.ReactNode;
  containerMetrics?: ContainerMetrics;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  updateWidget?: (widgetId: string, updates: Partial<WidgetData>, addToHistory?: boolean) => void;
  isDraggingChild?: boolean;
}

export interface CtkColorScheme {
  bg: string;
  fg: string;
  button: string;
  buttonHover: string;
  input: string;
  border: string;
  text: string;
  textDisabled: string;
  scrollbar: string;
  checkmark: string;
  progress: string;
}

export const CTK_COLORS = {
  dark: {
    bg: '#1a1a1a',
    fg: '#2B2B2B',
    button: '#0F3460',
    buttonHover: '#1F5AA0',
    input: '#343638',
    border: '#565B5E',
    text: '#DCE4EE',
    textDisabled: '#6B6B6B',
    scrollbar: '#4A4D50',
    checkmark: '#1F5AA0',
    progress: '#0F3460',
  },
  light: {
    bg: '#EBEBEB',
    fg: '#DBDBDB',
    button: '#0F3460',
    buttonHover: '#1F5AA0',
    input: '#F9F9FA',
    border: '#979DA2',
    text: '#000000',
    textDisabled: '#A0A0A0',
    scrollbar: '#CCCCCC',
    checkmark: '#0F3460',
    progress: '#0F3460',
  }
};

export const toNumber = (value: unknown, fallback: number) => {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const getColor = (colorProp: string | undefined, defaultColor: string) => {
  return colorProp || defaultColor;
};
