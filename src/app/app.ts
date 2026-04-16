import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { ThemeService } from './shared/theme/theme.service';

type SplashState = 'visible' | 'hiding' | 'hidden';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-shell">
      <div
        class="app-splash"
        *ngIf="splashState() !== 'hidden'"
        [class.app-splash--hiding]="splashState() === 'hiding'"
      >
        <video
          #splashVideo
          class="app-splash__video"
          src="/assets/video/loading.mp4"
          autoplay
          muted
          playsinline
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          tabindex="-1"
          (ended)="onSplashEnded()"
          (error)="onSplashError()"
        ></video>
      </div>

      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  @ViewChild('splashVideo') private splashVideo?: ElementRef<HTMLVideoElement>;

  readonly splashState = signal<SplashState>('hidden');

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const isLogin = event.urlAfterRedirects === '/login' || event.url === '/login';
        if (isLogin && !this.wasSplashShown()) {
          this.showSplash();
        }
      });
  }

  ngAfterViewInit(): void {
    const currentUrl = this.router.url;
    const isLoginOrRoot = currentUrl === '/login' || currentUrl === '/' || currentUrl === '';
    if (isLoginOrRoot && !this.wasSplashShown()) {
      queueMicrotask(() => {
        this.showSplash();
      });
    }
  }

  private wasSplashShown(): boolean {
    return sessionStorage.getItem('splash_shown') === 'true';
  }

  private showSplash(): void {
    sessionStorage.setItem('splash_shown', 'true');
    this.splashState.set('visible');
    queueMicrotask(() => {
      this.tryPlaySplashVideo();
    });
  }

  onSplashEnded(): void {
    this.hideSplash();
  }

  onSplashError(): void {
    this.hideSplash();
  }

  private tryPlaySplashVideo(): void {
    if (window.navigator.userAgent.includes('jsdom')) {
      return;
    }

    const video = this.splashVideo?.nativeElement;
    if (!video) {
      return;
    }

    const playResult = video.play();
    if (!playResult || typeof (playResult as Promise<void>).catch !== 'function') {
      return;
    }

    (playResult as Promise<void>).catch(() => {
      this.hideSplash();
    });
  }

  private hideSplash(): void {
    if (this.splashState() !== 'visible') {
      return;
    }

    this.splashState.set('hiding');
    window.setTimeout(() => {
      this.splashState.set('hidden');
    }, 450);
  }
}
