import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';

export interface LiberacionCasoRequest {
  caso_id: string;
  informe_liberacion: string;
  usuario_id: string;
}

export interface LiberacionCasoResponse {
  error: number;
  response?: {
    mensaje: string;
    data?: {
      caso_id: string;
      fecha_liberacion: string;
    };
  };
}

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

export interface ListarUsuariosResponse {
  error: number;
  response: {
    usuarios: Usuario[];
    total: number;
    mensaje?: string;
  };
}

export interface AsignarCasoRequest {
  caso_id: string;
  psicologo_id: string;
  supervisor_id: string;
}

export interface AsignarCasoResponse {
  error: number;
  response: {
    mensaje: string;
    data?: {
      caso_id: string;
      psicologo_asignado: string;
      fecha_asignacion: string;
    };
  };
}

export interface ReasignarCasoRequest {
  caso_id: string;
  psicologo_id: string;
  supervisor_id: string;
}

export interface ReasignarCasoResponse {
  error: number;
  response: {
    mensaje: string;
    data?: {
      caso_id: string;
      psicologo_anterior: string;
      psicologo_nuevo: string;
      fecha_reasignacion: string;
    };
  };
}

export interface CasoConUsuarioSic {
  _id: string;
  DOCUMENTO: string;
  NOMBRE: string;
  PRIMER_APELLIDO: string;
  SEGUNDO_APELLIDO?: string;
  USUARIO_SIC: string;
  TELEFONO?: string;
  CELULAR?: string;
  CORREO?: string;
  CIUDAD?: string;
  DEPARTAMENTO?: string;
  DIRECCION?: string;
  ESTADO?: string;
  EDAD?: number;
  GENERO?: string;
  FECH_NACIMIENTO?: string;
  DEPARTAMENTO_NACIMIENTO?: string;
  CIUDAD_NACIMIENTO?: string;
  NUMERO_CURSO?: string;
  TIPO_CURSO?: string;
  PKEYHOJAVIDA?: string;
  PKEYASPIRANT?: string;
  CODIGO_INSCRIPCION?: string;
  CODIPROGACAD?: string;
  ANNOPERIACAD?: string;
  NUMEPERIACAD?: string;
  COLEGIO?: string;
  FECHA_INSCRIPCION?: string;
  REGIONAL?: string;
  GRUP_MINO?: string;
  ESTRATO?: string;
  TIPO_MEDIO?: string;
  COMPLEMENTARIA_1?: string;
  COMPLEMENTARIA_2?: string;
  PDF_URL?: string;
  RUTA_BIOMETRIA?: any;
  RUTA_NOTIFICACION_RECIBIDA?: string;
  RUTA_PSICOLOGIA?: any;
  IPS_ID?: {
    _id: string;
    NOMBRE_IPS: string;
  };
  USUARIO_ID?: {
    _id: string;
    Cr_Nombre_Usuario: string;
    Cr_Pe_Codigo?: {
      Pe_Documento: string;
      Pe_Nombre?: string;
      Pe_Apellido?: string;
    };
  };
}

export interface CasosConUsuarioSicResponse {
  error: number;
  response: {
    mensaje: string;
    data: CasoConUsuarioSic[];
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PsicologiaGestionService {
  private baseApi = `${API_BASE_URL}/api`;
  private consultarUrl = `${this.baseApi}/hojas-vida/sin_usuario_sic`;
  private asignarUrl = `${this.baseApi}/hojas-vida/asignar_psicologo`;
  private crearNotificacionUrl = `${this.baseApi}/notificaciones/crear`;
  private gestionarEstadoNotificacionUrl = `${this.baseApi}/hojas-vida/estado_notificacion/gestionar`;
  private crearPreguntasUrl = `${this.baseApi}/preguntas_psicologia/crear`;
  private preguntasActivasUrl = `${this.baseApi}/preguntas_psicologia/activas`;
  private actualizarEstadoPreguntaUrl = `${this.baseApi}/preguntas_psicologia/actualizar-estado`;
  private reunionGestionarUrl = `${this.baseApi}/hojas-vida/reunion/gestionar`;
  private consultarNotificacionesUrl = `${this.baseApi}/notificaciones/consultar`;

  constructor(private readonly http: HttpClient) {}

  consultarHojasVida(): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<any>(this.consultarUrl, { headers });
  }

  asignarPsicologo(casoId: string): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const userRaw = localStorage.getItem('user');
    const usuarioSic = userRaw ? (JSON.parse(userRaw).id ?? '') : '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { id: casoId, USUARIO_SIC: usuarioSic };
    return this.http.put<any>(this.asignarUrl, body, { headers });
  }

  consultarCasosPorUsuarioSic(): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const userRaw = localStorage.getItem('user');
    const usuarioSic = userRaw ? (JSON.parse(userRaw).id ?? '') : '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { USUARIO_SIC: usuarioSic };
    return this.http.post<any>(`${this.baseApi}/hojas-vida/por_usuario_sic`, body, { headers });
  }

  obtenerPDF(filename: string): Observable<Blob> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.get(`${this.baseApi}/pdf/pdf/${filename}`, {
      headers,
      responseType: 'blob'
    });
  }

  obtenerPDFNotificacion(filename: string): Observable<Blob> {
    return this.http.get(`${this.baseApi}/pdf/recibida/${filename}`, {
      responseType: 'blob'
    });
  }

  obtenerPDFNotificacionAuth(filename: string): Observable<Blob> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(`${this.baseApi}/pdf/recibida/${filename}`, {
      headers,
      responseType: 'blob'
    });
  }

  crearNotificacion(asunto: string, mensaje: string, adjunto: File): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const userRaw = localStorage.getItem('user');
    let usuarioId = '';
    try {
      const parsed = userRaw ? JSON.parse(userRaw) : null;
      usuarioId = parsed?.response?.id ?? parsed?.id ?? '';
    } catch {
      usuarioId = '';
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('id_usuario', String(usuarioId));
    formData.append('asunto', asunto);
    formData.append('mensaje', mensaje);
    formData.append('archivo', adjunto, adjunto.name);

    return this.http.post<any>(this.crearNotificacionUrl, formData, { headers });
  }

  gestionarEstadoNotificacion(casoId: string): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const body = { id: casoId };
    return this.http.put<any>(this.gestionarEstadoNotificacionUrl, body, { headers });
  }

  crearPreguntasPsicologia(preguntas: Array<{ tipo: string; pregunta: string; estado: string }>): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const userRaw = localStorage.getItem('user');
    let usuarioId = '';
    try {
      const parsed = userRaw ? JSON.parse(userRaw) : null;
      usuarioId = parsed?.id ?? parsed?.response?.id ?? '';
    } catch {
      usuarioId = '';
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      id_usuario_creacion: String(usuarioId),
      preguntas
    };

    return this.http.post<any>(this.crearPreguntasUrl, body, { headers });
  }

  consultarPreguntasPsicologiaActivas(): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<any>(this.preguntasActivasUrl, { headers });
  }

  actualizarEstadoPregunta(id_pregunta: string, estado: 'activo' | 'inactivo'): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const userRaw = localStorage.getItem('user');
    let usuarioId = '';
    try {
      const parsed = userRaw ? JSON.parse(userRaw) : null;
      usuarioId = parsed?.id ?? parsed?.response?.id ?? '';
    } catch {
      usuarioId = '';
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      id_pregunta: String(id_pregunta),
      estado,
      id_usuario_actualiza: String(usuarioId)
    };

    return this.http.put<any>(this.actualizarEstadoPreguntaUrl, body, { headers });
  }

  gestionarReunion(id_caso: string, tipo_reunion: 'Virtual' | 'Presencial', fecha_hora: string, detalle_reunion: string): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const userRaw = localStorage.getItem('user');
    let usuarioId = '';
    try {
      const parsed = userRaw ? JSON.parse(userRaw) : null;
      usuarioId = parsed?.id ?? parsed?.response?.id ?? '';
    } catch {
      usuarioId = '';
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      id_caso: String(id_caso),
      id_usuario: String(usuarioId),
      fecha_hora,
      tipo_reunion,
      detalle_reunion
    };

    return this.http.put<any>(this.reunionGestionarUrl, body, { headers });
  }

  consultarNotificaciones(): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<any>(this.consultarNotificacionesUrl, { headers });
  }

  uploadPsicologiaPDF(idAspirante: string, pdfFile: File): Observable<any> {
    const token = localStorage.getItem('token') ?? '';
    const userRaw = localStorage.getItem('user');
    let usuarioId = '';
    try {
      const parsed = userRaw ? JSON.parse(userRaw) : null;
      usuarioId = parsed?.id ?? parsed?.response?.id ?? '';
    } catch {
      usuarioId = '';
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('id_aspirante', idAspirante);
    formData.append('id_usuario', usuarioId);
    formData.append('pdf', pdfFile, pdfFile.name);

    return this.http.put<any>(`${this.baseApi}/hojas-vida/upload_psicologia/`, formData, { headers });
  }

  descargarPDFPsicologia(idCaso: string): Observable<Blob> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.get(`${this.baseApi}/hojas-vida/psicologia/descargar/${idCaso}`, {
      headers,
      responseType: 'blob'
    });
  }

  descargarConsentimiento(filename: string): Observable<Blob> {
    // Extraer solo el nombre del archivo si viene con ruta
    let cleanFilename = filename;
    if (filename.includes('/')) {
      const parts = filename.split('/');
      cleanFilename = parts[parts.length - 1];
    }

    return this.http.get(`${this.baseApi}/pdf/recibida/${cleanFilename}`, {
      responseType: 'blob'
    });
  }

  /**
   * Libera un caso asignado a Psicología
   * @param request Datos de liberación (caso_id, informe, usuario_id)
   * @returns Observable con respuesta del backend
   */
  liberarCaso(request: LiberacionCasoRequest): Observable<LiberacionCasoResponse> {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    const url = `${this.baseApi}/psicologia-gestion/liberar-caso`;

    return this.http
      .post<LiberacionCasoResponse>(url, request, { headers })
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  /**
   * Obtiene lista de usuarios del sistema
   */
  listarUsuarios(): Observable<ListarUsuariosResponse> {
    const token = localStorage.getItem('token') ?? '';
    const url = `${this.baseApi}/users/consultar`;

    return this.http.get<ListarUsuariosResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }

  /**
   * Asigna un caso a un psicólogo
   */
  asignarCaso(request: AsignarCasoRequest): Observable<AsignarCasoResponse> {
    const token = localStorage.getItem('token') ?? '';
    const url = `${this.baseApi}/psicologia-gestion/asignar-caso`;

    return this.http.post<AsignarCasoResponse>(url, request, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }
}
