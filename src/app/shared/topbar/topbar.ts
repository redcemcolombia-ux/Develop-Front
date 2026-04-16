import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';

import { ThemeService } from '../theme/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.html'
})
export class Topbar {
  private readonly themeService = inject(ThemeService);

  @Input() displayName = 'Usuario';

  @Output() menuToggle = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  readonly isDarkMode = computed(() => this.themeService.isDarkMode());

  readonly initials = computed(() => {
    const name = String(this.displayName ?? '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    const first = parts[0]?.slice(0, 1) ?? 'U';
    const last = parts[parts.length - 1]?.slice(0, 1) ?? '';
    return (first + last).toUpperCase();
  });

  readonly themeLabel = computed(() => (this.themeService.isDarkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'));

  onToggleMenu(): void {
    this.menuToggle.emit();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  logout(): void {
    this.logoutClick.emit();
  }
}
