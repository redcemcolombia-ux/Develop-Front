import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';

export interface ApiResponse<T> {
  error: number;
  response?: T;
  mensaje?: string;
}

export interface HojaVida {
  _id: string;
  PKEYHOJAVIDA?: string;
  PKEYASPIRANT?: string;
  NUMERO_CURSO?: string;
  TIPO_CURSO?: string;
  DOCUMENTO: string;
  NOMBRE: string;
  PRIMER_APELLIDO: string;
  SEGUNDO_APELLIDO: string;
  EDAD: number;
  GENERO: string;
  FECH_NACIMIENTO: string;
  DEPARTAMENTO_NACIMIENTO?: string;
  CIUDAD_NACIMIENTO?: string;
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
  EXAMENES?: string;
  FECHA_HORA?: string;
  IPS_ID?: any;
  RECOMENDACIONES?: string;
  USUARIO_ID?: any;
  NOMBREIPS?: string;
  PDF_URL?: string;
  RUTA_BIOMETRIA?: {
    ruta: string;
    fecha: string;
    id_usuario?: any;
  };
  RUTA_PSICOLOGIA?: {
    ruta: string;
    fecha: string;
    id_usuario?: any;
  };
  RUTA_NOTIFICACION_RECIBIDA?: string;
  ESTADO_NOTIFICACION?: string;
  H_ESTADO_NOTIFICACION_CONSENTIMIENTO?: string;
  DETALLE?: string;
  USUARIO_SIC?: string;
  DETALLE_REUNION?: string;
  FECHA_HORA_CITA_PSICOLOGIA?: string;
  TIPO_REUNION?: string;
  ESTADO_CIERRE?: string;
  FECHA_CIERRE?: string;
  NOTAS_CIERRE?: string;
  TIPO_CIERRE?: string;
  USUARIO_GESTOR_CIERRE?: any;
  SEGUNDA_GESTION_IPS?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultarCasosTomadosResponse {
  data: HojaVida[];
  mensaje?: string;
}

export interface ConsultarCasosRetornoIpsResponse {
  casos: HojaVida[];
  mensaje?: string;
  total?: number;
  ips?: any;
}

@Injectable({ providedIn: 'root' })
export class MisCasosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  consultarCasosTomados(ipsId: string): Observable<ApiResponse<ConsultarCasosTomadosResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/hojas-vida/por_ips`;
    const payload = { ips_id: ipsId };

    return this.http
      .post<ApiResponse<ConsultarCasosTomadosResponse>>(url, payload, { headers })
      .pipe(catchError((e) => this.handle<ConsultarCasosTomadosResponse>(e)));
  }

  cargarPDF(hojaVidaId: string, pdfFile: File): Observable<ApiResponse<any>> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('id', hojaVidaId);
    formData.append('token', token);
    formData.append('pdf', pdfFile);

    const url = `${this.baseUrl}/api/pdf/pdf`;
    return this.http
      .put<ApiResponse<any>>(url, formData, { headers })
      .pipe(catchError((e) => this.handle<any>(e)));
  }

  cargarPDFSegundaGestion(hojaVidaId: string, pdfFile: File): Observable<ApiResponse<any>> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('id', hojaVidaId);
    formData.append('token', token);
    formData.append('pdf', pdfFile);

    const url = `${this.baseUrl}/api/pdf/segunda-gestion`;
    return this.http
      .put<ApiResponse<any>>(url, formData, { headers })
      .pipe(catchError((e) => this.handle<any>(e)));
  }

  obtenerPDF(filename: string): Observable<Blob> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/pdf/pdf/${filename}`;

    return this.http
      .get(url, { headers, responseType: 'blob' })
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  subirBiometria(idAspirante: string, idUsuario: string, pdfFile: File): Observable<ApiResponse<any>> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('id_aspirante', idAspirante);
    formData.append('id_usuario', idUsuario);
    formData.append('pdf', pdfFile, pdfFile.name);

    const url = `${this.baseUrl}/api/hojas-vida/biometria/subir`;
    return this.http
      .put<ApiResponse<any>>(url, formData, { headers })
      .pipe(catchError((e) => this.handle<any>(e)));
  }

  obtenerBiometriaPorAspirante(idAspirante: string): Observable<Blob> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/hojas-vida/biometria/descargar/${idAspirante}`;

    return this.http
      .get(url, { headers, responseType: 'blob' })
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  consultarCasosRetornoIps(ipsId: string): Observable<ApiResponse<ConsultarCasosRetornoIpsResponse>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/hojas-vida/casos/retorno-ips`;
    const payload = { id_ips: ipsId };

    return this.http
      .post<ApiResponse<ConsultarCasosRetornoIpsResponse>>(url, payload, { headers })
      .pipe(catchError((e) => this.handle<ConsultarCasosRetornoIpsResponse>(e)));
  }

  validarDescontarCaso(usuarioId: string): Observable<ApiResponse<any>> {
    const headers = this.buildAuthHeaders();
    const url = `${this.baseUrl}/api/hojas-vida/validar-descontar-caso`;
    const payload = { usuario_id: usuarioId };

    return this.http
      .post<ApiResponse<any>>(url, payload, { headers })
      .pipe(catchError((e) => this.handle<any>(e)));
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
