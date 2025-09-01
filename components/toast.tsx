'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';
import { CheckCircleFillIcon, WarningIcon } from './icons';
import { cn } from '@/lib/utils';
import { useFarcaster } from '@/components/farcaster-provider';

const iconsByType: Record<'success' | 'error' | 'info', ReactNode> = {
  success: <CheckCircleFillIcon />,
  error: <WarningIcon />,
  info: <WarningIcon />,
};

export function toast(props: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom((id) => (
    <Toast id={id} type={props.type} description={props.description} />
  ));
}

// Add convenience methods
toast.success = (description: string) =>
  toast({ type: 'success', description });
toast.error = (description: string) => toast({ type: 'error', description });
toast.info = (description: string) => toast({ type: 'info', description });

function Toast(props: ToastProps) {
  const { id, type, description } = props;
  const { triggerHaptic } = useFarcaster();

  const descriptionRef = useRef<HTMLDivElement>(null);
  const [multiLine, setMultiLine] = useState(false);

  // Trigger haptic feedback when toast appears - different intensity for different types
  useEffect(() => {
    console.log('🍞 Toast component mounted with type:', type);
    if (type === 'success') {
      console.log('✅ Triggering medium haptic for success toast');
      triggerHaptic('medium'); // Success gets medium haptic feedback
    } else if (type === 'error') {
      console.log('❌ Triggering heavy haptic for error toast');
      triggerHaptic('heavy'); // Error gets heavy haptic feedback
    } else if (type === 'info') {
      console.log('ℹ️ Triggering light haptic for info toast');
      triggerHaptic('light'); // Info gets light haptic feedback
    }
  }, [type, triggerHaptic]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;

    const update = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
      const lines = Math.round(el.scrollHeight / lineHeight);
      setMultiLine(lines > 1);
    };

    update(); // initial check
    const ro = new ResizeObserver(update); // re-check on width changes
    ro.observe(el);

    return () => ro.disconnect();
  }, [description]);

  return (
    <div className="flex w-full toast-mobile:w-[356px] justify-center">
      <div
        data-testid="toast"
        key={id}
        className={cn(
          'bg-zinc-100 p-3 rounded-lg w-full toast-mobile:w-fit flex flex-row gap-3',
          multiLine ? 'items-start' : 'items-center',
        )}
      >
        <div
          data-type={type}
          className={cn(
            'data-[type=error]:text-red-600 data-[type=success]:text-green-600 data-[type=info]:text-blue-600',
            { 'pt-1': multiLine },
          )}
        >
          {iconsByType[type]}
        </div>
        <div ref={descriptionRef} className="text-zinc-950 text-sm">
          {description}
        </div>
      </div>
    </div>
  );
}

interface ToastProps {
  id: string | number;
  type: 'success' | 'error' | 'info';
  description: string;
}
