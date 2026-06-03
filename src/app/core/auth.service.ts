import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router) {
    this.checkAuthStatus();
  }

  /**
   * Verifica si el token existe y es válido
   */
  isTokenValid(): boolean {
    const token = localStorage.getItem('token');

    if (!token || token.trim() === '') {
      return false;
    }

    try {
      const payload = this.decodeToken(token);

      if (!payload || !payload.exp) {
        return false;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Decodifica un token JWT
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica el estado de autenticación
   */
  checkAuthStatus(): void {
    const isValid = this.isTokenValid();
    this.isAuthenticatedSubject.next(isValid);

    if (!isValid && this.router.url !== '/login') {
      this.logout();
    }
  }

  /**
   * Establece el estado de autenticación
   */
  setAuthStatus(isAuthenticated: boolean): void {
    this.isAuthenticatedSubject.next(isAuthenticated);
  }

  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('splash_shown');
    this.isAuthenticatedSubject.next(false);

    Swal.fire({
      icon: 'warning',
      title: 'Sesión Cerrada',
      text: 'Tu sesión ha expirado o ha sido cerrada',
      timer: 2000,
      showConfirmButton: false
    });

    this.router.navigate(['/login']);
  }

  /**
   * Maneja errores de autenticación (401)
   */
  handleAuthError(): void {
    this.logout();
  }

  /**
   * Obtiene información del usuario desde localStorage
   */
  getUserInfo(): any {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  getUser(): any {
    return this.getUserInfo();
  }

  /**
   * Obtiene el token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtiene el ID del usuario logueado desde localStorage 'user'
   * @returns ID del usuario o null si no está disponible
   */
  getUserId(): string | null {
    try {
      const userRaw = localStorage.getItem('user');
      if (!userRaw) return null;

      const parsed = JSON.parse(userRaw);
      if (!parsed) return null;

      // Intenta obtener el ID de diferentes posibles estructuras
      return parsed?.response?.id ?? parsed?.id ?? null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica si el usuario tiene rol de Supervisor de Psicología o Administrador
   */
  isSupPsicologia(): boolean {
    try {
      const userInfo = this.getUserInfo();

      if (!userInfo || !userInfo.perfil) {
        return false;
      }

      const perfil = userInfo.perfil.toLowerCase();

      return perfil === 'sup-psicologia' ||
             perfil === 'administrador';
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica si el usuario tiene rol de Cliente Admin
   */
  isClienteAdmin(): boolean {
    try {
      const userInfo = this.getUserInfo();

      if (!userInfo || !userInfo.perfil) {
        return false;
      }

      const perfil = userInfo.perfil.toLowerCase();

      return perfil === 'cliente admin';
    } catch (error) {
      return false;
    }
  }
}
