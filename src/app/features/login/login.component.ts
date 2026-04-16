import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { LoginService } from './login.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  imageTransform = 'translate(-50%, -50%)';

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  private extractApiErrorMessage(err: any): string {
    try {
      if (err?.error) {
        const e = err.error;
        if (typeof e === 'string') return e;
        if (e?.response?.mensaje) return e.response.mensaje;
        if (e?.mensaje) return e.mensaje;
        if (e?.message) return e.message;
      }
      return err?.message ?? 'Ocurrió un error';
    } catch {
      return 'Ocurrió un error';
    }
  }

  onMouseMove(event: MouseEvent): void {
    const container = event.currentTarget;
    if (!(container instanceof HTMLElement)) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const moveX = (mouseX - centerX) * 0.05;
    const moveY = (mouseY - centerY) * 0.05;

    this.imageTransform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
  }

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos'
      });
      return;
    }

    const credentials = this.form.getRawValue();

    this.loginService.loginService(credentials).subscribe({
      next: (res: any) => {
        if (res?.error === 1) {
          const msg = res?.response?.mensaje ?? 'Credenciales inválidas';
          localStorage.setItem('token', '');
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: msg
          });
          return;
        }

        localStorage.setItem('token', res.response.token);

        const user = {
          id: res.response.id,
          ips_id: res.response.ips_id,
          perfil: res.response.perfil,
          empresa: res.response.empresa,
          nombre: res.response.nombre,
          apellido: res.response.apellido,
          correo: res.response.correo,
          cel: res.response.cel,
          permiso: res.response.permiso
        };
        localStorage.setItem('user', JSON.stringify(user));

        // Establecer estado de autenticación
        this.authService.setAuthStatus(true);

        this.router.navigate(['home']);
      },
      error: (err: any) => {
        const msg = this.extractApiErrorMessage(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: msg
        });
      }
    });
  }
}
