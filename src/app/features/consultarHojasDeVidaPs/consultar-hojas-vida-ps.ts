import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { AuthService } from '../../core/auth.service';
import { PsicologiaGestionService } from '../psicologiaGestion/psicologia-gestion.service';

@Component({
  selector: 'app-consultar-hojas-vida-ps',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  templateUrl: './consultar-hojas-vida-ps.html'
})
export class ConsultarHojasVidaPs implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly service = inject(PsicologiaGestionService);

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
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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

    html += '</div>';

    Swal.fire({
      title: `Hoja de Vida - ${hoja?.NOMBRE ?? ''} ${hoja?.PRIMER_APELLIDO ?? ''}`,
      html,
      icon: 'info',
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar'
    });
  }

  verPDF(filename: string): void {
    Swal.fire({
      title: 'Cargando PDF...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.service.obtenerPDF(filename).subscribe({
      next: (pdfBlob: Blob) => {
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        Swal.close();

        const html = `
          <div style="width: 100%; height: 80vh;">
            <iframe src="${pdfBlobUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
          </div>
        `;
        Swal.fire({
          title: 'Visualizador de PDF',
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
        Swal.fire({ title: 'Error', text: 'No se pudo cargar el PDF', icon: 'error' });
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
