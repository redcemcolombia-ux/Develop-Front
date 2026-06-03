import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';

/**
 * Interface para usuario en historial
 */
export interface UsuarioHistorial {
  _id: string;
  Cr_Nombre_Usuario: string;
  Cr_Correo: string;
}

/**
 * Interface para historial de exámenes
 */
export interface HistorialExamen {
  id_usuario_original: any;
  ruta_anterior: string;
  fecha_anterior: string | null;
  fecha_cambio: string;
  notas_cambio: string;
  id_usuario_cambio: UsuarioHistorial;
  leido: boolean;
  _id: string;
}

/**
 * Interface para información de liberación
 */
export interface InfoLiberacion {
  caso_id: string;
  informe_liberacion: string;
  usuario_id: UsuarioHistorial;
  fecha_liberacion: string;
  leido: boolean;
  _id: string;
}

/**
 * Interface para historial de biometría
 */
export interface HistorialBiometria {
  id_usuario_original: any;
  ruta_anterior: string;
  fecha_anterior: string | null;
  fecha_cambio: string;
  notas_cambio: string;
  id_usuario_cambio: UsuarioHistorial;
  leido: boolean;
  _id: string;
}

/**
 * Interface para IPS
 */
export interface IPS {
  _id: string;
  NOMBRE_IPS: string;
  NIT: string;
  DIRECCION: string;
  TELEFONO: string;
  CORREO: string;
}

/**
 * Interface para permiso de usuario SIC
 */
export interface PermisoUsuarioSIC {
  _id: string;
  Pe_Nombre: string;
  Pe_Apellido: string;
  Pe_Seg_Apellido: string;
}

/**
 * Interface para notificación de hoja de vida
 */
export interface Notificacion {
  _id: string;
  DOCUMENTO: string;
  NOMBRE: string;
  PRIMER_APELLIDO: string;
  SEGUNDO_APELLIDO: string;
  CORREO: string;
  ESTADO: string;
  HISTORIAL_EXAMENES: HistorialExamen[];
  INFO_LIBERACION: InfoLiberacion[];
  HISTORIAL_BIOMETRIA: HistorialBiometria[];
  IPS: IPS;
  Cr_Pe_Codigo?: string;
  PERMISO_USUARIO_SIC: PermisoUsuarioSIC;
  total_historial_examenes: number;
  total_info_liberacion: number;
  total_historial_biometria: number;
  total_notificaciones_no_leidas: number;
  RUTA_BIOMETRIA?: { ruta: string; id_usuario?: string; fecha?: string };
  RUTA_PSICOLOGIA?: { ruta: string; id_usuario?: string; fecha?: string };
  PDF_URL?: string;
  leido_ruta_biometria?: boolean;
  leido_ruta_psicologia?: boolean;
  leido_pdf_url?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para respuesta genérica de API
 */
export interface ApiResponse<T> {
  error: number;
  response?: T;
  mensaje?: string;
}

/**
 * Interface para respuesta de notificaciones
 */
export interface NotificacionesResponse {
  mensaje: string;
  total: number;
  notificaciones: Notificacion[];
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  /**
   * Obtiene las notificaciones de hojas de vida con cambios
   * @returns Observable con las notificaciones
   */
  obtenerNotificaciones(): Observable<ApiResponse<NotificacionesResponse>> {
    const url = `${this.baseUrl}/api/hojas-vida/notificaciones`;
    const token = localStorage.getItem('token') || '';

    return this.http.get<ApiResponse<NotificacionesResponse>>(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }

  /**
   * Construye headers con autenticación
   */
  private buildAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }
}
