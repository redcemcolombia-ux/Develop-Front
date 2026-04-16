import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { AuthService } from '../../core/auth.service';
import { PsicologiaGestionService } from '../psicologiaGestion/psicologia-gestion.service';

@Component({
  selector: 'app-mis-casos-tomados-ps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-casos-tomados-ps.html'
})
export class MisCasosTomadosPs implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly service = inject(PsicologiaGestionService);

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
          // Filtrar solo casos SIN agenda (sin TIPO_REUNION)
          this.casosExistentes = allCasos.filter(caso => !caso.TIPO_REUNION);
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
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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
      { label: '🏙️ Ciudad', value: caso.CIUDAD },
      { label: '🗺️ Departamento', value: caso.DEPARTAMENTO }
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

    html += '</div>';

    Swal.fire({
      title: `Caso - ${caso?.NOMBRE ?? ''} ${caso?.PRIMER_APELLIDO ?? ''}`,
      html,
      icon: 'info',
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar'
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

  agendarCita(caso: any): void {
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
      title: `Agendar Cita - ${nombre}`,
      html,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Agendar Cita',
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
          const mensaje = resp?.response?.mensaje || resp?.mensaje || 'Reunión gestionada correctamente.';
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
          Swal.fire({ icon: 'error', title: 'Error', text: 'Error al gestionar la reunión' });
        }
      });
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
      Documento: caso.DOCUMENTO || '',
      Nombre: `${caso.NOMBRE || ''} ${caso.PRIMER_APELLIDO || ''} ${caso.SEGUNDO_APELLIDO || ''}`.trim(),
      Correo: caso.CORREO || '',
      Teléfono: caso.TELEFONO || '',
      Ciudad: caso.CIUDAD || '',
      Estado: caso.ESTADO || '',
      'Estado Notificación': caso.ESTADO_NOTIFICACION || '',
      'Tipo Reunión': caso.TIPO_REUNION || '',
      'Fecha Cita': caso.FECHA_HORA_CITA_PSICOLOGIA || ''
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mis Casos Tomados');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `mis_casos_tomados_${fecha}.xlsx`);

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
