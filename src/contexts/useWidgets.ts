import { useContext } from 'react';
import { WidgetContext } from '@/contexts/widget-context';

export const useWidgets = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgets must be used within a WidgetProvider');
  }
  return context;
};
