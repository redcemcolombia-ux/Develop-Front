import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { AuthService } from '../../core/auth.service';
import { HojaVida, MisCasosService } from '../misCasos/mis-casos.service';

@Component({
  selector: 'app-casos-gestionados',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './casos-gestionados.html'
})
export class CasosGestionados implements OnInit {
  private readonly service = inject(MisCasosService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  casos: HojaVida[] = [];
  filtrados: HojaVida[] = [];
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

    const ipsId = this.getLoggedIpsId();

    if (!ipsId) {
      this.isLoading = false;
      this.cdr.detectChanges();
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener el ID de la IPS. Por favor, inicie sesión nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.service.consultarCasosTomados(ipsId).subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          this.casos = resp.response?.data ?? [];
          this.totalItems = this.casos.length;
          this.filtrar();
          this.isLoading = false;
          this.cdr.detectChanges();

          if (showSuccessMessage) {
            Swal.fire({
              title: '¡Éxito!',
              text: resp.response?.mensaje || 'Casos gestionados consultados exitosamente',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } else {
          this.casos = [];
          this.filtrados = [];
          this.totalItems = 0;
          this.isLoading = false;
          this.cdr.detectChanges();

          Swal.fire({
            title: 'Información',
            text: resp.response?.mensaje || 'No se encontraron casos gestionados',
            icon: 'info',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  filtrar(): void {
    if (!Array.isArray(this.casos)) {
      this.casos = [];
      this.filtrados = [];
      return;
    }

    // Filtrar solo casos que tengan AMBOS documentos cargados (PDF Y Biometría)
    const casosConAmbosDocumentos = this.casos.filter((c) => {
      const tienePDF = c.PDF_URL && c.PDF_URL.trim() !== '';
      const tieneBiometria = c.RUTA_BIOMETRIA && c.RUTA_BIOMETRIA.ruta && c.RUTA_BIOMETRIA.ruta.trim() !== '';
      return tienePDF && tieneBiometria;
    });

    if (!this.searchTerm.trim()) {
      this.filtrados = [...casosConAmbosDocumentos];
    } else {
      const t = this.searchTerm.toLowerCase();
      this.filtrados = casosConAmbosDocumentos.filter(
        (c) =>
          c.NOMBRE?.toLowerCase().includes(t) ||
          c.PRIMER_APELLIDO?.toLowerCase().includes(t) ||
          c.SEGUNDO_APELLIDO?.toLowerCase().includes(t) ||
          c.DOCUMENTO?.toLowerCase().includes(t) ||
          c.CORREO?.toLowerCase().includes(t) ||
          c.CIUDAD?.toLowerCase().includes(t) ||
          c.EXAMENES?.toLowerCase().includes(t) ||
          c.NOMBREIPS?.toLowerCase().includes(t) ||
          c.TELEFONO?.toLowerCase().includes(t) ||
          c.CELULAR?.toLowerCase().includes(t) ||
          c.GENERO?.toLowerCase().includes(t) ||
          c.DEPARTAMENTO?.toLowerCase().includes(t) ||
          c.REGIONAL?.toLowerCase().includes(t) ||
          c.ESTADO?.toLowerCase().includes(t) ||
          c.DIRECCION?.toLowerCase().includes(t) ||
          c.CODIGO_INSCRIPCION?.toLowerCase().includes(t) ||
          c.CODIPROGACAD?.toLowerCase().includes(t) ||
          c.COLEGIO?.toLowerCase().includes(t) ||
          c.RECOMENDACIONES?.toLowerCase().includes(t) ||
          String(c.EDAD || '').includes(t)
      );
    }
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.filtrar();
  }

  get paginados(): HojaVida[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filtrados.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filtrados.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  trackById(_i: number, item: HojaVida): string {
    return item._id;
  }

  verDetalle(caso: HojaVida): void {
    let html = '<div class="container-fluid">';

    // Información Básica
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-primary text-white">';
    html += '<h6 class="mb-0">Información Básica</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const basicFields = [
      { label: 'Numero Curso', value: caso.NUMERO_CURSO || caso.PKEYHOJAVIDA || '' },
      { label: 'Tipo Curso', value: caso.TIPO_CURSO || caso.PKEYASPIRANT || '' },
      { label: 'Documento', value: caso.DOCUMENTO },
      { label: 'Nombre Completo', value: `${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO}`.trim() },
      { label: 'Edad', value: caso.EDAD },
      { label: 'Género', value: caso.GENERO },
      {
        label: 'Fecha de Nacimiento',
        value: caso.FECH_NACIMIENTO ? new Date(caso.FECH_NACIMIENTO).toLocaleDateString('es-CO') : 'N/A'
      },
      { label: 'Departamento Nacimiento', value: caso.DEPARTAMENTO_NACIMIENTO || '' },
      { label: 'Ciudad Nacimiento', value: caso.CIUDAD_NACIMIENTO || '' },
      { label: 'Estado', value: caso.ESTADO, isBadge: true }
    ];

    basicFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;

      if (field.isBadge) {
        const badgeClass = this.getEstadoBadgeClass(field.value as string);
        html += `<span class="badge ${badgeClass}" style="font-size: 1em;">${field.value}</span>`;
      } else {
        html += `<span class="text-dark" style="font-size: 1.1em; ">${field.value || 'N/A'}</span>`;
      }
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información de Contacto
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-info text-white">';
    html += '<h6 class="mb-0">Información de Contacto</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const contactFields = [
      { label: 'Correo Electrónico', value: caso.CORREO },
      { label: 'Teléfono', value: caso.TELEFONO },
      { label: 'Celular', value: caso.CELULAR },
      { label: 'Dirección', value: caso.DIRECCION },
      { label: 'Ciudad Examenes', value: caso.CIUDAD },
      { label: 'Departamento Examenes', value: caso.DEPARTAMENTO }
    ];

    contactFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; ">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Académica
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-warning text-dark">';
    html += '<h6 class="mb-0">Información Académica</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const academicFields = [
      { label: 'Regional', value: caso.REGIONAL },
      { label: 'Código Inscripción', value: caso.CODIGO_INSCRIPCION },
      { label: 'Código Programa', value: caso.CODIPROGACAD },
      { label: 'Año Periodo', value: caso.ANNOPERIACAD },
      { label: 'Número Periodo', value: caso.NUMEPERIACAD },
      { label: 'Colegio', value: caso.COLEGIO }
    ];

    academicFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; ">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Adicional
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-secondary text-white">';
    html += '<h6 class="mb-0">Información Adicional</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const additionalFields = [
      { label: 'Grupo Minoritario', value: caso.GRUP_MINO },
      { label: 'Estrato', value: caso.ESTRATO },
      { label: 'Tipo de Medio', value: caso.TIPO_MEDIO },
      { label: 'Complementaria 1', value: caso.COMPLEMENTARIA_1 },
      { label: 'Complementaria 2', value: caso.COMPLEMENTARIA_2 },
      {
        label: 'Fecha Inscripción',
        value: caso.FECHA_INSCRIPCION ? new Date(caso.FECHA_INSCRIPCION).toLocaleDateString('es-CO') : 'N/A'
      }
    ];

    additionalFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; ">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Médica
    if (caso.EXAMENES || caso.FECHA_HORA || caso.RECOMENDACIONES || caso.NOMBREIPS) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-success text-white">';
      html += '<h6 class="mb-0">Información Médica</h6>';
      html += '</div>';
      html += '<div class="card-body">';
      html += '<div class="row">';

      const medicalFields = [
        { label: 'Exámenes', value: caso.EXAMENES },
        { label: 'Fecha y Hora', value: this.formatearFechaHora(caso.FECHA_HORA) },
        { label: 'IPS', value: caso.NOMBREIPS }
      ];

      medicalFields.forEach((field) => {
        if (field.value && field.value !== 'N/A') {
          html += `<div class="col-md-6 mb-2 p-2">`;
          html += `<strong class="text-muted">${field.label}:</strong><br>`;
          html += `<span class="text-dark" style="font-size: 1.1em;">${field.value}</span>`;
          html += `</div>`;
        }
      });

      if (caso.RECOMENDACIONES) {
        html += `<div class="col-12 mb-2 p-2">`;
        html += `<strong class="text-muted">Recomendaciones:</strong><br>`;
        html += `<div class="alert alert-info mt-2" style="font-size: 1.1em;">${caso.RECOMENDACIONES}</div>`;
        html += `</div>`;
      }

      html += '</div></div></div>';
    }

    // Documento PDF
    if (caso.PDF_URL) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-info text-white">';
      html += '<h6 class="mb-0">Examenes</h6>';
      html += '</div>';
      html += '<div class="card-body text-center">';
      html += `<p class="mb-3"><strong>Estado:</strong> <span class="badge bg-success">Cargado</span></p>`;
      html += '<button id="verPdfBtn" class="btn btn-primary">Ver Examenes</button>';
      html += '</div></div>';
    }

    // Datos Biométricos
    if (caso.RUTA_BIOMETRIA) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-info text-white">';
      html += '<h6 class="mb-0">Datos Biométricos</h6>';
      html += '</div>';
      html += '<div class="card-body text-center">';
      html += `<p class="mb-3"><strong>Estado:</strong> <span class="badge bg-success">Cargado</span></p>`;
      html += `<p class="mb-3"><strong>Fecha de Carga:</strong> ${caso.RUTA_BIOMETRIA.fecha ? new Date(caso.RUTA_BIOMETRIA.fecha).toLocaleDateString('es-CO') : 'N/A'}</p>`;
      html += '<button id="verBiometriaBtn" class="btn btn-success">Ver Biometría</button>';
      html += '</div></div>';
    }

    html += '</div>';

    Swal.fire({
      title: `Caso Gestionado - ${caso.NOMBRE} ${caso.PRIMER_APELLIDO}`,
      html: html,
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar',
      didOpen: () => {
        if (caso.PDF_URL) {
          const verPdfBtn = document.getElementById('verPdfBtn');
          if (verPdfBtn) {
            const filename = this.extraerNombreArchivo(caso.PDF_URL);
            verPdfBtn.onclick = () => this.verPDF(filename);
          }
        }

        if (caso.RUTA_BIOMETRIA) {
          const verBioBtn = document.getElementById('verBiometriaBtn');
          if (verBioBtn) {
            verBioBtn.onclick = () => this.verBiometriaPorAspirante(caso._id);
          }
        }
      }
    });
  }

  verPDF(filename: string): void {
    Swal.fire({
      title: 'Cargando PDF...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.service.obtenerPDF(filename).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);

        Swal.fire({
          title: 'Examenes',
          html: `
            <div style="width: 100%; height: 600px;">
              <iframe src="${fileURL}" width="100%" height="100%" style="border: none;"></iframe>
            </div>
          `,
          width: '90%',
          showCloseButton: true,
          showConfirmButton: true,
          confirmButtonText: 'Descargar',
          confirmButtonColor: '#28a745',
          showCancelButton: true,
          cancelButtonText: 'Cerrar',
          cancelButtonColor: '#6c757d'
        }).then((result) => {
          if (result.isConfirmed) {
            const a = document.createElement('a');
            a.href = fileURL;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(fileURL);
          } else {
            URL.revokeObjectURL(fileURL);
          }
        });
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el documento PDF',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  verBiometriaPorAspirante(idAspirante: string): void {
    Swal.fire({
      title: 'Cargando Biometría...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.service.obtenerBiometriaPorAspirante(idAspirante).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);

        Swal.fire({
          title: 'Datos Biométricos',
          html: `
            <div style="width: 100%; height: 600px;">
              <iframe src="${fileURL}" width="100%" height="100%" style="border: none;"></iframe>
            </div>
          `,
          width: '90%',
          showCloseButton: true,
          showConfirmButton: true,
          confirmButtonText: 'Descargar',
          confirmButtonColor: '#28a745',
          showCancelButton: true,
          cancelButtonText: 'Cerrar',
          cancelButtonColor: '#6c757d'
        }).then((result) => {
          if (result.isConfirmed) {
            const a = document.createElement('a');
            a.href = fileURL;
            a.download = `biometria_${idAspirante}.pdf`;
            a.click();
            URL.revokeObjectURL(fileURL);
          } else {
            URL.revokeObjectURL(fileURL);
          }
        });
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el documento de biometría',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  exportarExcel(): void {
    if (this.filtrados.length === 0) {
      Swal.fire({
        title: 'Sin Datos',
        text: 'No hay casos gestionados para exportar',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const datosExport = this.filtrados.map((caso) => ({
      'Numero Curso': caso.NUMERO_CURSO || caso.PKEYHOJAVIDA || '',
      'Tipo Curso': caso.TIPO_CURSO || caso.PKEYASPIRANT || '',
      'Documento': caso.DOCUMENTO,
      'Nombre Completo': `${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO}`,
      'Edad': caso.EDAD,
      'Género': caso.GENERO,
      'Departamento Nacimiento': caso.DEPARTAMENTO_NACIMIENTO || '',
      'Ciudad Nacimiento': caso.CIUDAD_NACIMIENTO || '',
      'Exámenes': caso.EXAMENES || 'N/A',
      'Fecha/Hora Cita': this.formatearFechaHora(caso.FECHA_HORA),
      'IPS': caso.NOMBREIPS || 'N/A',
      'Recomendaciones': caso.RECOMENDACIONES || 'N/A',
      'Correo': caso.CORREO,
      'Teléfono': caso.TELEFONO,
      'Celular': caso.CELULAR,
      'Ciudad Examenes': caso.CIUDAD,
      'Departamento Examenes': caso.DEPARTAMENTO,
      'Estado': caso.ESTADO,
      'PDF Cargado': caso.PDF_URL ? 'Sí' : 'No',
      'Biometría Cargada': caso.RUTA_BIOMETRIA ? 'Sí' : 'No'
    }));

    const ws = XLSX.utils.json_to_sheet(datosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Casos Gestionados');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `casos_gestionados_${fecha}.xlsx`);

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

  formatearFechaHora(fechaHora: string | undefined): string {
    if (!fechaHora) return 'N/A';

    try {
      const fecha = new Date(fechaHora);
      return fecha.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaHora;
    }
  }

  extraerNombreArchivo(ruta: string): string {
    if (!ruta) return '';
    const partes = ruta.split('/');
    return partes[partes.length - 1];
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
