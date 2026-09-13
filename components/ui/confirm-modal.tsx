'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ShoppingBag,
  Lock,
  Trash2,
  HelpCircle,
  X,
  Info,
  Send,
} from 'lucide-react';

export interface ConfirmDetail {
  label: string;
  value: string;
  badge?: boolean;
}

export interface ConfirmOptions {
  title: string;
  description: string | React.ReactNode;
  details?: ConfirmDetail[];
  notice?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning';
  icon?: 'help' | 'alert' | 'shopping' | 'lock' | 'trash' | 'info' | 'send';
}

export interface AlertOptions {
  title: string;
  description: string | React.ReactNode;
  buttonText?: string;
  variant?: 'primary' | 'warning' | 'danger' | 'info';
  icon?: 'help' | 'alert' | 'info';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isAlertMode, setIsAlertMode] = useState(false);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setIsAlertMode(false);
      setResolver(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const alert = useCallback((opts: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setOptions({
        title: opts.title,
        description: opts.description,
        confirmText: opts.buttonText || 'Understood',
        variant: opts.variant === 'info' ? 'primary' : opts.variant,
        icon: opts.icon || 'info',
      });
      setIsAlertMode(true);
      setResolver(() => () => resolve());
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolver?.(true);
    setIsOpen(false);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    resolver?.(false);
    setIsOpen(false);
  }, [resolver]);

  // Trap Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  // Lock body scroll when dialog is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Prevent browser alerts from freezing UI in window context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (msg?: string) => {
        console.warn('[DevVault] Native window.alert intercepted. Use modal instead:', msg);
      };
      return () => {
        window.alert = originalAlert;
      };
    }
  }, []);

  const renderIcon = () => {
    const iconType = options?.icon;
    const variant = options?.variant;

    if (iconType === 'shopping') {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          <ShoppingBag className="h-5 w-5" />
        </div>
      );
    }
    if (iconType === 'lock') {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          <Lock className="h-5 w-5" />
        </div>
      );
    }
    if (iconType === 'trash' || variant === 'danger') {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <Trash2 className="h-5 w-5" />
        </div>
      );
    }
    if (iconType === 'alert' || variant === 'warning') {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
      );
    }
    if (iconType === 'send') {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          <Send className="h-5 w-5" />
        </div>
      );
    }
    if (iconType === 'info') {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <Info className="h-5 w-5" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
        <HelpCircle className="h-5 w-5" />
      </div>
    );
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}

      {isOpen && options && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={handleCancel}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-950 animate-in zoom-in-95">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Close dialog"
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header & Icon */}
            <div className="flex items-start gap-3.5">
              {renderIcon()}
              <div className="space-y-1 pr-6">
                <h3
                  id="confirm-modal-title"
                  className="text-base font-semibold text-zinc-900 dark:text-white"
                >
                  {options.title}
                </h3>
                <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  {options.description}
                </div>
              </div>
            </div>

            {/* Details Table */}
            {options.details && options.details.length > 0 && (
              <div className="mt-4 divide-y divide-zinc-200/60 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-xs dark:divide-zinc-800/60 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                {options.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between py-1.5 ${
                      idx === 0 ? 'pt-0' : ''
                    } ${idx === options.details!.length - 1 ? 'pb-0' : ''}`}
                  >
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">
                      {detail.label}
                    </span>
                    <span
                      className={`font-semibold ${
                        detail.badge
                          ? 'rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] uppercase dark:bg-zinc-800 dark:text-zinc-300'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Warning / Notice Notice */}
            {options.notice && (
              <div className="mt-3.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                {options.notice}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              {!isAlertMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  {options.cancelText || 'Cancel'}
                </Button>
              )}
              <Button
                variant={options.variant === 'danger' ? 'danger' : 'primary'}
                size="sm"
                onClick={handleConfirm}
                autoFocus
              >
                {options.confirmText || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
