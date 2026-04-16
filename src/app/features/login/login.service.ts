import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private apiUrl = `${API_BASE_URL}/api/auth/login`;
  private refreshUrl = `${API_BASE_URL}/api/auth/refresh`;

  constructor(private http: HttpClient) {}

  loginService(credentials: { email: string, password: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials);
  }

  refreshToken(): Observable<any> {
    const token = localStorage.getItem('token');
    return this.http.post<any>(this.refreshUrl, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}
