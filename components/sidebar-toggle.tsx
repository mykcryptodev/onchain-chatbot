import type { ComponentProps } from 'react';

import { type SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFarcaster } from '@/components/farcaster-provider';

import { SidebarLeftIcon } from './icons';
import { Button } from './ui/button';

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();
  const { triggerHaptic } = useFarcaster();

  const handleToggle = () => {
    triggerHaptic();
    toggleSidebar();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="sidebar-toggle-button"
          onClick={handleToggle}
          variant="outline"
          className="md:px-2 md:h-fit"
        >
          <SidebarLeftIcon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle Sidebar</TooltipContent>
    </Tooltip>
  );
}
