import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

@Injectable({
  providedIn: 'root'
})
export class HojaVidaService {
  private baseApi = `${API_BASE_URL}/api`;
  private registerUrl = `${this.baseApi}/hojas-vida/crear`;
  private registerBulkUrl = `${this.baseApi}/hojas-vida/crear`;
  private consultarUrl = `${this.baseApi}/hojas-vida/hojas-vida-full`;
  private pdfUrl = `${this.baseApi}/pdf/pdf`;
  private biometriaUrl = `${this.baseApi}/pdf/biometria`;

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  register(hojaVida: any): Observable<any> {
    return this.http.post<any>(this.registerUrl, hojaVida, { headers: this.getHeaders() });
  }

  registerBulk(hojasVida: any[]): Observable<any> {
    return this.http.post<any>(this.registerBulkUrl, hojasVida, { headers: this.getHeaders() });
  }

  consultarHojasVida(): Observable<any> {
    return this.http.get<any>(this.consultarUrl, { headers: this.getHeaders() });
  }

  obtenerPDF(filename: string): Observable<Blob> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(`${this.pdfUrl}/${filename}`, { headers, responseType: 'blob' });
  }

  obtenerPDFRecibida(filename: string): Observable<Blob> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(`${this.baseApi}/pdf/recibida/${filename}`, { headers, responseType: 'blob' });
  }

  obtenerPDFRecibidaNotificaciones(filename: string): Observable<Blob> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(`${this.baseApi}/pdf/recibida/${filename}`, { headers, responseType: 'blob' });
  }

  obtenerBiometriaPorAspirante(aspiranteId: string): Observable<Blob> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(`${this.biometriaUrl}/${aspiranteId}`, { headers, responseType: 'blob' });
  }

  validateHojaVida(hojaVida: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones de campos requeridos
    if (!hojaVida.NUMERO_CURSO) errors.push('Numero Curso es requerido');
    if (!hojaVida.TIPO_CURSO) errors.push('Tipo Curso es requerido');
    if (!hojaVida.CODIPROGACAD) errors.push('Programa Académico es requerido');
    if (!hojaVida.ANNOPERIACAD) errors.push('Año Período Académico es requerido');
    if (!hojaVida.NUMEPERIACAD) errors.push('Número Período Académico es requerido');
    if (!hojaVida.CODIGO_INSCRIPCION) errors.push('Código de Inscripción es requerido');
    if (!hojaVida.DOCUMENTO) errors.push('Documento es requerido');
    if (!hojaVida.NOMBRE) errors.push('Nombre es requerido');
    if (!hojaVida.PRIMER_APELLIDO) errors.push('Primer Apellido es requerido');
    if (!hojaVida.EDAD || hojaVida.EDAD < 16 || hojaVida.EDAD > 35) errors.push('Edad debe estar entre 16 y 35');
    if (!hojaVida.GENERO) errors.push('Género es requerido');
    if (!hojaVida.FECH_NACIMIENTO) errors.push('Fecha de Nacimiento es requerida');
    if (!hojaVida.DEPARTAMENTO_NACIMIENTO) errors.push('Departamento de Nacimiento es requerido');
    if (!hojaVida.CIUDAD_NACIMIENTO) errors.push('Ciudad de Nacimiento es requerida');
    if (!hojaVida.CORREO) errors.push('Correo es requerido');
    if (!hojaVida.CELULAR) errors.push('Celular es requerido');
    if (!hojaVida.DIRECCION) errors.push('Dirección es requerida');
    if (!hojaVida.CIUDAD) errors.push('Ciudad es requerida');
    if (!hojaVida.ESTADO) errors.push('Estado es requerido');
    if (!hojaVida.DEPARTAMENTO) errors.push('Departamento es requerido');
    if (!hojaVida.REGIONAL) errors.push('Regional es requerida');
    if (!hojaVida.FECHA_INSCRIPCION) errors.push('Fecha de Inscripción es requerida');
    if (!hojaVida.ESTRATO) errors.push('Estrato es requerido');
    if (!hojaVida.TIPO_MEDIO) errors.push('Tipo de Medio es requerido');
    if (!hojaVida.COLEGIO) errors.push('Colegio es requerido');

    // Validaciones de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (hojaVida.CORREO && !emailRegex.test(hojaVida.CORREO)) {
      errors.push('Correo electrónico inválido');
    }

    const phoneRegex = /^\d{7,12}$/;
    if (hojaVida.TELEFONO && !phoneRegex.test(hojaVida.TELEFONO)) {
      errors.push('Teléfono debe tener entre 7 y 12 dígitos');
    }
    if (hojaVida.CELULAR && !phoneRegex.test(hojaVida.CELULAR)) {
      errors.push('Celular debe tener entre 7 y 12 dígitos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  descargarBiometria(idCaso: string): Observable<Blob> {
    const headers = this.getHeaders();
    return this.http.get(`${this.baseApi}/hojas-vida/biometria/descargar/${idCaso}`, {
      headers,
      responseType: 'blob'
    });
  }

  gestionarCierre(payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseApi}/hojas-vida/cierre/gestionar`, payload, { headers: this.getHeaders() });
  }
}
