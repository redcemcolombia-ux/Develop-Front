import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';

export interface GestionarControlUsoRequest {
  id_usuario: string;
  co_cantidad: number;
}

export interface GestionarControlUsoData {
  id: string;
  id_usuario: string;
  co_cantidad: number;
  co_estado: boolean;
  co_fecha_registro: string;
  co_hora_registro: string;
}

export interface ApiResponse<T> {
  error: number;
  response?: T;
  mensaje?: string;
}

export interface GestionarControlUsoResponse {
  mensaje: string;
  datos?: GestionarControlUsoData;
}

export interface HistorialRegistro {
  _id: string;
  id_usuario: string;
  co_cantidad: number;
  co_estado: boolean;
  co_fecha_registro: string;
  co_hora_registro: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistorialUsuarioResponse {
  mensaje: string;
  total: number;
  usuario: any;
  registros: HistorialRegistro[];
}

@Injectable({ providedIn: 'root' })
export class GestionarControlUsoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  gestionarControlUso(idUsuario: string, cantidad: number): Observable<ApiResponse<GestionarControlUsoResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/control-uso-ips/gestionar`;
    const body: GestionarControlUsoRequest = {
      id_usuario: idUsuario,
      co_cantidad: cantidad
    };

    return this.http
      .post<ApiResponse<GestionarControlUsoResponse>>(url, body, { headers })
      .pipe(catchError((e) => this.handle<GestionarControlUsoResponse>(e)));
  }

  obtenerHistorial(idUsuario: string): Observable<ApiResponse<HistorialUsuarioResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/control-uso-ips/historial-usuario`;
    const body = { id_usuario: idUsuario };

    return this.http
      .post<ApiResponse<HistorialUsuarioResponse>>(url, body, { headers })
      .pipe(catchError((e) => this.handle<HistorialUsuarioResponse>(e)));
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

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
