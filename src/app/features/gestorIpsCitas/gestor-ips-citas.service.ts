import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';

export interface ApiResponse<T> {
  error: number;
  response?: T;
}

export interface HojaVida {
  _id: string;
  PKEYHOJAVIDA: string;
  PKEYASPIRANT: string;
  DOCUMENTO: string;
  NOMBRE: string;
  PRIMER_APELLIDO: string;
  SEGUNDO_APELLIDO: string;
  EDAD: number;
  GENERO: string;
  FECH_NACIMIENTO: string;
  CORREO: string;
  TELEFONO: string;
  CELULAR: string;
  DIRECCION: string;
  CIUDAD: string;
  ESTADO: string;
  DEPARTAMENTO: string;
  REGIONAL: string;
  CODIGO_INSCRIPCION: string;
  CODIPROGACAD: string;
  ANNOPERIACAD: number;
  NUMEPERIACAD: string;
  GRUP_MINO: string;
  ESTRATO: string;
  TIPO_MEDIO: string;
  COLEGIO: string;
  COMPLEMENTARIA_1: string;
  COMPLEMENTARIA_2: string;
  FECHA_INSCRIPCION: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultarHojasVidaResponse {
  hojas_vida: HojaVida[];
  total_registros: number;
  mensaje?: string;
}

export interface TomarCasoPayload {
  hojaVidaId: string;
  fecha_hora: string;
  examenes: string;
  recomendaciones: string;
  usuario_id: string;
  ips_id: string;
}

export interface TomarCasoResponse {
  mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class GestorIpsCitasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  consultarHojasVida(): Observable<ApiResponse<ConsultarHojasVidaResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/hojas-vida/consultar`;
    return this.http
      .get<ApiResponse<ConsultarHojasVidaResponse>>(url, { headers })
      .pipe(catchError((e) => this.handle<ConsultarHojasVidaResponse>(e)));
  }

  tomarCaso(payload: TomarCasoPayload): Observable<ApiResponse<TomarCasoResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/hojas-vida/agendar`;
    return this.http
      .put<ApiResponse<TomarCasoResponse>>(url, payload, { headers })
      .pipe(catchError((e) => this.handle<TomarCasoResponse>(e)));
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

