import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';

/**
 * Interface para respuesta genérica de API
 */
export interface ApiResponse<T> {
  error: number;
  response?: T;
  mensaje?: string;
}

/**
 * Interface para usuario populado
 */
export interface UsuarioPopulado {
  _id: string;
  Cr_Nombre_Usuario: string;
  Cr_Correo: string;
  Cr_Pe_Codigo: string;
}

/**
 * Interface para evidencia
 */
export interface Evidencia {
  ruta: string | null;
  nombre_original: string | null;
  fecha_subida: string;
}

/**
 * Interface para escalamiento (estructura completa del nuevo endpoint)
 */
export interface Escalamiento {
  _id: string;
  descripcion: string;
  prioridad: 'ALTO' | 'MEDIO' | 'BAJO';
  usuario_id: UsuarioPopulado;
  evidencia: Evidencia;
  evidencia_url?: string; // URL completa generada por el backend
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
  fecha_resolucion: string | null;
  usuario_asignado: UsuarioPopulado | null;
  notas_resolucion: string | null;
  imagen_resolucion?: {
    ruta: string | null;
    nombre_original: string | null;
    fecha_subida: string | null;
  };
  imagen_resolucion_url?: string; // URL completa para imagen de resolución
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para caso escalado (estructura antigua - mantener compatibilidad)
 */
export interface CasoEscalado {
  _id?: string;
  codigo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  usuario_id: string;
  usuario_nombre?: string;
  gestor_asignado?: string;
  gestor_id?: string;
  evidencia_url?: string;
  fecha_escalamiento: string;
  fecha_actualizacion?: string;
  respuesta?: string;
  fecha_respuesta?: string;
  solucion_imagen_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface para respuesta de escalar caso
 */
export interface EscalarCasoResponse {
  mensaje: string;
  codigo: string;
  caso_id?: string;
}

/**
 * Interface para respuesta de consultar seguimientos
 */
export interface ConsultarSeguimientosResponse {
  data: CasoEscalado[];
  mensaje?: string;
  total?: number;
}

/**
 * Interface para imagen de resolución
 */
export interface ImagenResolucion {
  ruta: string;
  nombre_original: string;
  url: string;
}

/**
 * Interface para respuesta de gestionar caso
 */
export interface GestionarCasoResponse {
  mensaje: string;
  escalamiento: {
    id: string;
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
    usuario_asignado: UsuarioPopulado;
    notas_resolucion?: string;
    fecha_resolucion?: string;
    imagen_resolucion?: ImagenResolucion;
    fecha_actualizacion: string;
  };
}

/**
 * Interface para respuesta de obtener escalamientos
 */
export interface ObtenerEscalamientosResponse {
  mensaje: string;
  total: number;
  escalamientos: Escalamiento[];
}

@Injectable({ providedIn: 'root' })
export class MesaAyudaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  /**
   * Escala un caso a Mesa de Ayuda
   * @param formData FormData con: descripcion, prioridad, usuario_id, evidencia (opcional JPG/PNG max 5MB)
   * @returns Observable con respuesta del backend
   */
  escalarCaso(formData: FormData): Observable<ApiResponse<EscalarCasoResponse>> {
    const url = `${this.baseUrl}/api/mesa-ayuda/escalar`;
    const token = localStorage.getItem('token') || '';

    return this.http.post<ApiResponse<EscalarCasoResponse>>(url, formData, {
      headers: {
        'Authorization': `Bearer ${token}`
        // NO incluir Content-Type — HttpClient lo setea automáticamente con boundary
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }

  /**
   * Consulta los casos escalados por un usuario
   * @param usuarioId ID del usuario
   * @returns Observable con lista de casos escalados
   */
  consultarSeguimientos(usuarioId: string): Observable<ApiResponse<ConsultarSeguimientosResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/mesa-ayuda/seguimientos`;
    const payload = { usuario_id: usuarioId };

    return this.http
      .post<ApiResponse<ConsultarSeguimientosResponse>>(url, payload, { headers })
      .pipe(catchError((e) => this.handle<ConsultarSeguimientosResponse>(e)));
  }

  /**
   * Consulta todos los casos escalados (solo admin)
   * @returns Observable con lista de todos los casos escalados
   */
  consultarTodosEscalamientos(): Observable<ApiResponse<ConsultarSeguimientosResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/mesa-ayuda/todos`;

    return this.http
      .get<ApiResponse<ConsultarSeguimientosResponse>>(url, { headers })
      .pipe(catchError((e) => this.handle<ConsultarSeguimientosResponse>(e)));
  }

  /**
   * Obtiene todos los escalamientos con información completa (GET)
   * @returns Observable con lista completa de escalamientos con usuarios populados
   */
  obtenerEscalamientos(): Observable<ApiResponse<ObtenerEscalamientosResponse>> {
    const url = `${this.baseUrl}/api/mesa-ayuda/escalamientos`;
    const token = localStorage.getItem('token') || '';

    return this.http.get<ApiResponse<ObtenerEscalamientosResponse>>(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }

  /**
   * Gestiona un caso escalado (responder y resolver/rechazar)
   * @param formData FormData con: caso_id, gestor_id, respuesta, estado_final, solucion_imagen (opcional)
   * @returns Observable con respuesta del backend
   */
  gestionarCaso(formData: FormData): Observable<ApiResponse<GestionarCasoResponse>> {
    const url = `${this.baseUrl}/api/mesa-ayuda/gestionar`;
    const token = localStorage.getItem('token') || '';

    return this.http.put<ApiResponse<GestionarCasoResponse>>(url, formData, {
      headers: {
        'Authorization': `Bearer ${token}`
        // NO incluir Content-Type — HttpClient lo setea automáticamente con boundary
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }

  /**
   * Obtiene la imagen de evidencia de un escalamiento (requiere autenticación)
   * @param escalamientoId ID del escalamiento
   * @returns Observable con el blob de la imagen
   */
  obtenerImagenEvidencia(escalamientoId: string): Observable<Blob> {
    const url = `${this.baseUrl}/api/mesa-ayuda/evidencia/${escalamientoId}`;
    const token = localStorage.getItem('token') || '';

    console.log('🖼️ [Service] Solicitando imagen de evidencia:', url);

    return this.http.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ [Service] Error al obtener imagen:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene la imagen de resolución de un escalamiento (requiere autenticación)
   * @param escalamientoId ID del escalamiento
   * @returns Observable con el blob de la imagen
   */
  obtenerImagenResolucion(escalamientoId: string): Observable<Blob> {
    const url = `${this.baseUrl}/api/mesa-ayuda/evidencia-resolucion/${escalamientoId}`;
    const token = localStorage.getItem('token') || '';

    console.log('🖼️ [Service] Solicitando imagen de resolución:', url);

    return this.http.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ [Service] Error al obtener imagen de resolución:', error);
        return throwError(() => error);
      })
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

  /**
   * Maneja errores estructurados de la API
   */
  private handle<T>(error: HttpErrorResponse): Observable<ApiResponse<T>> {
    const structured = error.error;
    if (structured && typeof structured === 'object' && 'error' in structured) {
      return new Observable<ApiResponse<T>>((observer) => {
        observer.next(structured as ApiResponse<T>);
        observer.complete();
      });
    }
    return throwError(() => error) as Observable<ApiResponse<T>>;
  }
}
