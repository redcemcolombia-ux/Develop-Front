import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';

export interface ApiResponse<T> {
  error: number;
  response?: T;
}

export interface ActualizarIpsPayload {
  id: string;
  NOMBRE_IPS: string;
  NIT: string;
  DIRECCION: string;
  TELEFONO: string;
  CORREO: string;
  REPRESENTANTE: string;
  CIUDAD: string;
  DEPARTAMENTO: string;
  REGIONAL: string;
  ESTADO: 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA';
  COMPLEMENTARIA_1: {
    tipo_atencion: string;
    especialidades: string[];
  };
  COMPLEMENTARIA_2: {
    horario_atencion: string;
    nivel_complejidad: string;
  };
}

export interface ActualizarIpsResponse {
  mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class EditarIpsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  actualizarIps(payload: ActualizarIpsPayload): Observable<ApiResponse<ActualizarIpsResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/ips/actualizar`;
    return this.http
      .post<ApiResponse<ActualizarIpsResponse>>(url, payload, { headers })
      .pipe(catchError((e) => this.handle<ActualizarIpsResponse>(e)));
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
