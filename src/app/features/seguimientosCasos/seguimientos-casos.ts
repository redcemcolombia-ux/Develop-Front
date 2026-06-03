import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { AuthService } from '../../core/auth.service';
import { MesaAyudaService, CasoEscalado, Escalamiento } from '../mesaAyuda/mesa-ayuda.service';

@Component({
  selector: 'app-seguimientos-casos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguimientos-casos.html'
})
export class SeguimientosCasos implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly mesaAyudaService = inject(MesaAyudaService);
  private readonly sanitizer = inject(DomSanitizer);

  isLoading = false;
  casosEscalados: CasoEscalado[] = [];
  casosFiltrados: CasoEscalado[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  Math = Math;
  imagenCargando = false;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Autenticación',
        text: 'No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.isLoading = true;

    this.mesaAyudaService.consultarSeguimientos(userId).subscribe({
      next: (resp) => {
        this.isLoading = false;
        if (resp.error === 0) {
          // DEBUG: Ver respuesta completa del backend
          console.log('📦 Respuesta completa del backend:', resp);
          console.log('📋 Casos del usuario recibidos:', resp.response?.data);

          // Obtener los casos del usuario y mapearlos
          const casosUsuario = resp.response?.data ?? [];

          // Mapear a estructura CasoEscalado
          this.casosEscalados = casosUsuario.map((esc: any) => this.mapearEscalamientoACaso(esc));
          this.totalItems = this.casosEscalados.length;
          this.filtrar();

          if (this.casosEscalados.length === 0) {
            Swal.fire({
              icon: 'info',
              title: 'Sin Escalamientos',
              text: 'No tiene casos escalados registrados',
              confirmButtonText: 'Entendido',
              timer: 3000
            });
          }
        } else {
          this.casosEscalados = [];
          this.casosFiltrados = [];
          this.totalItems = 0;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.casosEscalados = [];
        this.casosFiltrados = [];
        this.totalItems = 0;

        let mensaje = 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.';

        if (error.status === 401) {
          mensaje = error.error?.response?.mensaje || 'Sesión expirada. Por favor, inicie sesión nuevamente.';
        } else if (error.status === 500) {
          mensaje = error.error?.response?.mensaje || 'Error interno del servidor. Intente nuevamente más tarde.';
        } else if (error.error?.response?.mensaje) {
          mensaje = error.error.response.mensaje;
        }

        Swal.fire({
          icon: 'error',
          title: error.status === 401 ? 'Sesión Expirada' : 'Error de Conexión',
          text: mensaje,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Mapea un Escalamiento a CasoEscalado (compatibilidad con tabla actual)
   */
  private mapearEscalamientoACaso(escalamiento: Escalamiento): CasoEscalado {
    // La nueva URL usa el endpoint protegido: /api/mesa-ayuda/evidencia/:escalamientoId
    // Ya NO se usa /storage/ porque requiere autenticación
    let evidenciaUrl: string | undefined = undefined;

    // DEBUG: Mostrar datos de evidencia
    const tieneEvidencia = escalamiento.evidencia?.ruta || escalamiento.evidencia_url;
    if (tieneEvidencia) {
      console.group(`🖼️ Procesando evidencia para caso ${escalamiento._id.slice(-8)}`);
      console.log('escalamiento._id:', escalamiento._id);
      console.log('evidencia_url (del backend):', escalamiento.evidencia_url);
      console.log('evidencia.ruta:', escalamiento.evidencia?.ruta);
      console.log('evidencia.nombre_original:', escalamiento.evidencia?.nombre_original);
    }

    if (escalamiento.evidencia_url) {
      // Prioridad 1: Usar URL completa del backend
      evidenciaUrl = escalamiento.evidencia_url;
      console.log('✅ USANDO evidencia_url del backend:', evidenciaUrl);
    } else if (escalamiento.evidencia?.ruta) {
      // Fallback: Construir URL con el nuevo endpoint protegido
      // Formato: https://redcemed.com/api/mesa-ayuda/evidencia/{escalamientoId}
      evidenciaUrl = `https://redcemed.com/api/mesa-ayuda/evidencia/${escalamiento._id}`;
      console.log('⚠️ CONSTRUIDA (usando endpoint protegido):', evidenciaUrl);
    }

    if (tieneEvidencia) {
      console.log('📌 URL FINAL que se usará:', evidenciaUrl);
      console.groupEnd();
    }

    // Construir URL de imagen de resolución si existe
    let solucionImagenUrl: string | undefined = undefined;
    if (escalamiento.imagen_resolucion_url) {
      solucionImagenUrl = escalamiento.imagen_resolucion_url;
      console.log('✅ USANDO imagen_resolucion_url del backend:', solucionImagenUrl);
    } else if (escalamiento.imagen_resolucion?.ruta) {
      solucionImagenUrl = `https://redcemed.com/api/mesa-ayuda/evidencia-resolucion/${escalamiento._id}`;
      console.log('⚠️ CONSTRUIDA URL de imagen de resolución:', solucionImagenUrl);
    }

    return {
      _id: escalamiento._id,
      codigo: escalamiento._id.slice(-8).toUpperCase(), // Generar código desde el ID
      descripcion: escalamiento.descripcion,
      prioridad: escalamiento.prioridad,
      estado: escalamiento.estado,
      usuario_id: escalamiento.usuario_id?._id || '',
      usuario_nombre: escalamiento.usuario_id?.Cr_Nombre_Usuario || 'N/A',
      gestor_asignado: escalamiento.usuario_asignado?.Cr_Nombre_Usuario || undefined,
      gestor_id: escalamiento.usuario_asignado?._id || undefined,
      evidencia_url: evidenciaUrl,
      fecha_escalamiento: escalamiento.createdAt,
      fecha_actualizacion: escalamiento.updatedAt,
      respuesta: escalamiento.notas_resolucion || undefined,
      fecha_respuesta: escalamiento.fecha_resolucion || undefined,
      solucion_imagen_url: solucionImagenUrl,
      createdAt: escalamiento.createdAt,
      updatedAt: escalamiento.updatedAt
    };
  }

  filtrar(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.casosFiltrados = [...this.casosEscalados];
    } else {
      this.casosFiltrados = this.casosEscalados.filter(
        (caso) =>
          caso.codigo?.toLowerCase().includes(term) ||
          caso.usuario_nombre?.toLowerCase().includes(term) ||
          caso.estado?.toLowerCase().includes(term) ||
          caso.prioridad?.toLowerCase().includes(term) ||
          caso.gestor_asignado?.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
  }

  get casosPaginados(): CasoEscalado[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.casosFiltrados.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.casosFiltrados.length / this.itemsPerPage);
  }

  get paginasArray(): number[] {
    const pages = [];
    const maxVisible = 3;
    let start = Math.max(1, this.currentPage - 1);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  cambiarPagina(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  getPrioridadBadgeClass(prioridad: string): string {
    switch (prioridad?.toUpperCase()) {
      case 'ALTO':
        return 'bg-danger';
      case 'MEDIO':
        return 'bg-warning text-dark';
      case 'BAJO':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
      case 'escalado':
        return 'bg-primary';
      case 'en proceso':
      case 'en_proceso':
        return 'bg-info';
      case 'resuelto':
      case 'finalizado':
        return 'bg-success';
      case 'cerrado':
        return 'bg-success';
      case 'rechazado':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  verDetalle(caso: CasoEscalado): void {
    // Log para depuración de URL de evidencia
    console.group(`🔍 Ver Detalle del Caso ${caso.codigo}`);
    console.log('📋 Caso completo:', caso);
    console.log('📸 URL de evidencia:', caso.evidencia_url);
    if (caso.evidencia_url) {
      console.log('🔗 Probar URL en navegador:', caso.evidencia_url);
      console.log('💡 Copia esta URL y pégala directamente en el navegador para probar');
    }
    console.groupEnd();

    let html = '<div class="container-fluid text-start">';

    // Información General
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-primary text-white">';
    html += '<h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Información General</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const generalFields = [
      { label: 'Código', value: caso.codigo },
      { label: 'Usuario que Escaló', value: caso.usuario_nombre || 'N/A' },
      { label: 'Prioridad', value: caso.prioridad, isBadge: true, badgeClass: this.getPrioridadBadgeClass(caso.prioridad) },
      { label: 'Estado', value: caso.estado, isBadge: true, badgeClass: this.getEstadoBadgeClass(caso.estado) },
      { label: 'Fecha Escalamiento', value: this.formatearFecha(caso.fecha_escalamiento) },
      { label: 'Asignado', value: caso.gestor_asignado || 'Sin asignar' },
      { label: 'Fecha Última Actualización', value: this.formatearFecha(caso.fecha_actualizacion) }
    ];

    generalFields.forEach((field) => {
      html += `<div class="col-md-6 mb-3">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      if (field.isBadge) {
        html += `<span class="badge ${field.badgeClass}" style="font-size: 1em;">${field.value}</span>`;
      } else {
        html += `<span class="text-dark" style="font-size: 1.1em;">${field.value || 'N/A'}</span>`;
      }
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Descripción del Caso
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-danger text-white">';
    html += '<h6 class="mb-0"><i class="bi bi-file-text me-2"></i>Descripción del Caso</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += `<p class="mb-0" style="white-space: pre-wrap;">${caso.descripcion || 'N/A'}</p>`;
    html += '</div></div>';

    // Evidencia - Cargar con autenticación
    if (caso.evidencia_url && caso._id) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-danger text-white">';
      html += '<h6 class="mb-0"><i class="bi bi-image me-2"></i>Evidencia</h6>';
      html += '</div>';
      html += '<div class="card-body text-center">';
      html += `<div id="evidenciaContainer">`;
      html += `<div class="spinner-border text-primary" role="status">`;
      html += `<span class="visually-hidden">Cargando imagen...</span>`;
      html += `</div>`;
      html += `<p class="text-muted mt-2">Cargando evidencia...</p>`;
      html += `</div>`;
      html += '</div></div>';
    }

    // Respuesta
    if (caso.respuesta) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-success text-white">';
      html += '<h6 class="mb-0"><i class="bi bi-chat-left-text me-2"></i>Respuesta de Mesa de Ayuda</h6>';
      html += '</div>';
      html += '<div class="card-body">';
      html += `<p class="mb-0" style="white-space: pre-wrap;">${caso.respuesta}</p>`;
      if (caso.fecha_respuesta) {
        html += `<small class="text-muted d-block mt-2">Fecha Resolución: ${this.formatearFecha(caso.fecha_respuesta)}</small>`;
      }
      html += '</div></div>';
    }

    // Imagen de Solución - Cargar con autenticación
    if (caso.solucion_imagen_url && caso._id) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-success text-white">';
      html += '<h6 class="mb-0"><i class="bi bi-image me-2"></i>Imagen de Solución</h6>';
      html += '</div>';
      html += '<div class="card-body text-center">';
      html += `<div id="solucionContainer">`;
      html += `<div class="spinner-border text-success" role="status">`;
      html += `<span class="visually-hidden">Cargando imagen...</span>`;
      html += `</div>`;
      html += `<p class="text-muted mt-2">Cargando imagen de solución...</p>`;
      html += `</div>`;
      html += '</div></div>';
    }

    html += '</div>';

    Swal.fire({
      title: `Detalle del Caso - ${caso.codigo}`,
      html,
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar',
      didOpen: () => {
        // Cargar imagen de evidencia con autenticación si existe
        if (caso.evidencia_url && caso._id) {
          this.cargarImagenEvidencia(caso._id);
        }
        // Cargar imagen de solución con autenticación si existe
        if (caso.solucion_imagen_url && caso._id) {
          this.cargarImagenSolucion(caso._id);
        }
      }
    });
  }

  /**
   * Carga la imagen de solución con autenticación JWT
   */
  private cargarImagenSolucion(escalamientoId: string): void {
    console.log('🖼️ Cargando imagen de solución para escalamiento:', escalamientoId);

    this.mesaAyudaService.obtenerImagenResolucion(escalamientoId).subscribe({
      next: (blob) => {
        console.log('✅ Imagen de solución cargada exitosamente, tamaño:', blob.size, 'bytes');

        // Crear URL del blob
        const blobUrl = window.URL.createObjectURL(blob);
        console.log('📌 Blob URL de solución creada:', blobUrl);

        // Actualizar el contenedor con la imagen
        const container = document.getElementById('solucionContainer');
        if (container) {
          container.innerHTML = `
            <img src="${blobUrl}"
                 alt="Imagen de solución"
                 class="img-fluid"
                 style="max-height: 500px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          `;
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar imagen de solución:', error);

        const container = document.getElementById('solucionContainer');
        if (container) {
          let mensajeError = 'No se pudo cargar la imagen de solución';

          if (error.status === 401) {
            mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
          } else if (error.status === 404) {
            mensajeError = 'La imagen de solución no existe en el servidor.';
          } else if (error.error?.response?.mensaje) {
            mensajeError = error.error.response.mensaje;
          }

          container.innerHTML = `
            <div class="alert alert-danger">
              <h6>❌ Error al cargar la imagen</h6>
              <p>${mensajeError}</p>
              <hr>
              <small class="text-muted">
                <strong>ID del escalamiento:</strong> ${escalamientoId}<br>
                <strong>Status HTTP:</strong> ${error.status || 'N/A'}
              </small>
            </div>
          `;
        }
      }
    });
  }

  /**
   * Carga la imagen de evidencia con autenticación JWT
   */
  private cargarImagenEvidencia(escalamientoId: string): void {
    console.log('🖼️ Cargando imagen para escalamiento:', escalamientoId);

    this.mesaAyudaService.obtenerImagenEvidencia(escalamientoId).subscribe({
      next: (blob) => {
        console.log('✅ Imagen cargada exitosamente, tamaño:', blob.size, 'bytes');

        // Crear URL del blob
        const blobUrl = window.URL.createObjectURL(blob);
        console.log('📌 Blob URL creada:', blobUrl);

        // Actualizar el contenedor con la imagen
        const container = document.getElementById('evidenciaContainer');
        if (container) {
          container.innerHTML = `
            <img src="${blobUrl}"
                 alt="Evidencia del caso"
                 class="img-fluid"
                 style="max-height: 500px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          `;
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar imagen:', error);

        const container = document.getElementById('evidenciaContainer');
        if (container) {
          let mensajeError = 'No se pudo cargar la imagen';

          if (error.status === 401) {
            mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
          } else if (error.status === 404) {
            mensajeError = 'La imagen no existe en el servidor.';
          } else if (error.error?.response?.mensaje) {
            mensajeError = error.error.response.mensaje;
          }

          container.innerHTML = `
            <div class="alert alert-danger">
              <h6>❌ Error al cargar la imagen</h6>
              <p>${mensajeError}</p>
              <hr>
              <small class="text-muted">
                <strong>ID del escalamiento:</strong> ${escalamientoId}<br>
                <strong>Status HTTP:</strong> ${error.status || 'N/A'}
              </small>
            </div>
          `;
        }
      }
    });
  }

  trackById(index: number, item: CasoEscalado): any {
    return item._id || item.codigo || index;
  }

  exportarExcel(): void {
    if (!this.casosFiltrados || this.casosFiltrados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay casos para exportar',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const datosExportar = this.casosFiltrados.map((caso) => ({
      'Código': caso.codigo || '',
      'Usuario': caso.usuario_nombre || 'N/A',
      'Descripción': caso.descripcion || '',
      'Prioridad': caso.prioridad || '',
      'Estado': caso.estado || '',
      'Asignado': caso.gestor_asignado || 'Sin asignar',
      'Fecha Escalamiento': this.formatearFecha(caso.fecha_escalamiento),
      'Fecha Actualización': this.formatearFecha(caso.fecha_actualizacion),
      'Respuesta': caso.respuesta || 'Sin respuesta',
      'Con Evidencia': caso.evidencia_url ? 'Sí' : 'No'
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Seguimientos');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `seguimientos_mesa_ayuda_${fecha}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: 'El archivo se descargó correctamente',
      timer: 2000,
      showConfirmButton: false
    });
  }
}
