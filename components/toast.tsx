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

// Global haptic trigger function - will be set by ToastProvider
let globalTriggerHaptic:
  | ((type?: 'light' | 'medium' | 'heavy') => void)
  | null = null;

export function setGlobalHapticTrigger(
  triggerFn: (type?: 'light' | 'medium' | 'heavy') => void,
) {
  globalTriggerHaptic = triggerFn;
}

function triggerHapticSafely(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (globalTriggerHaptic) {
    globalTriggerHaptic(type);
  } else {
    // Fallback to browser vibration API if haptic provider not available
    const vibrationPattern =
      type === 'heavy' ? 100 : type === 'medium' ? 75 : 50;
    if (
      typeof window !== 'undefined' &&
      'navigator' in window &&
      'vibrate' in navigator
    ) {
      navigator.vibrate(vibrationPattern);
    }
  }
}

export function toast(props: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom((id) => (
    <Toast id={id} type={props.type} description={props.description} />
  ));
}

// Add convenience methods with haptic feedback
toast.success = (description: string) => {
  triggerHapticSafely('medium'); // Success gets medium haptic feedback
  return toast({ type: 'success', description });
};
toast.error = (description: string) => {
  triggerHapticSafely('heavy'); // Error gets heavy haptic feedback
  return toast({ type: 'error', description });
};
toast.info = (description: string) => {
  triggerHapticSafely('light'); // Info gets light haptic feedback
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
  triggerHapticSafely('light');
  const loadingToast = sonnerToast.custom((id) => (
    <Toast id={id} type="info" description={options.loading} />
  ));

  return promise
    .then((data) => {
      const successMessage =
        typeof options.success === 'function'
          ? options.success(data)
          : options.success;
      triggerHapticSafely('medium'); // Success haptic
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
      triggerHapticSafely('heavy'); // Error haptic
      sonnerToast.custom((id) => (
        <Toast id={id} type="error" description={errorMessage} />
      ));
      throw error;
    });
};

// Toast Provider component to set up haptic integration
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { triggerHaptic } = useFarcaster();

  useEffect(() => {
    setGlobalHapticTrigger(triggerHaptic);
    return () => {
      globalTriggerHaptic = null;
    };
  }, [triggerHaptic]);

  return <>{children}</>;
}

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
