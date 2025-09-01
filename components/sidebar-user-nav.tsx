'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { SharedConnectButton } from '@/components/shared-connect-button';

export function SidebarUserNav() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex flex-col gap-2">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent text-sm">
            <div className="flex items-center gap-2">
              {mounted ? (resolvedTheme === 'light' ? '☀️' : '🌙') : '🌙'}
              <span>Dark Mode</span>
            </div>
            <Switch
              checked={mounted ? resolvedTheme === 'dark' : false}
              onCheckedChange={(checked) =>
                setTheme(checked ? 'dark' : 'light')
              }
            />
          </div>

          {/* Connect Button */}
          <SharedConnectButton waitForMount={true} />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
