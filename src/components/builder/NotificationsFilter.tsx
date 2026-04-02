import * as React from 'react';
import { AlertCircle, Bell, Calendar, Filter, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type NotificationCategory = 'updates' | 'alerts' | 'reminders';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}

interface NotificationsFilterProps {
  items?: NotificationItem[];
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const defaultNotificationsFr: NotificationItem[] = [
  {
    id: '1',
    category: 'updates',
    icon: <Info className="h-4 w-4" />,
    title: 'Mise a jour systeme',
    description: "Une nouvelle fonctionnalite est disponible dans l'editeur.",
    time: "A l'instant",
  },
  {
    id: '2',
    category: 'alerts',
    icon: <AlertCircle className="h-4 w-4" />,
    title: 'Alerte securite',
    description: 'Nouvelle connexion detectee sur votre espace de travail.',
    time: 'Il y a 1 h',
  },
  {
    id: '3',
    category: 'reminders',
    icon: <Calendar className="h-4 w-4" />,
    title: 'Rappel',
    description: 'Planifiez votre prochaine revue de projet cette semaine.',
    time: 'Il y a 2 h',
  },
  {
    id: '4',
    category: 'updates',
    icon: <Info className="h-4 w-4" />,
    title: 'Resume hebdomadaire',
    description: 'Votre bilan de productivite est pret.',
    time: 'Hier',
  },
];

const categories = [
  { key: 'all', label: 'Tout' },
  { key: 'updates', label: 'Mises a jour' },
  { key: 'alerts', label: 'Alertes' },
  { key: 'reminders', label: 'Rappels' },
] as const;

export function NotificationsFilter({
  items = defaultNotificationsFr,
  placement = 'bottom',
}: NotificationsFilterProps) {
  const [selected, setSelected] = React.useState<(typeof categories)[number]['key']>('all');

  const filteredItems =
    selected === 'all' ? items : items.filter((item) => item.category === selected);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-card/90 shadow-sm transition-colors hover:bg-accent"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {items.length > 0 && (
            <Badge
              variant="default"
              className="absolute -right-1 -top-1 min-w-5 px-1 py-0 text-[10px] leading-4"
            >
              {items.length}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent side={placement} align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Notifications
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b px-4 py-2">
          {categories.map((cat) => (
            <Button
              key={cat.key}
              variant={selected === cat.key ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelected(cat.key)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucune notification dans cette categorie.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-4 transition-colors hover:bg-muted/50">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
