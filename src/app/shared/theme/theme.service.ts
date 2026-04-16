import { Injectable, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly cookieName = 'theme_mode';
  readonly isDarkMode = signal(false);

  constructor() {
    this.applyInitialThemeFromCookie();
  }

  toggle(): void {
    this.setMode(this.isDarkMode() ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode): void {
    const isDark = mode === 'dark';
    this.isDarkMode.set(isDark);
    this.applyDomTheme(isDark);
    this.writeCookie(this.cookieName, mode);
  }

  private applyInitialThemeFromCookie(): void {
    const mode = this.readCookie(this.cookieName);
    if (mode === 'dark' || mode === 'light') {
      this.isDarkMode.set(mode === 'dark');
      this.applyDomTheme(mode === 'dark');
      return;
    }

    this.applyDomTheme(this.isDarkMode());
  }

  private applyDomTheme(isDark: boolean): void {
    try {
      document.documentElement.classList.toggle('theme-dark', isDark);
      document.documentElement.classList.toggle('theme-light', !isDark);
    } catch {
      return;
    }
  }

  private readCookie(name: string): string | null {
    try {
      const cookies = document.cookie ? document.cookie.split('; ') : [];
      for (const entry of cookies) {
        const [k, ...rest] = entry.split('=');
        if (k === name) {
          return decodeURIComponent(rest.join('='));
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private writeCookie(name: string, value: string): void {
    try {
      const base = `${name}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax`;
      const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = base + secure;
    } catch {
      return;
    }
  }
}

