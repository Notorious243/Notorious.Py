import type { ComponentType } from 'react';
import { BellIcon, CreditCardIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type DropdownMenuUserMenu07Props = {
  email: string;
  displayName: string;
  initials: string;
  avatarUrl?: string;
  onSignOut: () => void | Promise<void>;
};

type MenuItem = {
  icon: ComponentType<{ className?: string }>;
  property: string;
  onSelect?: () => void;
};

const DropdownMenuUserMenu07 = ({
  email,
  displayName,
  initials,
  avatarUrl,
  onSignOut,
}: DropdownMenuUserMenu07Props) => {
  const listItems: MenuItem[] = [
    { icon: UserIcon, property: 'Profile' },
    { icon: SettingsIcon, property: 'Settings' },
    { icon: CreditCardIcon, property: 'Billing' },
    { icon: BellIcon, property: 'Notifications' },
    { icon: LogOutIcon, property: 'Sign Out', onSelect: () => void onSignOut() },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 overflow-hidden rounded-full border border-border/50 bg-card/90 shadow-sm"
          title={displayName}
        >
          <Avatar className="h-full w-full rounded-full">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {listItems.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onSelect={(event) => {
                if (!item.onSelect) {
                  event.preventDefault();
                  return;
                }
                item.onSelect();
              }}
            >
              <item.icon />
              <span className="text-popover-foreground">{item.property}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownMenuUserMenu07;
