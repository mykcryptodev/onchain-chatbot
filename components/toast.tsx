'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';
import { CheckCircleFillIcon, WarningIcon } from './icons';
import { cn } from '@/lib/utils';

// Helper function to trigger haptic feedback
// This will work in Farcaster frames and fallback to browser vibration
function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    // Check if we're in a Farcaster frame
    if (typeof window !== 'undefined' && (window as any).parent !== window) {
      // Try to access Farcaster SDK from parent frame
      const farcasterSdk = (window as any).parent?.farcaster;
      if (farcasterSdk?.haptics) {
        farcasterSdk.haptics.impactOccurred(type).catch(() => {
          // Fallback to browser vibration if Farcaster haptics fail
          fallbackVibration(type);
        });
        return;
      }
    }

    // Fallback to browser vibration API
    fallbackVibration(type);
  } catch (error) {
    // Silent fallback - haptics are not critical functionality
    console.debug('Haptic feedback not available:', error);
  }
}

function fallbackVibration(type: 'light' | 'medium' | 'heavy') {
  const vibrationPattern = type === 'heavy' ? 100 : type === 'medium' ? 75 : 50;
  if (
    typeof window !== 'undefined' &&
    'navigator' in window &&
    'vibrate' in navigator
  ) {
    navigator.vibrate(vibrationPattern);
  }
}

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

// Add convenience methods with haptic feedback
toast.success = (description: string) => {
  triggerHaptic('medium'); // Success gets medium haptic feedback
  return toast({ type: 'success', description });
};
toast.error = (description: string) => {
  triggerHaptic('heavy'); // Error gets heavy haptic feedback
  return toast({ type: 'error', description });
};
toast.info = (description: string) => {
  triggerHaptic('light'); // Info gets light haptic feedback
  return toast({ type: 'info', description });
};

// Add promise method for loading states with haptic feedback
toast.promise = <T,>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
) => {
  // Show loading toast with light haptic
  triggerHaptic('light');
  const loadingToast = sonnerToast.custom((id) => (
    <Toast id={id} type="info" description={options.loading} />
  ));

  return promise
    .then((data) => {
      const successMessage =
        typeof options.success === 'function'
          ? options.success(data)
          : options.success;
      triggerHaptic('medium'); // Success haptic
      sonnerToast.custom((id) => (
        <Toast id={id} type="success" description={successMessage} />
      ));
      return data;
    })
    .catch((error) => {
      const errorMessage =
        typeof options.error === 'function'
          ? options.error(error)
          : options.error;
      triggerHaptic('heavy'); // Error haptic
      sonnerToast.custom((id) => (
        <Toast id={id} type="error" description={errorMessage} />
      ));
      throw error;
    });
};

function Toast(props: ToastProps) {
  const { id, type, description } = props;

  const descriptionRef = useRef<HTMLDivElement>(null);
  const [multiLine, setMultiLine] = useState(false);

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
