import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';

export interface Persona {
  _id: string;
  Pe_Nombre: string;
  Pe_Apellido: string;
  Pe_Seg_Apellido?: string;
  Pe_Tipo_Documento: string;
  Pe_Documento: string;
  Pe_Telefons_Fijo: string;
  Pe_Cel: string;
  Pe_Correo: string;
  Pe_Direccion: string;
  Pe_Permiso: string;
  Pe_Departamento: string;
  Pe_Ciudad: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Usuario {
  _id: string;
  Cr_Nombre_Usuario: string;
  Cr_Perfil: string;
  Cr_Empresa: string;
  Cr_Estado: string;
  Cr_Pe_Codigo: Persona;
  Cr_Ips?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  error: number;
  response?: T;
  mensaje?: string;
}

export interface ConsultarUsuariosResponse {
  mensaje?: string;
  total: number;
  usuarios: Usuario[];
}

@Injectable({ providedIn: 'root' })
export class ListadoUsuariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  consultarUsuarios(): Observable<ApiResponse<ConsultarUsuariosResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/users/consultar`;

    return this.http
      .get<ApiResponse<ConsultarUsuariosResponse>>(url, { headers })
      .pipe(catchError((e) => this.handle<ConsultarUsuariosResponse>(e)));
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
