import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiUrl = `${API_BASE_URL}/api/users/register`;
  private ipsApiUrl = `${API_BASE_URL}/api/ips/consultar`;

  constructor(private http: HttpClient) {}

  register(payload: { persona: any, credenciales: any }): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<any>(this.apiUrl, payload, { headers });
  }

  consultarIps(): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<any>(this.ipsApiUrl, { headers });
  }
}
