'use client';

import { useTheme } from 'next-themes';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/providers/Thirdweb';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import {
  isLoggedIn,
  generatePayload,
  loginWithEthereum,
} from '@/app/(auth)/actions';
import { base } from 'thirdweb/chains';

export function SidebarUserNav() {
  const { setTheme, resolvedTheme } = useTheme();
  const { update: updateSession } = useSession();
  const router = useRouter();
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
          <ConnectButton
            client={client}
            theme={mounted && resolvedTheme === 'light' ? 'light' : 'dark'}
            auth={{
              isLoggedIn: async (address) => {
                try {
                  const result = await isLoggedIn(address);
                  return Boolean(result);
                } catch (error) {
                  console.error('Error in ConnectButton isLoggedIn:', error);
                  return false;
                }
              },
              doLogin: async (params) => {
                await loginWithEthereum(params);

                // Give NextAuth a moment to set the session cookie
                await new Promise((resolve) => setTimeout(resolve, 100));

                // Force session update after login
                await updateSession();
                router.refresh();
              },
              getLoginPayload: async ({ address }) =>
                generatePayload({ address }),
              doLogout: async () => {
                await signOut({ redirectTo: '/' });
              },
            }}
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
