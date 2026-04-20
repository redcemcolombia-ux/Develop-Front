import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { HojaVidaService } from '../hoja-vida.service';
import { AuthService } from '../../../core/auth.service';
import { PsicologiaGestionService } from '../../psicologiaGestion/psicologia-gestion.service';

@Component({
  selector: 'app-casos-aplazados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './casos-aplazados.html',
  styles: [`
    .platform-card__header.casos-aplazados__header {
      background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
      color: #fff;
    }

    .casos-aplazados__export-button {
      background-color: #198754;
      border-color: #198754;
      color: #fff;
    }

    .casos-aplazados__export-button:hover,
    .casos-aplazados__export-button:focus {
      background-color: #157347;
      border-color: #146c43;
      color: #fff;
    }
  `]
})
export class CasosAplazados implements OnInit {
  private readonly hojaVidaService = inject(HojaVidaService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly psicologiaService = inject(PsicologiaGestionService);

  hojasVidaExistentes: any[] = [];
  hojasVidaFiltradas: any[] = [];
  isLoadingConsulta = false;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  canViewPDFs = true;

  ngOnInit(): void {
    this.checkPDFPermissions();
    this.consultarHojasVida();
  }

  private checkPDFPermissions(): void {
    const userInfo = this.authService.getUserInfo();
    if (userInfo && userInfo.perfil) {
      const perfil = userInfo.perfil.toLowerCase();
      this.canViewPDFs = perfil !== 'cliente';
    }
  }

  consultarHojasVida(): void {
    this.isLoadingConsulta = true;
    this.cdr.detectChanges();

    this.hojaVidaService.consultarHojasVida().subscribe({
      next: (response) => {
        if (response.error === 0 || response.error === '0') {
          const todasLasHojas = response.response?.data || response.data || response.response || [];

          // Filtrar solo casos aplazados
          this.hojasVidaExistentes = todasLasHojas.filter((hoja: any) => {
            return this.esCasoAplazado(hoja);
          });

          this.totalItems = this.hojasVidaExistentes.length;
          this.filtrarHojasVida();

          this.isLoadingConsulta = false;
          this.cdr.detectChanges();

          if (this.hojasVidaExistentes.length === 0) {
            Swal.fire({
              icon: 'info',
              title: 'Sin datos',
              text: 'No se encontraron casos aplazados'
            });
          }
        } else {
          this.isLoadingConsulta = false;
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.response?.mensaje || response.mensaje || 'Error al consultar las hojas de vida'
          });
        }
      },
      error: (error) => {
        this.isLoadingConsulta = false;
        this.cdr.detectChanges();

        if (error.status === 401) {
          Swal.fire({
            icon: 'warning',
            title: 'Sesión Expirada',
            text: 'Tu sesión ha expirado. Serás redirigido al login.',
            timer: 3000,
            showConfirmButton: false
          });
          this.authService.logout();
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al consultar las hojas de vida: ' + (error.error?.message || error.message)
        });
      }
    });
  }

  private esCasoAplazado(hoja: any): boolean {
    // Verificar que tenga los 3 PDFs
    let pdfsCount = 0;

    if (hoja.PDF_URL && hoja.PDF_URL !== null && hoja.PDF_URL.trim() !== '') {
      pdfsCount++;
    }

    if (hoja.RUTA_BIOMETRIA && hoja.RUTA_BIOMETRIA.ruta !== null && hoja.RUTA_BIOMETRIA.ruta !== undefined) {
      pdfsCount++;
    }

    if (hoja.RUTA_PSICOLOGIA && typeof hoja.RUTA_PSICOLOGIA === 'string' && hoja.RUTA_PSICOLOGIA.trim() !== '') {
      pdfsCount++;
    } else if (hoja.RUTA_PSICOLOGIA && typeof hoja.RUTA_PSICOLOGIA === 'object' && hoja.RUTA_PSICOLOGIA.ruta !== null && hoja.RUTA_PSICOLOGIA.ruta !== undefined) {
      pdfsCount++;
    }

    // Debe tener los 3 PDFs y ESTADO_CIERRE debe ser "Aplazado"
    return pdfsCount === 3 &&
           hoja.ESTADO_CIERRE &&
           hoja.ESTADO_CIERRE === 'Aplazado';
  }

  filtrarHojasVida(): void {
    if (!this.searchTerm.trim()) {
      this.hojasVidaFiltradas = [...this.hojasVidaExistentes];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.hojasVidaFiltradas = this.hojasVidaExistentes.filter(hoja =>
        hoja.DOCUMENTO?.toString().toLowerCase().includes(term) ||
        hoja.NOMBRE?.toLowerCase().includes(term) ||
        hoja.PRIMER_APELLIDO?.toLowerCase().includes(term) ||
        hoja.CORREO?.toLowerCase().includes(term) ||
        hoja.CIUDAD?.toLowerCase().includes(term) ||
        this.getIpsNombre(hoja).toLowerCase().includes(term) ||
        hoja.NOTAS_CIERRE?.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
  }

  get hojasVidaPaginadas(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.hojasVidaFiltradas.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.hojasVidaFiltradas.length / this.itemsPerPage);
  }

  cambiarPagina(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get paginasArray(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES');
    } catch {
      return fecha;
    }
  }

  getBadgeClass(estado: string): string {
    if (!estado) return 'bg-secondary';

    const estadoNormalizado = estado.toString().trim();

    switch (estadoNormalizado) {
      case 'Aplazado':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  }

  getIpsNombre(hoja: any): string {
    const nombre = hoja?.IPS?.NOMBRE_IPS || hoja?.IPS_ID?.NOMBRE_IPS || '';
    return nombre && nombre.trim().length > 0 ? nombre : 'SIN IPS';
  }

  capitalize(texto: string): string {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  }

  verDetalleHoja(hoja: any): void {
    let html = '<div class="text-start" style="font-family: Arial, sans-serif;">';

    // Header con estado de cierre
    html += `<div class="d-flex align-items-center mb-3">`;
    html += `<h5 class="mb-0 me-3">Detalle de Caso Aplazado</h5>`;
    const statusBadge = this.getBadgeClass(hoja.ESTADO_CIERRE);
    html += `<span class="badge ${statusBadge}"><span class="me-1">●</span>${hoja.ESTADO_CIERRE || 'Sin Estado'}</span>`;
    html += `</div>`;

    // Información de Cierre
    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-warning text-dark"><strong>⏸ Información de Aplazamiento</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    html += `<div class="col-md-6 mb-2 p-2">`;
    html += `<strong class="text-muted">Estado de Cierre:</strong><br>`;
    html += `<span class="badge ${statusBadge}">${hoja.ESTADO_CIERRE || 'N/A'}</span>`;
    html += `</div>`;

    html += `<div class="col-md-6 mb-2 p-2">`;
    html += `<strong class="text-muted">Tipo de Cierre:</strong><br>`;
    html += `<span class="text-dark" style="font-size: 1.1em;">${hoja.TIPO_CIERRE || 'N/A'}</span>`;
    html += `</div>`;

    html += `<div class="col-md-6 mb-2 p-2">`;
    html += `<strong class="text-muted">Fecha de Cierre:</strong><br>`;
    html += `<span class="text-dark" style="font-size: 1.1em;">${this.formatearFecha(hoja.FECHA_CIERRE)}</span>`;
    html += `</div>`;

    if (hoja.NOTAS_CIERRE && hoja.NOTAS_CIERRE !== 'Na') {
      html += `<div class="col-12 mb-2 p-2">`;
      html += `<strong class="text-muted">Notas de Cierre:</strong><br>`;
      html += `<div class="alert alert-warning mt-2" style="font-size: 1em;">${hoja.NOTAS_CIERRE}</div>`;
      html += `</div>`;
    }

    html += '</div></div></div>';

    // Información Personal
    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-primary text-white"><strong>📋 Información Personal</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const personalFields = [
      { key: 'DOCUMENTO', label: '🆔 Documento' },
      { key: 'NOMBRE', label: '👤 Nombre' },
      { key: 'PRIMER_APELLIDO', label: '👤 Primer Apellido' },
      { key: 'SEGUNDO_APELLIDO', label: '👤 Segundo Apellido' },
      { key: 'EDAD', label: '🎂 Edad' },
      { key: 'GENERO', label: '⚧ Género' },
      { key: 'FECH_NACIMIENTO', label: '📅 Fecha de Nacimiento' },
      { key: 'DEPARTAMENTO_NACIMIENTO', label: '🗺️ Departamento Nacimiento' },
      { key: 'CIUDAD_NACIMIENTO', label: '🏙️ Ciudad Nacimiento' }
    ];

    personalFields.forEach(field => {
      const value = hoja[field.key] || 'N/A';
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em;">${value}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información de Contacto
    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-info text-white"><strong>📞 Información de Contacto</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const contactFields = [
      { key: 'CORREO', label: '📧 Correo Electrónico' },
      { key: 'TELEFONO', label: '📞 Teléfono' },
      { key: 'CELULAR', label: '📱 Celular' },
      { key: 'DIRECCION', label: '🏠 Dirección' }
    ];

    contactFields.forEach(field => {
      const value = hoja[field.key] || 'N/A';
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em;">${value}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Académica y Ubicación
    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-success text-white"><strong>🎓 Información Académica y Ubicación</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const academicFields = [
      { key: 'NUMERO_CURSO', label: '🔢 Numero Curso' },
      { key: 'TIPO_CURSO', label: '📚 Tipo Curso' },
      { key: 'CODIPROGACAD', label: '🎓 Programa Académico' },
      { key: 'ANNOPERIACAD', label: '📅 Año Período Académico' },
      { key: 'NUMEPERIACAD', label: '🔢 Número Período Académico' },
      { key: 'CIUDAD', label: '🏙️ Ciudad donde reside' },
      { key: 'DEPARTAMENTO', label: '🗺️ Departamento donde reside' },
      { key: 'REGIONAL', label: '🏢 Regional' },
      { key: 'COLEGIO', label: '🏫 Colegio' }
    ];

    academicFields.forEach(field => {
      const value = hoja[field.key] || 'N/A';
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em;">${value}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Adicional
    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-warning text-dark"><strong>ℹ️ Información Adicional</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const additionalFields = [
      { key: 'CODIGO_INSCRIPCION', label: '🎫 Código de Inscripción' },
      { key: 'FECHA_INSCRIPCION', label: '📅 Fecha de Inscripción' },
      { key: 'ESTRATO', label: '🏘️ Estrato' },
      { key: 'GRUP_MINO', label: '👥 Grupo Minoritario' },
      { key: 'TIPO_MEDIO', label: '📺 Tipo de Medio' },
      { key: 'COMPLEMENTARIA_1', label: '📝 Info Complementaria 1' },
      { key: 'COMPLEMENTARIA_2', label: '📝 Info Complementaria 2' }
    ];

    additionalFields.forEach(field => {
      const value = hoja[field.key] || 'N/A';
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em;">${value}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Médica
    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-danger text-white"><strong>🏥 Información Médica</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const medicalFields = [
      { key: 'EXAMENES', label: '🔬 Exámenes' },
      { key: 'FECHA_HORA', label: '📅 Fecha y Hora' },
      { key: 'NOMBREIPS', label: '🏥 Nombre IPS' }
    ];

    medicalFields.forEach(field => {
      let value = hoja[field.key] || 'N/A';
      if (field.key === 'NOMBREIPS') {
        value = this.getIpsNombre(hoja);
      }
      if (field.key === 'FECHA_HORA' && value !== 'N/A') {
        value = this.formatearFecha(value);
      }
      const textClass = value === 'SIN IPS' ? 'text-danger' : 'text-dark';
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="${textClass}" style="font-size: 1.1em;">${value}</span>`;
      html += `</div>`;
    });

    if (hoja.RECOMENDACIONES) {
      html += `<div class="col-12 mb-2 p-2">`;
      html += `<strong class="text-muted">💊 Recomendaciones:</strong><br>`;
      html += `<div class="alert alert-info mt-2" style="font-size: 1.1em;">${hoja.RECOMENDACIONES}</div>`;
      html += `</div>`;
    }

    html += '</div></div></div>';

    // Información del Sistema
    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-secondary text-white"><strong>🔑 Información del Sistema</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const systemFields = [
      { key: 'createdAt', label: '📅 Fecha de Creación', isDate: true },
      { key: 'updatedAt', label: '📅 Última Actualización', isDate: true },
      { key: 'ESTADO_NOTIFICACION', label: '📣 Estado de Notificación' },
      { key: 'USUARIO_SIC', label: '🔐 Psicólogo' }
    ];

    systemFields.forEach(field => {
      let value = hoja[field.key] || 'N/A';
      if (field.isDate && value !== 'N/A') {
        value = this.formatearFecha(value);
      }
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em;">${value}</span>`;
      html += `</div>`;
    });

    if (hoja.DETALLE) {
      html += `<div class="col-12 mb-2 p-2">`;
      html += `<strong class="text-muted">📋 Detalle de Procesamiento:</strong><br>`;
      html += `<div class="alert alert-secondary mt-2" style="font-size: 0.9em; font-family: monospace;">${hoja.DETALLE}</div>`;
      html += `</div>`;
    }

    html += '</div></div></div>';

    // Secciones de PDFs
    if (this.canViewPDFs) {
      if (hoja.PDF_URL && hoja.PDF_URL !== null && hoja.PDF_URL.trim() !== '') {
        html += '<div class="card mb-3 shadow">';
        html += '<div class="card-header bg-info text-white">';
        html += '<h6 class="mb-0">📄 Examenes</h6>';
        html += '</div>';
        html += '<div class="card-body text-center">';
        html += `<p class="mt-2 mb-3"><strong>Archivo PDF disponible</strong></p>`;
        html += `<button type="button" class="btn btn-primary" id="verPdfBtn">Ver Examenes</button>`;
        html += '</div></div>';
      }

      if (hoja.RUTA_BIOMETRIA && hoja.RUTA_BIOMETRIA.ruta !== null && hoja.RUTA_BIOMETRIA.ruta !== undefined) {
        html += '<div class="card mb-3 shadow">';
        html += '<div class="card-header bg-warning text-dark">';
        html += '<h6 class="mb-0">👤 Biometría</h6>';
        html += '</div>';
        html += '<div class="card-body text-center">';
        html += `<p class="mt-2 mb-3"><strong>Biometría cargada</strong></p>`;
        html += `<button type="button" class="btn btn-warning" id="verPdfBiometriaBtn">Ver Biometría</button>`;
        html += '</div></div>';
      }

      if (hoja.RUTA_NOTIFICACION_RECIBIDA && hoja.RUTA_NOTIFICACION_RECIBIDA.trim() !== '') {
        html += '<div class="card mb-3 shadow">';
        html += '<div class="card-header bg-danger text-white">';
        html += '<h6 class="mb-0">📄 Consentimiento</h6>';
        html += '</div>';
        html += '<div class="card-body text-center">';
        html += `<p class="mt-2 mb-3"><strong>Consentimiento Recibido</strong></p>`;
        html += `<button type="button" class="btn btn-danger text-white" id="verPdfConsentimientoBtn">Ver Consentimiento</button>`;
        html += '</div></div>';
      }

      const tienePsicologia = hoja.RUTA_PSICOLOGIA &&
        ((typeof hoja.RUTA_PSICOLOGIA === 'string' && hoja.RUTA_PSICOLOGIA.trim() !== '') ||
         (typeof hoja.RUTA_PSICOLOGIA === 'object' && hoja.RUTA_PSICOLOGIA.ruta !== null && hoja.RUTA_PSICOLOGIA.ruta !== undefined));

      if (tienePsicologia) {
        html += '<div class="card mb-3 shadow">';
        html += '<div class="card-header bg-success text-white">';
        html += '<h6 class="mb-0">🧠 Resultados Entrevista Psicología</h6>';
        html += '</div>';
        html += '<div class="card-body text-center">';
        html += `<p class="mt-2 mb-3"><strong>Resultado de entrevista cargado</strong></p>`;
        html += `<button type="button" class="btn btn-success" id="verPdfPsicologiaBtn">Ver Resultados</button>`;
        html += '</div></div>';
      }
    }

    html += '</div>';

    Swal.fire({
      title: `${hoja.NOMBRE || ''} ${hoja.PRIMER_APELLIDO || ''} ${hoja.SEGUNDO_APELLIDO || ''}`,
      html: html,
      icon: 'info',
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar',
      didOpen: () => {
        if (this.canViewPDFs) {
          if (hoja.PDF_URL) {
            const verPdfBtn = document.getElementById('verPdfBtn');
            if (verPdfBtn) {
              verPdfBtn.onclick = () => this.verPDF(hoja.PDF_URL!);
            }
          }
          if (hoja.RUTA_BIOMETRIA && hoja.RUTA_BIOMETRIA.ruta) {
            const verPdfBiometriaBtn = document.getElementById('verPdfBiometriaBtn');
            if (verPdfBiometriaBtn) {
              verPdfBiometriaBtn.onclick = () => this.verPDFBiometria(hoja);
            }
          }
          if (hoja.RUTA_NOTIFICACION_RECIBIDA) {
            const verPdfConsentimientoBtn = document.getElementById('verPdfConsentimientoBtn');
            if (verPdfConsentimientoBtn) {
              verPdfConsentimientoBtn.onclick = () => this.verPDFConsentimiento(hoja);
            }
          }
          if (hoja.RUTA_PSICOLOGIA) {
            const verPdfPsicologiaBtn = document.getElementById('verPdfPsicologiaBtn');
            if (verPdfPsicologiaBtn) {
              verPdfPsicologiaBtn.onclick = () => this.verPDFPsicologia(hoja);
            }
          }
        }
      }
    });
  }

  verPDF(pdfUrl: string): void {
    const filename = pdfUrl.split('/').pop();

    if (!filename) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener el nombre del archivo PDF',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    Swal.fire({
      title: 'Cargando PDF...',
      text: 'Por favor espere mientras se carga el documento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.hojaVidaService.obtenerPDF(filename).subscribe({
      next: (pdfBlob: Blob) => {
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        Swal.close();

        const pdfHtml = `
          <div style="width: 100%; height: 80vh;">
            <iframe src="${pdfBlobUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
          </div>
        `;

        Swal.fire({
          title: 'Visualizador de PDF',
          html: pdfHtml,
          width: '95%',
          showCloseButton: true,
          confirmButtonText: 'Cerrar',
          willClose: () => {
            URL.revokeObjectURL(pdfBlobUrl);
          }
        });
      },
      error: () => {
        Swal.fire({
          title: 'Error al cargar PDF',
          text: 'No se pudo cargar el documento PDF. Verifique que el archivo existe.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  verPDFBiometria(hoja: any): void {
    const casoId = hoja._id;

    if (!casoId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo obtener el ID del caso'
      });
      return;
    }

    Swal.fire({
      title: 'Cargando PDF...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.hojaVidaService.descargarBiometria(casoId).subscribe({
      next: (pdfBlob: Blob) => {
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        Swal.close();

        const html = `
          <div style="width: 100%; height: 80vh;">
            <iframe src="${pdfBlobUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
          </div>
        `;
        Swal.fire({
          title: 'Biometría',
          html,
          width: '95%',
          showCloseButton: true,
          confirmButtonText: 'Cerrar',
          willClose: () => {
            try {
              URL.revokeObjectURL(pdfBlobUrl);
            } catch {}
          }
        });
      },
      error: () => {
        Swal.close();
        Swal.fire({ title: 'Error', text: 'No se pudo cargar el PDF de biometría', icon: 'error' });
      }
    });
  }

  verPDFConsentimiento(hoja: any): void {
    let filename = hoja.RUTA_NOTIFICACION_RECIBIDA;

    if (!filename || filename.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el archivo de consentimiento'
      });
      return;
    }

    if (filename.includes('/')) {
      const parts = filename.split('/');
      filename = parts[parts.length - 1];
    }

    Swal.fire({
      title: 'Cargando consentimiento...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.psicologiaService.obtenerPDFNotificacionAuth(filename).subscribe({
      next: (pdfBlob: Blob) => {
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        Swal.close();

        const html = `
          <div style="width: 100%; height: 80vh;">
            <iframe src="${pdfBlobUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
          </div>
        `;
        Swal.fire({
          title: 'Consentimiento',
          html,
          width: '95%',
          showCloseButton: true,
          confirmButtonText: 'Cerrar',
          willClose: () => {
            try {
              URL.revokeObjectURL(pdfBlobUrl);
            } catch {}
          }
        });
      },
      error: (error) => {
        Swal.close();
        let errorMessage = 'No se pudo cargar el PDF del consentimiento';
        if (error.status === 404) {
          errorMessage = 'El archivo de consentimiento no fue encontrado en el servidor.';
        }
        Swal.fire({ title: 'Error', text: errorMessage, icon: 'error' });
      }
    });
  }

  verPDFPsicologia(hoja: any): void {
    const casoId = hoja._id;

    if (!casoId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo obtener el ID del caso'
      });
      return;
    }

    Swal.fire({
      title: 'Cargando PDF...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.psicologiaService.descargarPDFPsicologia(casoId).subscribe({
      next: (pdfBlob: Blob) => {
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        Swal.close();

        const html = `
          <div style="width: 100%; height: 80vh;">
            <iframe src="${pdfBlobUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
          </div>
        `;
        Swal.fire({
          title: 'Resultados Entrevista Psicología',
          html,
          width: '95%',
          showCloseButton: true,
          confirmButtonText: 'Cerrar',
          willClose: () => {
            try {
              URL.revokeObjectURL(pdfBlobUrl);
            } catch {}
          }
        });
      },
      error: () => {
        Swal.close();
        Swal.fire({ title: 'Error', text: 'No se pudo cargar el PDF de psicología', icon: 'error' });
      }
    });
  }

  exportarAExcel(): void {
    if (this.hojasVidaFiltradas.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay datos para exportar'
      });
      return;
    }

    const datosExcel = this.hojasVidaFiltradas.map(hoja => ({
      // Información de Aplazamiento
      'Estado Cierre': hoja.ESTADO_CIERRE || '',
      'Tipo Cierre': hoja.TIPO_CIERRE || '',
      'Notas Cierre': hoja.NOTAS_CIERRE || '',
      'Fecha Cierre': this.formatearFecha(hoja.FECHA_CIERRE || ''),

      // Información Personal
      'Documento': hoja.DOCUMENTO || '',
      'Nombre': this.capitalize(hoja.NOMBRE || ''),
      'Primer Apellido': this.capitalize(hoja.PRIMER_APELLIDO || ''),
      'Segundo Apellido': this.capitalize(hoja.SEGUNDO_APELLIDO || ''),
      'Edad': hoja.EDAD || '',
      'Género': hoja.GENERO || '',
      'Fecha Nacimiento': hoja.FECH_NACIMIENTO || '',
      'Departamento Nacimiento': hoja.DEPARTAMENTO_NACIMIENTO || '',
      'Ciudad Nacimiento': hoja.CIUDAD_NACIMIENTO || '',

      // Información de Contacto
      'Correo': hoja.CORREO?.toLowerCase() || '',
      'Teléfono': hoja.TELEFONO || '',
      'Celular': hoja.CELULAR || '',
      'Dirección': hoja.DIRECCION || '',

      // Información Académica y Ubicación
      'Número Curso': hoja.NUMERO_CURSO || '',
      'Tipo Curso': hoja.TIPO_CURSO || '',
      'Código Programa Académico': hoja.CODIPROGACAD || '',
      'Año Período Académico': hoja.ANNOPERIACAD || '',
      'Número Período Académico': hoja.NUMEPERIACAD || '',
      'Ciudad': this.capitalize(hoja.CIUDAD || ''),
      'Departamento': hoja.DEPARTAMENTO || '',
      'Regional': hoja.REGIONAL || '',
      'Colegio': hoja.COLEGIO || '',

      // Información Adicional
      'Código Inscripción': hoja.CODIGO_INSCRIPCION || '',
      'Fecha Inscripción': hoja.FECHA_INSCRIPCION || '',
      'Estrato': hoja.ESTRATO || '',
      'Grupo Minoritario': hoja.GRUP_MINO || '',
      'Tipo Medio': hoja.TIPO_MEDIO || '',
      'Complementaria 1': hoja.COMPLEMENTARIA_1 || '',
      'Complementaria 2': hoja.COMPLEMENTARIA_2 || '',

      // Información Médica
      'Exámenes': hoja.EXAMENES || '',
      'Fecha y Hora Examen': this.formatearFecha(hoja.FECHA_HORA || ''),
      'IPS': this.getIpsNombre(hoja),
      'Recomendaciones': hoja.RECOMENDACIONES || '',

      // Información del Sistema
      'Fecha Creación': this.formatearFecha(hoja.createdAt || ''),
      'Última Actualización': this.formatearFecha(hoja.updatedAt || ''),
      'Estado Notificación': hoja.ESTADO_NOTIFICACION || '',
      'Psicólogo': hoja.USUARIO_SIC || '',
      'Detalle': hoja.DETALLE || ''
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Casos Aplazados');

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Casos_Aplazados_${fecha}.xlsx`;

    XLSX.writeFile(wb, nombreArchivo);

    Swal.fire({
      icon: 'success',
      title: 'Exportación exitosa',
      text: `Se han exportado ${datosExcel.length} registros`,
      timer: 2000,
      showConfirmButton: false
    });
  }
}
