import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';
import {
  CasosConUsuarioSicResponse,
  ReasignarCasoRequest,
  ReasignarCasoResponse
} from '../psicologiaGestion/psicologia-gestion.service';

@Injectable({
  providedIn: 'root'
})
export class ReasignacionCasosPsService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api`;

  /**
   * Obtiene casos con usuario SIC asignado
   */
  getCasosConUsuarioSic(): Observable<CasosConUsuarioSicResponse> {
    const token = localStorage.getItem('token');
    const url = `${this.apiUrl}/hojas-vida/con_usuario_sic`;

    return this.http.get<CasosConUsuarioSicResponse>(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reasigna un caso a otro psicólogo
   */
  reasignarCaso(request: ReasignarCasoRequest): Observable<ReasignarCasoResponse> {
    const url = `${this.apiUrl}/psicologia-gestion/reasignar-caso`;
    const token = localStorage.getItem('token');

    return this.http.post<ReasignarCasoResponse>(url, request, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error);
  }
}
