import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

@Injectable({ providedIn: 'root' })
export class EditarUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  actualizarUsuario(data: any): Observable<any> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/users/actualizar`;
    return this.http.post(url, data, { headers });
  }

  consultarIps(): Observable<any> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/ips/consultar`;
    return this.http.get(url, { headers });
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }
}
