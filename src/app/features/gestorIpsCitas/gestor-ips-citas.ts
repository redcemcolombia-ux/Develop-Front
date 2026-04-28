import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { AuthService } from '../../core/auth.service';
import { GestorIpsCitasService, HojaVida } from './gestor-ips-citas.service';

@Component({
  selector: 'app-gestor-ips-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './gestor-ips-citas.html'
})
export class GestorIpsCitas implements OnInit {
  private readonly service = inject(GestorIpsCitasService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  hojas: HojaVida[] = [];
  filtradas: HojaVida[] = [];
  isLoading = false;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  Math = Math;

  ngOnInit(): void {
    this.consultar(false);
  }

  consultar(showSuccessMessage = true): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.service.consultarHojasVida().subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          this.hojas = resp.response?.hojas_vida ?? [];
          this.totalItems = resp.response?.total_registros ?? 0;
          this.filtrar();
          this.isLoading = false;
          this.cdr.detectChanges();

          if (showSuccessMessage) {
            Swal.fire({
              title: '¡Éxito!',
              text: resp.response?.mensaje || 'Hojas de vida consultadas',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          }
          return;
        }
        this.isLoading = false;
        this.cdr.detectChanges();

        Swal.fire({
          title: 'Información',
          text: resp.response?.mensaje || 'No se encontraron registros',
          icon: 'info',
          confirmButtonText: 'Entendido'
        });
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();

        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudo conectar con el servidor.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  filtrar(): void {
    if (!this.searchTerm.trim()) {
      this.filtradas = [...this.hojas];
    } else {
      const termino = this.searchTerm.toLowerCase();
      this.filtradas = this.hojas.filter(
        (hoja) =>
          hoja.NOMBRE.toLowerCase().includes(termino) ||
          hoja.PRIMER_APELLIDO.toLowerCase().includes(termino) ||
          hoja.DOCUMENTO.toLowerCase().includes(termino) ||
          hoja.CORREO.toLowerCase().includes(termino) ||
          hoja.CIUDAD.toLowerCase().includes(termino) ||
          hoja.DEPARTAMENTO.toLowerCase().includes(termino) ||
          (hoja.NUMERO_CURSO || hoja.PKEYHOJAVIDA || '').toLowerCase().includes(termino) ||
          (hoja.TIPO_CURSO || hoja.PKEYASPIRANT || '').toLowerCase().includes(termino) ||
          (hoja.DEPARTAMENTO_NACIMIENTO || '').toLowerCase().includes(termino) ||
          (hoja.CIUDAD_NACIMIENTO || '').toLowerCase().includes(termino)
      );
    }
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.filtrar();
  }

  get paginadas(): HojaVida[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filtradas.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filtradas.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
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

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  trackById(_i: number, item: HojaVida): string {
    return item._id;
  }

  verDetalle(hoja: HojaVida): void {
    let html = '<div class="container-fluid">';

    // Información Básica
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-primary text-white">';
    html += '<h6 class="mb-0"><i class="fas fa-user me-2"></i>Información Básica</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const basicFields = [
      { label: '🆔 Documento', value: hoja.DOCUMENTO },
      {
        label: '👤 Nombre Completo',
        value: `${hoja.NOMBRE} ${hoja.PRIMER_APELLIDO} ${hoja.SEGUNDO_APELLIDO}`.trim()
      },
      { label: '🎂 Edad', value: hoja.EDAD },
      { label: '⚧ Género', value: hoja.GENERO },
      {
        label: '📅 Fecha de Nacimiento',
        value: new Date(hoja.FECH_NACIMIENTO).toLocaleDateString('es-CO')
      },
      { label: '📋 Numero Curso', value: hoja.NUMERO_CURSO || hoja.PKEYHOJAVIDA || 'N/A' },
      { label: '📋 Tipo Curso', value: hoja.TIPO_CURSO || hoja.PKEYASPIRANT || 'N/A' },
      { label: '🌍 Departamento Nacimiento', value: hoja.DEPARTAMENTO_NACIMIENTO || 'N/A' },
      { label: '🏙️ Ciudad Nacimiento', value: hoja.CIUDAD_NACIMIENTO || 'N/A' },
      { label: '📊 Estado', value: hoja.ESTADO, isBadge: true }
    ];

    basicFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;

      if (field.isBadge) {
        const badgeClass = field.value === 'Activo' ? 'bg-success' : 'bg-danger';
        html += `<span class="badge ${badgeClass}" style="font-size: 1em;">${field.value}</span>`;
      } else {
        html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      }
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
      { label: '🏙️ Ciudad Examenes', value: hoja.CIUDAD },
      { label: '🗺️ Departamento Examenes', value: hoja.DEPARTAMENTO }
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
      title: `Hoja de Vida - ${hoja.NOMBRE} ${hoja.PRIMER_APELLIDO}`,
      html,
      icon: 'info',
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar'
    });
  }

  agendar(hoja: HojaVida): void {
    Swal.fire({
      title: `Agendar Cita - ${hoja.NOMBRE} ${hoja.PRIMER_APELLIDO}`,
      html: `
        <div class="container-fluid">
          <form id="agendamientoForm">
            <div class="mb-3">
              <label for="fechaHora" class="form-label text-start d-block">
                <i class="fas fa-calendar-alt me-2"></i>Fecha y Hora de Agendamiento
              </label>
              <input type="datetime-local" id="fechaHora" class="form-control" required>
            </div>

            <div class="mb-3">
              <label for="examenes" class="form-label text-start d-block">
                <i class="fas fa-stethoscope me-2"></i>Exámenes a Realizar
              </label>
              <textarea id="examenes" class="form-control" rows="3"
                placeholder="Describa los exámenes médicos a realizar..."
                maxlength="500" required></textarea>
              <small class="text-muted">Máximo 500 caracteres</small>
            </div>

            <div class="mb-3">
              <label for="recomendaciones" class="form-label text-start d-block">
                <i class="fas fa-clipboard-list me-2"></i>Recomendaciones
              </label>
              <textarea id="recomendaciones" class="form-control" rows="3"
                placeholder="Escriba las recomendaciones para el paciente..."
                maxlength="500" required></textarea>
              <small class="text-muted">Máximo 500 caracteres</small>
            </div>
          </form>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Agendar Cita',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const fechaHora = (document.getElementById('fechaHora') as HTMLInputElement).value;
        const examenes = (document.getElementById('examenes') as HTMLTextAreaElement).value;
        const recomendaciones = (document.getElementById('recomendaciones') as HTMLTextAreaElement).value;

        if (!fechaHora || !examenes.trim() || !recomendaciones.trim()) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        if (examenes.length > 500 || recomendaciones.length > 500) {
          Swal.showValidationMessage('Los campos no pueden exceder 500 caracteres');
          return false;
        }

        return {
          fechaHora,
          examenes: examenes.trim(),
          recomendaciones: recomendaciones.trim(),
          hojaVidaId: hoja._id,
          paciente: `${hoja.NOMBRE} ${hoja.PRIMER_APELLIDO}`,
          documento: hoja.DOCUMENTO
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.procesarAgendamiento(result.value);
      }
    });
  }

  private procesarAgendamiento(datos: any): void {
    const usuarioId = this.getLoggedUserId();
    const ipsId = this.getLoggedIpsId();

    if (!usuarioId || !ipsId) {
      Swal.fire({
        title: 'Error de Sesión',
        text: 'No se pudo obtener la información del usuario o IPS. Por favor, inicie sesión nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const payload = {
      hojaVidaId: datos.hojaVidaId,
      fecha_hora: datos.fechaHora,
      examenes: datos.examenes,
      recomendaciones: datos.recomendaciones,
      usuario_id: usuarioId,
      ips_id: ipsId
    };

    this.service.tomarCaso(payload).subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          Swal.fire({
            title: '¡Cita Agendada Exitosamente!',
            html: `
              <div class="text-start">
                <p><strong>Paciente:</strong> ${datos.paciente}</p>
                <p><strong>Documento:</strong> ${datos.documento}</p>
                <p><strong>Fecha y Hora:</strong> ${new Date(datos.fechaHora).toLocaleString('es-CO')}</p>
                <p><strong>Exámenes:</strong> ${datos.examenes}</p>
                <p><strong>Recomendaciones:</strong> ${datos.recomendaciones}</p>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#28a745'
          });
          this.consultar(false);
          return;
        }

        Swal.fire({
          title: 'Error al Agendar',
          text: resp.response?.mensaje || 'No se pudo agendar la cita',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error al Agendar',
          text: err.error?.response?.mensaje || 'No se pudo agendar la cita. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  exportarExcel(): void {
    if (this.filtradas.length === 0) {
      Swal.fire({
        title: 'Sin Datos',
        text: 'No hay hojas de vida para exportar',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const datosExport = this.filtradas.map((hoja) => ({
      'Numero Curso': hoja.NUMERO_CURSO || hoja.PKEYHOJAVIDA || '',
      'Tipo Curso': hoja.TIPO_CURSO || hoja.PKEYASPIRANT || '',
      Documento: hoja.DOCUMENTO,
      'Nombre Completo': `${hoja.NOMBRE} ${hoja.PRIMER_APELLIDO} ${hoja.SEGUNDO_APELLIDO}`.trim(),
      Edad: hoja.EDAD,
      Género: hoja.GENERO,
      'Fecha de Nacimiento': hoja.FECH_NACIMIENTO,
      'Departamento Nacimiento': hoja.DEPARTAMENTO_NACIMIENTO || '',
      'Ciudad Nacimiento': hoja.CIUDAD_NACIMIENTO || '',
      Correo: hoja.CORREO,
      Teléfono: hoja.TELEFONO,
      Celular: hoja.CELULAR,
      Dirección: hoja.DIRECCION,
      'Ciudad Examenes': hoja.CIUDAD,
      'Departamento Examenes': hoja.DEPARTAMENTO,
      Estado: hoja.ESTADO,
      Regional: hoja.REGIONAL,
      'Código Inscripción': hoja.CODIGO_INSCRIPCION,
      'Programa Académico': hoja.CODIPROGACAD,
      'Año Académico': hoja.ANNOPERIACAD,
      'Número Período Académico': hoja.NUMEPERIACAD,
      Colegio: hoja.COLEGIO,
      'Grupo Minoritario': hoja.GRUP_MINO,
      Estrato: hoja.ESTRATO,
      'Tipo Medio': hoja.TIPO_MEDIO,
      'Complementaria 1': hoja.COMPLEMENTARIA_1,
      'Complementaria 2': hoja.COMPLEMENTARIA_2,
      'Fecha Inscripción': hoja.FECHA_INSCRIPCION
    }));

    const ws = XLSX.utils.json_to_sheet(datosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hojas de Vida');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `hojas_vida_${fecha}.xlsx`);

    Swal.fire({
      title: '¡Exportación Exitosa!',
      text: `Se han exportado ${datosExport.length} registros`,
      icon: 'success',
      confirmButtonText: 'Entendido'
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return 'bg-warning';
      case 'en gestion':
        return 'bg-primary';
      case 'gestionado':
        return 'bg-success';
      case 'inactivo':
        return 'bg-danger';
      case 'en espera':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  private getLoggedUserId(): string | null {
    const user = this.authService.getUser() as unknown;
    const value =
      this.pickStringish(user, 'id') ??
      this.pickStringish(user, '_id') ??
      this.pickStringish(user, 'user_id') ??
      this.pickStringish(user, 'usuario_id');
    return value;
  }

  private getLoggedIpsId(): string | null {
    const user = this.authService.getUser() as unknown;
    const value =
      this.pickStringish(user, 'ips_id') ??
      this.pickStringish(user, 'ipsId') ??
      this.pickStringish(user, 'IPS_ID') ??
      this.pickStringish(user, 'idIps') ??
      this.pickStringish(user, 'id_ips');
    return value;
  }

  private pickStringish(source: unknown, key: string): string | null {
    if (!source || typeof source !== 'object') return null;
    const record = source as Record<string, unknown>;
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return null;
  }
}

