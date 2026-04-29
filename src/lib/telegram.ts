import type { TelegramUser } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          start_param?: string;
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        platform: string;
        version: string;
      };
    };
  }
}

export const tg = window.Telegram?.WebApp;

export function getTelegramUser(): TelegramUser | null {
  return tg?.initDataUnsafe?.user ?? null;
}

export function isTelegramWebApp(): boolean {
  return !!tg && tg.initData !== '';
}

export function getMockUser(): TelegramUser {
  return {
    id: 123456789,
    first_name: 'Demo',
    last_name: 'User',
    username: 'demo_user',
  };
}

export function getCurrentUser(): TelegramUser {
  return getTelegramUser() ?? getMockUser();
}
