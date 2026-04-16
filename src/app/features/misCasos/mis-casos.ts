import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { AuthService } from '../../core/auth.service';
import { HojaVida, MisCasosService } from './mis-casos.service';

@Component({
  selector: 'app-mis-casos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './mis-casos.html',
  styleUrls: ['./mis-casos.css']
})
export class MisCasos implements OnInit {
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
              text: resp.response?.mensaje || 'Casos consultados exitosamente',
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
            text: resp.response?.mensaje || 'No se encontraron casos tomados',
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

    // Filtrar primero: excluir casos que tengan AMBOS documentos cargados
    const casosSinAmbosDocumentos = this.casos.filter((c) => {
      const tienePDF = c.PDF_URL && c.PDF_URL.trim() !== '';
      const tieneBiometria = c.RUTA_BIOMETRIA && c.RUTA_BIOMETRIA.ruta && c.RUTA_BIOMETRIA.ruta.trim() !== '';
      return !(tienePDF && tieneBiometria);
    });

    if (!this.searchTerm.trim()) {
      this.filtrados = [...casosSinAmbosDocumentos];
    } else {
      const t = this.searchTerm.toLowerCase();
      this.filtrados = casosSinAmbosDocumentos.filter(
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

  hasBiometriaPdf(caso: HojaVida): boolean {
    const ruta = caso.RUTA_BIOMETRIA?.ruta;
    return typeof ruta === 'string' && ruta.trim().length > 0;
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
      { label: 'Documento', value: caso.DOCUMENTO },
      { label: 'Nombre Completo', value: `${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO}`.trim() },
      { label: 'Edad', value: caso.EDAD },
      { label: 'Género', value: caso.GENERO },
      {
        label: 'Fecha de Nacimiento',
        value: caso.FECH_NACIMIENTO ? new Date(caso.FECH_NACIMIENTO).toLocaleDateString('es-CO') : 'N/A'
      },
      { label: 'Estado', value: caso.ESTADO, isBadge: true }
    ];

    basicFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;

      if (field.isBadge) {
        const badgeClass = this.getEstadoBadgeClass(field.value as string);
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
    html += '<h6 class="mb-0">Información de Contacto</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const contactFields = [
      { label: 'Correo Electrónico', value: caso.CORREO },
      { label: 'Teléfono', value: caso.TELEFONO },
      { label: 'Celular', value: caso.CELULAR },
      { label: 'Dirección', value: caso.DIRECCION },
      { label: 'Ciudad', value: caso.CIUDAD },
      { label: 'Departamento', value: caso.DEPARTAMENTO }
    ];

    contactFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
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
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
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
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Médica (condicional)
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
          html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value}</span>`;
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

    // Documento PDF (condicional)
    if (caso.PDF_URL) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-info text-white">';
      html += '<h6 class="mb-0">Historial Clinico</h6>';
      html += '</div>';
      html += '<div class="card-body text-center">';
      html += `<p class="mb-3"><strong>Estado:</strong> <span class="badge bg-success">Disponible</span></p>`;
      html += '<button id="verPdfBtn" class="btn btn-primary">Ver H-Clinico</button>';
      html += '</div></div>';
    }

    // Datos Biométricos (condicional)
    if (this.hasBiometriaPdf(caso)) {
      const biometriaFecha = caso.RUTA_BIOMETRIA?.fecha;
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-info text-white">';
      html += '<h6 class="mb-0">Datos Biométricos</h6>';
      html += '</div>';
      html += '<div class="card-body text-center">';
      html += `<p class="mb-3"><strong>Estado:</strong> <span class="badge bg-success">Disponible</span></p>`;
      html += `<p class="mb-3"><strong>Fecha de Carga:</strong> ${biometriaFecha ? new Date(biometriaFecha).toLocaleDateString('es-CO') : 'N/A'}</p>`;
      html += '<button id="verBiometriaBtn" class="btn btn-success">Ver Biometría</button>';
      html += '</div></div>';
    }

    html += '</div>';

    Swal.fire({
      title: `Caso - ${caso.NOMBRE} ${caso.PRIMER_APELLIDO}`,
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

        if (this.hasBiometriaPdf(caso)) {
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
          title: 'Historial Clinico',
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

  cargarPDF(caso: HojaVida): void {
    Swal.fire({
      title: 'Cargar PDF',
      html: `
        <div class="text-start mb-3">
          <p><strong>Paciente:</strong> ${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO}</p>
          <p><strong>Documento:</strong> ${caso.DOCUMENTO}</p>
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
      confirmButtonText: 'Guardar PDF',
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
        this.procesarCargaPDF(caso._id, result.value);
      }
    });
  }

  private procesarCargaPDF(hojaVidaId: string, pdfFile: File): void {
    this.service.cargarPDF(hojaVidaId, pdfFile).subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          Swal.fire({
            title: '¡PDF Cargado Exitosamente!',
            html: `
              <div class="text-start">
                <p><strong>Mensaje:</strong> ${resp.response?.mensaje || 'PDF almacenado correctamente'}</p>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Entendido'
          });
          this.consultar(false);
        } else {
          Swal.fire({
            title: 'Error al Cargar PDF',
            text: resp.response?.mensaje || resp.mensaje || 'Error desconocido del servidor',
            icon: 'error',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: () => {
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudo cargar el PDF. Verifique su conexión.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  cargarBiometria(caso: HojaVida): void {
    Swal.fire({
      title: 'Cargar Datos Biométricos',
      html: `
        <div class="text-start mb-3">
          <p><strong>Paciente:</strong> ${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO}</p>
          <p><strong>Documento:</strong> ${caso.DOCUMENTO}</p>
        </div>
        <div class="mb-3">
          <label for="bioFile" class="form-label">Seleccionar archivo PDF de datos biométricos:</label>
          <input type="file" id="bioFile" class="form-control" accept=".pdf">
        </div>
        <div id="bioPreview" class="mt-3" style="display: none;">
          <h6>Vista previa:</h6>
          <embed id="bioEmbed" type="application/pdf" width="100%" height="300px">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Biometría',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      width: '600px',
      didOpen: () => {
        const fileInput = document.getElementById('bioFile') as HTMLInputElement;
        const preview = document.getElementById('bioPreview') as HTMLDivElement;
        const embed = document.getElementById('bioEmbed') as HTMLEmbedElement;

        fileInput?.addEventListener('change', (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file && file.type === 'application/pdf') {
            const fileURL = URL.createObjectURL(file);
            embed.src = fileURL;
            preview.style.display = 'block';
          } else if (file) {
            Swal.showValidationMessage('Por favor seleccione un archivo PDF válido');
            preview.style.display = 'none';
          }
        });
      },
      preConfirm: () => {
        const fileInput = document.getElementById('bioFile') as HTMLInputElement;
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
        this.procesarCargaBiometria(caso._id, result.value);
      }
    });
  }

  private procesarCargaBiometria(idAspirante: string, pdfFile: File): void {
    const idUsuario = this.getLoggedUserId();

    if (!idUsuario) {
      Swal.fire({
        title: 'Sesión requerida',
        text: 'No se pudo obtener el usuario logueado. Inicie sesión nuevamente.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.service.subirBiometria(idAspirante, idUsuario, pdfFile).subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          Swal.fire({
            title: '¡Biometría cargada!',
            text: resp.response?.mensaje || 'PDF de datos biométricos subido correctamente',
            icon: 'success',
            confirmButtonText: 'Entendido'
          });
          this.consultar(false);
        } else {
          Swal.fire({
            title: 'Error al cargar biometría',
            text: resp.response?.mensaje || resp.mensaje || 'Error desconocido del servidor',
            icon: 'error',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: () => {
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudo cargar el PDF de biometría. Verifique su conexión.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
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

  private getLoggedUserId(): string | null {
    const user = this.authService.getUser() as unknown;
    const value =
      this.pickStringish(user, 'id') ??
      this.pickStringish(user, '_id') ??
      this.pickStringish(user, 'user_id') ??
      this.pickStringish(user, 'usuario_id');
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

  exportarExcel(): void {
    if (this.filtrados.length === 0) {
      Swal.fire({
        title: 'Sin Datos',
        text: 'No hay casos tomados para exportar',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const datosExport = this.filtrados.map((caso) => ({
      Documento: caso.DOCUMENTO,
      'Nombre Completo': `${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO}`,
      Edad: caso.EDAD,
      Género: caso.GENERO,
      Exámenes: caso.EXAMENES || 'N/A',
      'Fecha/Hora Cita': this.formatearFechaHora(caso.FECHA_HORA),
      IPS: caso.NOMBREIPS || 'N/A',
      Recomendaciones: caso.RECOMENDACIONES || 'N/A',
      Correo: caso.CORREO,
      Teléfono: caso.TELEFONO,
      Ciudad: caso.CIUDAD,
      Estado: caso.ESTADO
    }));

    const ws = XLSX.utils.json_to_sheet(datosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Casos Tomados');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `casos_tomados_${fecha}.xlsx`);

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
}
