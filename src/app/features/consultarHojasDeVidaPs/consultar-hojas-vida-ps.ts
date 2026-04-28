import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { AuthService } from '../../core/auth.service';
import { PsicologiaGestionService } from '../psicologiaGestion/psicologia-gestion.service';
import { HojaVidaService } from '../gestorHojaVida/hoja-vida.service';

@Component({
  selector: 'app-consultar-hojas-vida-ps',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  templateUrl: './consultar-hojas-vida-ps.html'
})
export class ConsultarHojasVidaPs implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly service = inject(PsicologiaGestionService);
  private readonly hojaVidaService = inject(HojaVidaService);

  isLoading = false;
  hojasVidaExistentes: any[] = [];
  hojasVidaFiltradas: any[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  Math = Math;

  user: any = null;
  isSupervisorPsico = false;
  isPsicologo = false;

  ngOnInit(): void {
    this.user = this.authService.getUser();
    const perfil = (this.user?.perfil || '').toLowerCase();
    this.isSupervisorPsico =
      perfil === 'supervisor_psicologia' ||
      perfil === 'psicólogo-supervisor' ||
      perfil === 'psicologo-supervisor' ||
      perfil === 'administrador';
    this.isPsicologo =
      perfil === 'psicologo' ||
      perfil === 'psicólogo' ||
      perfil === 'supervisor_psicologia' ||
      perfil === 'psicólogo-supervisor' ||
      perfil === 'psicologo-supervisor' ||
      perfil === 'administrador';

    if (this.isSupervisorPsico || this.isPsicologo) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.service.consultarHojasVida().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.error === 0) {
          this.hojasVidaExistentes = response.response?.data || [];
          this.totalItems = this.hojasVidaExistentes.length;
          this.filtrar();
        } else {
          this.hojasVidaExistentes = [];
          this.hojasVidaFiltradas = [];
          this.totalItems = 0;
        }
      },
      error: () => {
        this.isLoading = false;
        this.hojasVidaExistentes = [];
        this.hojasVidaFiltradas = [];
        this.totalItems = 0;
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.hojasVidaFiltradas = [...this.hojasVidaExistentes];
    } else {
      this.hojasVidaFiltradas = this.hojasVidaExistentes.filter(
        (hoja) =>
          hoja.DOCUMENTO?.toString().toLowerCase().includes(term) ||
          hoja.NOMBRE?.toLowerCase().includes(term) ||
          hoja.PRIMER_APELLIDO?.toLowerCase().includes(term) ||
          hoja.CORREO?.toLowerCase().includes(term) ||
          hoja.CIUDAD?.toLowerCase().includes(term)
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
    const e = estado
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace('concentimiento', 'consentimiento');

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

  verDetalle(hoja: any): void {
    let html = '<div class="container-fluid">';

    // Información Básica
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-primary text-white">';
    html += '<h6 class="mb-0"><i class="fas fa-user me-2"></i>Información Básica</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const basicFields = [
      { label: '🔢 Numero Curso', value: hoja.NUMERO_CURSO || hoja.PKEYHOJAVIDA || '' },
      { label: '📚 Tipo Curso', value: hoja.TIPO_CURSO || hoja.PKEYASPIRANT || '' },
      { label: '🆔 Documento', value: hoja.DOCUMENTO },
      {
        label: '👤 Nombre Completo',
        value: `${hoja.NOMBRE || ''} ${hoja.PRIMER_APELLIDO || ''} ${hoja.SEGUNDO_APELLIDO || ''}`.trim()
      },
      { label: '🎂 Edad', value: hoja.EDAD },
      { label: '⚧ Género', value: hoja.GENERO },
      {
        label: '📅 Fecha de Nacimiento',
        value: hoja.FECH_NACIMIENTO ? new Date(hoja.FECH_NACIMIENTO).toLocaleDateString('es-CO') : 'N/A'
      },
      { label: '🗺️ Departamento Nacimiento', value: hoja.DEPARTAMENTO_NACIMIENTO || '' },
      { label: '🏙️ Ciudad Nacimiento', value: hoja.CIUDAD_NACIMIENTO || '' },
      { label: '📊 Estado', value: hoja.ESTADO }
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
      { label: '📧 Correo Electrónico', value: hoja.CORREO },
      { label: '📞 Teléfono', value: hoja.TELEFONO },
      { label: '📱 Celular', value: hoja.CELULAR },
      { label: '🏠 Dirección', value: hoja.DIRECCION },
      { label: '🏙️ Ciudad donde reside', value: hoja.CIUDAD },
      { label: '🗺️ Departamento donde reside', value: hoja.DEPARTAMENTO }
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
      { label: '🎓 Código de Inscripción', value: hoja.CODIGO_INSCRIPCION },
      { label: '📚 Código Programa Académico', value: hoja.CODIPROGACAD },
      { label: '📅 Año Período Académico', value: hoja.ANNOPERIACAD },
      { label: '🔢 Número Período Académico', value: hoja.NUMEPERIACAD },
      { label: '🏫 Colegio', value: hoja.COLEGIO },
      { label: '📝 Fecha de Inscripción', value: hoja.FECHA_INSCRIPCION }
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
      { label: '🌍 Regional', value: hoja.REGIONAL },
      { label: '👥 Grupo Minoritario', value: hoja.GRUP_MINO },
      { label: '🏘️ Estrato', value: hoja.ESTRATO },
      { label: '📢 Tipo de Medio', value: hoja.TIPO_MEDIO },
      { label: '📋 Complementaria 1', value: hoja.COMPLEMENTARIA_1 },
      { label: '📋 Complementaria 2', value: hoja.COMPLEMENTARIA_2 }
    ];

    additionalFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Sección de PDF Historial Clínico (Exámenes)
    if (hoja.PDF_URL && hoja.PDF_URL !== null && hoja.PDF_URL.trim() !== '') {
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

    // Sección de Consentimiento
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

    // Sección de Resultados Entrevista Psicología
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

    html += '</div>';

    Swal.fire({
      title: `Hoja de Vida - ${hoja?.NOMBRE ?? ''} ${hoja?.PRIMER_APELLIDO ?? ''}`,
      html,
      icon: 'info',
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar',
      didOpen: () => {
        if (hoja.PDF_URL) {
          const verPdfExamenesBtn = document.getElementById('verPdfExamenesBtn');
          if (verPdfExamenesBtn) {
            verPdfExamenesBtn.onclick = () => this.verPDFExamenes(hoja.PDF_URL!);
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

    // Extraer solo el nombre del archivo si viene con ruta
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

    this.service.obtenerPDFNotificacionAuth(filename).subscribe({
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
        } else if (error.status === 500) {
          errorMessage = 'Error en el servidor. Por favor, contacte al administrador.';
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

  enviarNotificacion(hoja: any): void {
    const casoId = this.getCasoId(hoja);
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
      error: (error) => {
        Swal.close();
        if (error?.status === 401) {
          Swal.fire({ icon: 'warning', title: 'Sesión expirada' });
          return;
        }
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error al gestionar la notificación' });
      }
    });
  }

  tomarCaso(hoja: any): void {
    const casoId = this.getCasoId(hoja);
    if (!casoId) {
      Swal.fire({ icon: 'error', title: 'ID de caso no encontrado' });
      return;
    }

    Swal.fire({
      title: '¿Tomar este caso?',
      html: `<p><strong>Documento:</strong> ${hoja?.DOCUMENTO ?? 'N/A'}</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, tomar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: 'Asignando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.service.asignarPsicologo(casoId).subscribe({
        next: (resp) => {
          Swal.close();
          if (resp?.error === 0) {
            Swal.fire({
              icon: 'success',
              title: 'Caso asignado',
              text: resp?.response?.mensaje ?? 'El caso fue tomado correctamente.'
            });
            this.cargarDatos();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: resp?.response?.mensaje || 'No se pudo asignar el caso.'
            });
          }
        },
        error: (error) => {
          Swal.close();
          if (error?.status === 401) {
            Swal.fire({ icon: 'warning', title: 'Sesión expirada' });
            return;
          }
          Swal.fire({ icon: 'error', title: 'Error', text: 'Error en la asignación' });
        }
      });
    });
  }

  trackById(index: number, item: any): any {
    return item?.ID_CASO || item?.ID_HOJA_VIDA || item?.ID || item?._id || index;
  }

  exportarExcel(): void {
    if (!this.hojasVidaFiltradas || this.hojasVidaFiltradas.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay datos para exportar'
      });
      return;
    }

    const datosExportar = this.hojasVidaFiltradas.map((hoja) => ({
      'Numero Curso': hoja.NUMERO_CURSO || hoja.PKEYHOJAVIDA || '',
      'Tipo Curso': hoja.TIPO_CURSO || hoja.PKEYASPIRANT || '',
      'Documento': hoja.DOCUMENTO || '',
      'Nombre': `${hoja.NOMBRE || ''} ${hoja.PRIMER_APELLIDO || ''} ${hoja.SEGUNDO_APELLIDO || ''}`.trim(),
      'Edad': hoja.EDAD || '',
      'Género': hoja.GENERO || '',
      'Departamento Nacimiento': hoja.DEPARTAMENTO_NACIMIENTO || '',
      'Ciudad Nacimiento': hoja.CIUDAD_NACIMIENTO || '',
      'Teléfono': hoja.TELEFONO || '',
      'Celular': hoja.CELULAR || '',
      'Ciudad donde reside': hoja.CIUDAD || '',
      'Departamento donde reside': hoja.DEPARTAMENTO || '',
      'Correo': hoja.CORREO || '',
      'Estado': hoja.ESTADO || '',
      'Estado Notificación': hoja.ESTADO_NOTIFICACION || ''
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hojas de Vida');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `hojas_vida_psicologia_${fecha}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: 'El archivo se descargó correctamente',
      timer: 2000,
      showConfirmButton: false
    });
  }

  private getCasoId(hoja: any): string | null {
    const candidates = [
      hoja?.ID_CASO,
      hoja?.ID_HOJA_VIDA,
      hoja?.ID_HOJA,
      hoja?.ID,
      hoja?._id,
      hoja?.id
    ];
    const found = candidates.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
    return found ? String(found) : null;
  }
}
