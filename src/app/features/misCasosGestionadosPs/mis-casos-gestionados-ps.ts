import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { AuthService } from '../../core/auth.service';
import { PsicologiaGestionService } from '../psicologiaGestion/psicologia-gestion.service';
import { HojaVidaService } from '../gestorHojaVida/hoja-vida.service';

@Component({
  selector: 'app-mis-casos-gestionados-ps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-casos-gestionados-ps.html'
})
export class MisCasosGestionadosPs implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly service = inject(PsicologiaGestionService);
  private readonly hojaVidaService = inject(HojaVidaService);

  isLoading = false;
  casosExistentes: any[] = [];
  casosFiltrados: any[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  Math = Math;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.service.consultarCasosPorUsuarioSic().subscribe({
      next: (resp) => {
        this.isLoading = false;
        if (resp?.error === 0) {
          const data = resp.response?.data ?? resp.response ?? resp.data ?? [];
          const allCasos = Array.isArray(data) ? data : [];
          // Filtrar solo casos CON agenda (con TIPO_REUNION o FECHA_HORA_CITA_PSICOLOGIA) y SIN resultado de psicología cargado
          this.casosExistentes = allCasos.filter(caso =>
            (caso.TIPO_REUNION || caso.FECHA_HORA_CITA_PSICOLOGIA) &&
            (!caso.RUTA_PSICOLOGIA || !caso.RUTA_PSICOLOGIA.ruta)
          );
          this.totalItems = this.casosExistentes.length;
          this.filtrar();
        } else {
          this.casosExistentes = [];
          this.casosFiltrados = [];
          this.totalItems = 0;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.casosExistentes = [];
        this.casosFiltrados = [];
        this.totalItems = 0;
        if (error.status === 401) {
          Swal.fire({ icon: 'warning', title: 'Sesión expirada' });
        }
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.casosFiltrados = [...this.casosExistentes];
    } else {
      this.casosFiltrados = this.casosExistentes.filter(
        (caso) =>
          caso.DOCUMENTO?.toString().toLowerCase().includes(term) ||
          caso.NOMBRE?.toLowerCase().includes(term) ||
          caso.PRIMER_APELLIDO?.toLowerCase().includes(term) ||
          caso.CORREO?.toLowerCase().includes(term) ||
          caso.CIUDAD?.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
  }

  get casosPaginados(): any[] {
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

  getBadgeClass(estado: string): string {
    if (!estado) return 'bg-secondary';
    const e = estado.toString().trim().toLowerCase();
    if (e.includes('gestion')) return 'bg-warning';
    if (e === 'activo') return 'bg-danger';
    if (e.includes('consentimiento recibido')) return 'bg-success';
    if (e.includes('consentimiento enviado')) return 'bg-info';
    return 'bg-secondary';
  }

  getNotificacionBadgeClass(estadoNotif: string): string {
    const e = (estadoNotif || '').toString().trim().toUpperCase();
    if (!e) return 'bg-primary';
    if (e === 'TOMADO POR PSICOLOGIA') return 'bg-success';
    if (e === 'GESTIONANDO NOTIFICACION') return 'bg-warning';
    return 'bg-primary';
  }

  verDetalle(caso: any): void {
    let html = '<div class="container-fluid">';

    // Información Básica
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-primary text-white">';
    html += '<h6 class="mb-0"><i class="fas fa-user me-2"></i>Información Básica</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const basicFields = [
      { label: '🔢 Numero Curso', value: caso.NUMERO_CURSO || caso.PKEYHOJAVIDA || '' },
      { label: '📚 Tipo Curso', value: caso.TIPO_CURSO || caso.PKEYASPIRANT || '' },
      { label: '🆔 Documento', value: caso.DOCUMENTO },
      {
        label: '👤 Nombre Completo',
        value: `${caso.NOMBRE || ''} ${caso.PRIMER_APELLIDO || ''} ${caso.SEGUNDO_APELLIDO || ''}`.trim()
      },
      { label: '🎂 Edad', value: caso.EDAD },
      { label: '⚧ Género', value: caso.GENERO },
      {
        label: '📅 Fecha de Nacimiento',
        value: caso.FECH_NACIMIENTO ? new Date(caso.FECH_NACIMIENTO).toLocaleDateString('es-CO') : 'N/A'
      },
      { label: '🗺️ Departamento Nacimiento', value: caso.DEPARTAMENTO_NACIMIENTO || '' },
      { label: '🏙️ Ciudad Nacimiento', value: caso.CIUDAD_NACIMIENTO || '' },
      { label: '📊 Estado', value: caso.ESTADO }
    ];

    basicFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información de Contacto
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-info text-white">';
    html += '<h6 class="mb-0"><i class="fas fa-address-book me-2"></i>Información de Contacto</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const contactFields = [
      { label: '📧 Correo Electrónico', value: caso.CORREO },
      { label: '📞 Teléfono', value: caso.TELEFONO },
      { label: '📱 Celular', value: caso.CELULAR },
      { label: '🏠 Dirección', value: caso.DIRECCION },
      { label: '🏙️ Ciudad donde reside', value: caso.CIUDAD },
      { label: '🗺️ Departamento donde reside', value: caso.DEPARTAMENTO }
    ];

    contactFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Académica
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-warning text-dark">';
    html += '<h6 class="mb-0"><i class="fas fa-graduation-cap me-2"></i>Información Académica</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const academicFields = [
      { label: '🎓 Código de Inscripción', value: caso.CODIGO_INSCRIPCION },
      { label: '📚 Código Programa Académico', value: caso.CODIPROGACAD },
      { label: '📅 Año Período Académico', value: caso.ANNOPERIACAD },
      { label: '🔢 Número Período Académico', value: caso.NUMEPERIACAD },
      { label: '🏫 Colegio', value: caso.COLEGIO },
      { label: '📝 Fecha de Inscripción', value: caso.FECHA_INSCRIPCION }
    ];

    academicFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Adicional
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-secondary text-white">';
    html += '<h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Información Adicional</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const additionalFields = [
      { label: '🌍 Regional', value: caso.REGIONAL },
      { label: '👥 Grupo Minoritario', value: caso.GRUP_MINO },
      { label: '🏘️ Estrato', value: caso.ESTRATO },
      { label: '📢 Tipo de Medio', value: caso.TIPO_MEDIO },
      { label: '📋 Complementaria 1', value: caso.COMPLEMENTARIA_1 },
      { label: '📋 Complementaria 2', value: caso.COMPLEMENTARIA_2 }
    ];

    additionalFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información de Reunión (si existe)
    if (caso?.TIPO_REUNION || caso?.FECHA_HORA_CITA_PSICOLOGIA) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-success text-white"><h6 class="mb-0"><i class="fas fa-calendar-check me-2"></i>Información de Reunión</h6></div>';
      html += '<div class="card-body"><div class="row">';
      if (caso?.TIPO_REUNION) {
        html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;"><strong class="text-muted">Tipo:</strong><br><span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${caso.TIPO_REUNION}</span></div>`;
      }
      if (caso?.FECHA_HORA_CITA_PSICOLOGIA) {
        html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;"><strong class="text-muted">Fecha:</strong><br><span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${caso.FECHA_HORA_CITA_PSICOLOGIA}</span></div>`;
      }
      if (caso?.DETALLE_REUNION) {
        html += `<div class="col-12 mb-2 p-2" style="border-radius: 5px;"><strong class="text-muted">Detalle:</strong><br><span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${caso.DETALLE_REUNION}</span></div>`;
      }
      html += '</div></div></div>';
    }

    // Sección de PDF Historial Clínico (Exámenes)
    if (caso.PDF_URL && caso.PDF_URL !== null && caso.PDF_URL.trim() !== '') {
      html += '<div class="card mb-3 shadow">';
      html += '<div class="card-header bg-info text-white">';
      html += '<h6 class="mb-0">📄 Exámenes</h6>';
      html += '</div>';
      html += '<div class="card-body text-center">';
      html += `<p class="mt-2 mb-3"><strong>Archivo PDF disponible</strong></p>`;
      html += `<button type="button" class="btn btn-primary" id="verPdfExamenesBtn">Ver Exámenes</button>`;
      html += '</div></div>';
    }

    // Sección de Biometría
    if (caso.RUTA_BIOMETRIA && caso.RUTA_BIOMETRIA.ruta !== null && caso.RUTA_BIOMETRIA.ruta !== undefined) {
      html += '<div class="card mb-3 shadow">';
      html += '<div class="card-header bg-warning text-dark">';
      html += '<h6 class="mb-0">👤 Biometría</h6>';
      html += '</div>';
      html += '<div class="card-body text-center">';
      html += `<p class="mt-2 mb-3"><strong>Biometría cargada</strong></p>`;
      html += `<button type="button" class="btn btn-warning" id="verPdfBiometriaBtn">Ver Biometría</button>`;
      html += '</div></div>';
    }

    // Información de Consentimiento (si existe)
    if (this.tieneConsentimiento(caso)) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-danger text-white"><h6 class="mb-0"><i class="fas fa-file-pdf me-2"></i>Consentimiento</h6></div>';
      html += '<div class="card-body text-center">';
      html += `<p class="mb-3"><strong>Estado:</strong> <span class="badge bg-success">Consentimiento Recibido</span></p>`;
      html += `<button type="button" class="btn btn-danger text-white" id="btnVerConsentimiento"><i class="fas fa-eye me-2"></i>Ver Consentimiento</button>`;
      html += '</div></div></div>';
    }

    // Sección de Resultados Entrevista Psicología
    const tienePsicologia = caso.RUTA_PSICOLOGIA &&
      ((typeof caso.RUTA_PSICOLOGIA === 'string' && caso.RUTA_PSICOLOGIA.trim() !== '') ||
       (typeof caso.RUTA_PSICOLOGIA === 'object' && caso.RUTA_PSICOLOGIA.ruta !== null && caso.RUTA_PSICOLOGIA.ruta !== undefined));

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

    html += '</div>';

    Swal.fire({
      title: `Caso - ${caso?.NOMBRE ?? ''} ${caso?.PRIMER_APELLIDO ?? ''}`,
      html,
      icon: 'info',
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar',
      didOpen: () => {
        if (caso.PDF_URL) {
          const verPdfExamenesBtn = document.getElementById('verPdfExamenesBtn');
          if (verPdfExamenesBtn) {
            verPdfExamenesBtn.onclick = () => this.verPDFExamenes(caso.PDF_URL!);
          }
        }
        if (caso.RUTA_BIOMETRIA && caso.RUTA_BIOMETRIA.ruta) {
          const verPdfBiometriaBtn = document.getElementById('verPdfBiometriaBtn');
          if (verPdfBiometriaBtn) {
            verPdfBiometriaBtn.onclick = () => this.verPDFBiometria(caso);
          }
        }
        const btnVerConsentimiento = document.getElementById('btnVerConsentimiento');
        if (btnVerConsentimiento) {
          btnVerConsentimiento.addEventListener('click', () => {
            Swal.close();
            this.verConsentimiento(caso);
          });
        }
        if (caso.RUTA_PSICOLOGIA) {
          const verPdfPsicologiaBtn = document.getElementById('verPdfPsicologiaBtn');
          if (verPdfPsicologiaBtn) {
            verPdfPsicologiaBtn.onclick = () => this.verPDFPsicologia(caso);
          }
        }
      }
    });
  }

  enviarNotificacion(caso: any): void {
    const casoId = this.getCasoId(caso);
    if (!casoId) {
      Swal.fire({ icon: 'error', title: 'ID de caso no encontrado' });
      return;
    }

    Swal.fire({
      title: 'Enviando notificación...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.service.gestionarEstadoNotificacion(casoId).subscribe({
      next: (resp) => {
        Swal.close();
        const ok = resp?.error === 0 || resp?.success === true;
        const mensaje = resp?.response?.mensaje || resp?.mensaje || 'Notificación gestionada correctamente.';
        if (ok) {
          Swal.fire({ icon: 'success', title: 'Éxito', text: mensaje });
          this.cargarDatos();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
        }
      },
      error: () => {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error al gestionar la notificación' });
      }
    });
  }

  reagendarCita(caso: any): void {
    const nombre = `${caso?.NOMBRE ?? ''} ${caso?.PRIMER_APELLIDO ?? ''} ${caso?.SEGUNDO_APELLIDO ?? ''}`.trim();
    const html = `
      <div class="container-fluid">
        <form id="agendamientoForm">
          <div class="mb-3">
            <label for="fechaHora" class="form-label text-start d-block">Fecha y Hora</label>
            <input type="datetime-local" id="fechaHora" class="form-control" required />
          </div>
          <div class="mb-3">
            <label for="modoSelect" class="form-label text-start d-block">Modalidad</label>
            <select id="modoSelect" class="form-select" required>
              <option value="">Seleccione</option>
              <option value="virtual">Virtual</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>
          <div class="mb-3" id="campoUrl" style="display:none;">
            <label for="urlReunion" class="form-label text-start d-block">URL de reunión</label>
            <textarea id="urlReunion" class="form-control" rows="2" placeholder="https://meet.google.com/xxxx"></textarea>
          </div>
          <div class="mb-3" id="campoUbicacion" style="display:none;">
            <label for="ubicacion" class="form-label text-start d-block">Ubicación</label>
            <textarea id="ubicacion" class="form-control" rows="2" placeholder="Dirección del lugar"></textarea>
          </div>
        </form>
      </div>
    `;

    Swal.fire({
      title: `Reagendar Cita - ${nombre}`,
      html,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Reagendar Cita',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const popup = Swal.getPopup()!;
        const modoSel = popup.querySelector('#modoSelect') as HTMLSelectElement;
        const campoUrl = popup.querySelector('#campoUrl') as HTMLDivElement;
        const campoUbic = popup.querySelector('#campoUbicacion') as HTMLDivElement;
        const toggle = () => {
          const val = modoSel?.value || '';
          campoUrl.style.display = val === 'virtual' ? '' : 'none';
          campoUbic.style.display = val === 'presencial' ? '' : 'none';
        };
        modoSel.onchange = toggle;
        toggle();
      },
      preConfirm: () => {
        const popup = Swal.getPopup()!;
        const fechaHora = (popup.querySelector('#fechaHora') as HTMLInputElement)?.value || '';
        const urlReunion = (popup.querySelector('#urlReunion') as HTMLTextAreaElement)?.value || '';
        const ubicacion = (popup.querySelector('#ubicacion') as HTMLTextAreaElement)?.value || '';
        const modo = (popup.querySelector('#modoSelect') as HTMLSelectElement)?.value || '';
        const errores: string[] = [];
        if (!fechaHora) errores.push('Fecha y hora es obligatoria');
        if (!modo) errores.push('Modalidad es obligatoria');
        if (modo === 'virtual' && !urlReunion.trim()) errores.push('URL de reunión es obligatoria');
        if (modo === 'presencial' && !ubicacion.trim()) errores.push('Ubicación es obligatoria');
        if (errores.length) {
          Swal.showValidationMessage(errores.join('<br>'));
          return null as any;
        }
        return { fechaHora, urlReunion: urlReunion.trim(), ubicacion: ubicacion.trim(), modalidad: modo };
      }
    }).then((res) => {
      if (!res.isConfirmed || !res.value) return;
      const { fechaHora, urlReunion, ubicacion, modalidad } = res.value as {
        fechaHora: string;
        urlReunion: string;
        ubicacion: string;
        modalidad: 'virtual' | 'presencial';
      };
      const casoId = this.getCasoId(caso);
      if (!casoId) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró el identificador del caso' });
        return;
      }
      const tipoReunion = modalidad === 'virtual' ? 'Virtual' : 'Presencial';
      const detalle = modalidad === 'virtual' ? `URL: ${urlReunion}` : `Ubicación: ${ubicacion}`;

      Swal.showLoading();
      this.service.gestionarReunion(casoId, tipoReunion, fechaHora, detalle).subscribe({
        next: (resp) => {
          Swal.close();
          const ok = resp?.error === 0 || resp?.success === true;
          const mensaje = resp?.response?.mensaje || resp?.mensaje || 'Reunión reagendada correctamente.';
          if (ok) {
            Swal.fire({ icon: 'success', title: 'Éxito', text: mensaje });
            this.cargarDatos();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
          }
        },
        error: (error) => {
          Swal.close();
          if (error?.status === 401) {
            Swal.fire({ icon: 'warning', title: 'Sesión expirada' });
            return;
          }
          Swal.fire({ icon: 'error', title: 'Error', text: 'Error al reagendar la reunión' });
        }
      });
    });
  }

  verPDFExamenes(pdfUrl: string): void {
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
          title: 'Exámenes',
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

  verPDFBiometria(caso: any): void {
    const casoId = caso._id;

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

  verPDFPsicologia(caso: any): void {
    const casoId = caso._id;

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

    this.service.descargarPDFPsicologia(casoId).subscribe({
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

  tieneConsentimiento(caso: any): boolean {
    return caso?.RUTA_NOTIFICACION_RECIBIDA && caso.RUTA_NOTIFICACION_RECIBIDA.trim() !== '';
  }

  getEstadoDocumentos(caso: any): { texto: string; clase: string } {
    const tieneBiometria = caso?.RUTA_BIOMETRIA && caso.RUTA_BIOMETRIA.ruta !== null && caso.RUTA_BIOMETRIA.ruta !== undefined;
    const tieneExamenes = caso?.PDF_URL && caso.PDF_URL !== null && caso.PDF_URL.trim() !== '';

    if (tieneBiometria && tieneExamenes) {
      return { texto: 'Con documentos', clase: 'bg-primary' };
    } else if (tieneBiometria || tieneExamenes) {
      return { texto: 'Incompleto', clase: 'bg-success' };
    } else {
      return { texto: 'Sin documentos', clase: 'bg-danger' };
    }
  }

  verConsentimiento(caso: any): void {
    if (!this.tieneConsentimiento(caso)) {
      Swal.fire({ icon: 'warning', title: 'Sin consentimiento', text: 'Este caso no tiene consentimiento cargado' });
      return;
    }

    const filename = caso.RUTA_NOTIFICACION_RECIBIDA;
    if (!filename) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró el archivo de consentimiento' });
      return;
    }

    Swal.fire({
      title: 'Cargando consentimiento...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.service.descargarConsentimiento(filename).subscribe({
      next: (pdfBlob: Blob) => {
        Swal.close();

        // Crear URL del blob
        const blobUrl = URL.createObjectURL(pdfBlob);

        // Mostrar el PDF en un modal de SweetAlert2
        const html = `
          <div class="pdf-viewer-modal" style="width: 100%; height: 700px;">
            <embed src="${blobUrl}" type="application/pdf" style="width: 100%; height: 100%; border: none;">
          </div>
        `;

        Swal.fire({
          title: 'Consentimiento',
          html,
          width: '95%',
          heightAuto: false,
          showCloseButton: true,
          showConfirmButton: false,
          customClass: {
            container: 'pdf-viewer-container',
            htmlContainer: 'pdf-viewer-html-container'
          },
          didClose: () => {
            // Limpiar el blob URL cuando se cierre el modal
            if (blobUrl) {
              URL.revokeObjectURL(blobUrl);
            }
          }
        });
      },
      error: (error) => {
        Swal.close();
        let errorMessage = 'Error al cargar el consentimiento. Por favor, intente nuevamente.';
        if (error.status === 404) {
          errorMessage = 'El archivo de consentimiento no fue encontrado en el servidor.';
        } else if (error.status === 500) {
          errorMessage = 'Error en el servidor. Por favor, contacte al administrador.';
        }
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage
        });
      }
    });
  }

  cargarResultadoEntrevista(caso: any): void {
    const nombre = `${caso?.NOMBRE ?? ''} ${caso?.PRIMER_APELLIDO ?? ''} ${caso?.SEGUNDO_APELLIDO ?? ''}`.trim();

    Swal.fire({
      title: 'Cargar Resultado de Entrevista',
      html: `
        <div class="text-start mb-3">
          <p><strong>Paciente:</strong> ${nombre}</p>
          <p><strong>Documento:</strong> ${caso?.DOCUMENTO ?? 'N/A'}</p>
        </div>
        <div class="mb-3">
          <label for="pdfFile" class="form-label">Seleccionar archivo PDF:</label>
          <input type="file" id="pdfFile" class="form-control" accept=".pdf">
        </div>
        <div id="pdfPreview" class="mt-3" style="display: none;">
          <h6>Vista previa:</h6>
          <embed id="pdfEmbed" type="application/pdf" width="100%" height="300px">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Resultado',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      width: '600px',
      didOpen: () => {
        const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
        const pdfPreview = document.getElementById('pdfPreview') as HTMLDivElement;
        const pdfEmbed = document.getElementById('pdfEmbed') as HTMLEmbedElement;

        fileInput?.addEventListener('change', (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file && file.type === 'application/pdf') {
            const fileURL = URL.createObjectURL(file);
            pdfEmbed.src = fileURL;
            pdfPreview.style.display = 'block';
          } else if (file) {
            Swal.showValidationMessage('Por favor seleccione un archivo PDF válido');
            pdfPreview.style.display = 'none';
          }
        });
      },
      preConfirm: () => {
        const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
        const file = fileInput?.files?.[0];

        if (!file) {
          Swal.showValidationMessage('Por favor seleccione un archivo PDF');
          return false;
        }

        if (file.type !== 'application/pdf') {
          Swal.showValidationMessage('El archivo debe ser un PDF');
          return false;
        }

        if (file.size > 40 * 1024 * 1024) {
          Swal.showValidationMessage('El archivo no debe superar los 40MB');
          return false;
        }

        return file;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const pdfFile = result.value as File;
        const casoId = this.getCasoId(caso);

        if (!casoId) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró el identificador del caso'
          });
          return;
        }

        Swal.fire({
          title: 'Subiendo archivo...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.service.uploadPsicologiaPDF(casoId, pdfFile).subscribe({
          next: (resp) => {
            Swal.close();
            if (resp?.error === 0) {
              const mensaje = resp?.response?.mensaje || 'PDF de psicología cargado exitosamente';
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: mensaje
              }).then(() => {
                this.cargarDatos();
              });
            } else {
              const mensaje = resp?.response?.mensaje || 'Error al cargar el PDF';
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: mensaje
              });
            }
          },
          error: (error) => {
            Swal.close();
            const mensaje = error?.error?.response?.mensaje || 'Error al cargar el PDF de psicología';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: mensaje
            });
          }
        });
      }
    });
  }

  trackById(index: number, item: any): any {
    return item?.ID_CASO || item?.ID_HOJA_VIDA || item?.ID || item?._id || index;
  }

  exportarExcel(): void {
    if (!this.casosFiltrados || this.casosFiltrados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay datos para exportar'
      });
      return;
    }

    const datosExportar = this.casosFiltrados.map((caso) => ({
      'Numero Curso': caso.NUMERO_CURSO || caso.PKEYHOJAVIDA || '',
      'Tipo Curso': caso.TIPO_CURSO || caso.PKEYASPIRANT || '',
      'Documento': caso.DOCUMENTO || '',
      'Nombre': `${caso.NOMBRE || ''} ${caso.PRIMER_APELLIDO || ''} ${caso.SEGUNDO_APELLIDO || ''}`.trim(),
      'Edad': caso.EDAD || '',
      'Género': caso.GENERO || '',
      'Departamento Nacimiento': caso.DEPARTAMENTO_NACIMIENTO || '',
      'Ciudad Nacimiento': caso.CIUDAD_NACIMIENTO || '',
      'Correo': caso.CORREO || '',
      'Teléfono': caso.TELEFONO || '',
      'Celular': caso.CELULAR || '',
      'Ciudad donde reside': caso.CIUDAD || '',
      'Departamento donde reside': caso.DEPARTAMENTO || '',
      'Estado': caso.ESTADO || '',
      'Estado Notificación': caso.ESTADO_NOTIFICACION || '',
      'Tipo Reunión': caso.TIPO_REUNION || '',
      'Fecha Cita': caso.FECHA_HORA_CITA_PSICOLOGIA || ''
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mis Casos Gestionados');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `mis_casos_gestionados_${fecha}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: 'El archivo se descargó correctamente',
      timer: 2000,
      showConfirmButton: false
    });
  }

  private getCasoId(caso: any): string | null {
    const candidates = [caso?.ID_CASO, caso?.ID_HOJA_VIDA, caso?.ID_HOJA, caso?.ID, caso?._id, caso?.id];
    const found = candidates.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
    return found ? String(found) : null;
  }
}
