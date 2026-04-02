import type { ComponentType } from 'react';
import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type DropdownMenuUserMenu07Props = {
  email: string;
  displayName: string;
  initials: string;
  avatarUrl?: string;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void | Promise<void>;
};

type MenuItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onSelect: () => void;
};

const DropdownMenuUserMenu07 = ({
  email,
  displayName,
  initials,
  avatarUrl,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
}: DropdownMenuUserMenu07Props) => {
  const listItems: MenuItem[] = [
    { icon: UserIcon, label: 'Mon profil', onSelect: onOpenProfile },
    { icon: SettingsIcon, label: 'Parametres', onSelect: onOpenSettings },
  ];

  const logoutItem: MenuItem = {
    icon: LogOutIcon,
    label: 'Se deconnecter',
    onSelect: () => void onSignOut(),
  };
  const LogoutIcon = logoutItem.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full border-border/50 bg-card/90 pl-1 pr-2.5 shadow-sm"
          title={displayName}
        >
          <Avatar className="size-6 border border-background">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[128px] truncate text-xs font-medium">{displayName}</span>
          <ChevronsUpDownIcon className="size-3.5 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end" sideOffset={8}>
        <DropdownMenuLabel className="space-y-0.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Gestion
          </p>
          <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {listItems.map((item) => (
            <DropdownMenuItem key={item.label} onSelect={item.onSelect}>
              <item.icon />
              <span className="text-popover-foreground">{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logoutItem.onSelect} className="text-red-600 focus:bg-red-50 focus:text-red-700">
          <LogoutIcon />
          <span>{logoutItem.label}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownMenuUserMenu07;
