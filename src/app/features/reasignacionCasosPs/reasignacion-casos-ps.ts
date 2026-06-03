import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { ReasignacionCasosPsService } from './reasignacion-casos-ps.service';
import { PsicologiaGestionService, Usuario, CasoConUsuarioSic } from '../psicologiaGestion/psicologia-gestion.service';
import { AuthService } from '../../core/auth.service';
import { HojaVidaService } from '../gestorHojaVida/hoja-vida.service';

@Component({
  selector: 'app-reasignacion-casos-ps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reasignacion-casos-ps.html'
})
export class ReasignacionCasosPs implements OnInit {
  private service = inject(ReasignacionCasosPsService);
  private psicologiaService = inject(PsicologiaGestionService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private hojaVidaService = inject(HojaVidaService);

  casos: CasoConUsuarioSic[] = [];
  casosFiltrados: CasoConUsuarioSic[] = [];
  psicologos: Usuario[] = [];
  isLoading: boolean = false;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  Math = Math;

  ngOnInit(): void {
    // Primero cargar psicólogos, luego los casos
    this.cargarPsicologos();
  }

  /**
   * Carga casos con usuario SIC asignado
   */
  cargarDatos(): void {
    this.isLoading = true;

    this.service.getCasosConUsuarioSic().subscribe({
      next: (resp) => {
        this.isLoading = false;

        if (resp.error === 0) {
          this.casos = resp.response.data;
          this.casosFiltrados = [...this.casos];
          this.totalItems = this.casos.length;
          this.currentPage = 1;
          this.cdr.detectChanges();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.response?.mensaje || 'Error al consultar casos',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Sesión Expirada',
            text: 'Por favor, inicie sesión nuevamente',
            confirmButtonText: 'Entendido'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudo conectar con el servidor',
            confirmButtonText: 'Entendido'
          });
        }
      }
    });
  }

  /**
   * Filtra casos según el término de búsqueda
   */
  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.casosFiltrados = [...this.casos];
    } else {
      this.casosFiltrados = this.casos.filter(
        (caso) => {
          const documentoPsicologo = this.getDocumentoPsicologo(caso).toLowerCase();

          return (
            caso.DOCUMENTO?.toString().toLowerCase().includes(term) ||
            caso.NOMBRE?.toLowerCase().includes(term) ||
            caso.PRIMER_APELLIDO?.toLowerCase().includes(term) ||
            caso.SEGUNDO_APELLIDO?.toLowerCase().includes(term) ||
            documentoPsicologo.includes(term) ||
            caso.IPS_ID?.NOMBRE_IPS?.toLowerCase().includes(term)
          );
        }
      );
    }
    this.currentPage = 1;
  }

  /**
   * Obtiene casos paginados
   */
  get casosPaginados(): CasoConUsuarioSic[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.casosFiltrados.slice(startIndex, endIndex);
  }

  /**
   * Obtiene total de páginas
   */
  get totalPages(): number {
    return Math.ceil(this.casosFiltrados.length / this.itemsPerPage);
  }

  /**
   * Obtiene array de páginas para mostrar
   */
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

  /**
   * Cambia de página
   */
  cambiarPagina(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  /**
   * TrackBy para optimizar ngFor
   */
  trackById(index: number, item: CasoConUsuarioSic): string {
    return item._id || index.toString();
  }

  /**
   * Exporta casos a Excel
   */
  exportarExcel(): void {
    if (this.casosFiltrados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin Datos',
        text: 'No hay casos para exportar',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const datosExportar = this.casosFiltrados.map((caso) => ({
      Documento: caso.DOCUMENTO,
      Nombre: caso.NOMBRE,
      'Primer Apellido': caso.PRIMER_APELLIDO,
      'Segundo Apellido': caso.SEGUNDO_APELLIDO || '',
      'Documento Psicólogo Asignado': this.getDocumentoPsicologo(caso),
      IPS: caso.IPS_ID?.NOMBRE_IPS || 'N/A',
      Teléfono: caso.TELEFONO || '',
      Ciudad: caso.CIUDAD || '',
      Estado: caso.ESTADO || ''
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Casos Asignados');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `reasignacion_casos_${fecha}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: 'El archivo Excel se ha descargado exitosamente',
      timer: 2000,
      showConfirmButton: false
    });
  }

  /**
   * Carga lista de psicólogos y luego los casos
   */
  cargarPsicologos(): void {
    this.psicologiaService.listarUsuarios().subscribe({
      next: (resp) => {
        if (resp.error === 0 && resp.response?.usuarios) {
          this.psicologos = resp.response.usuarios.filter(
            (usuario) => usuario.Cr_Perfil === 'Psicólogo' || usuario.Cr_Perfil === 'Psicologo' || usuario.Cr_Perfil === 'psicologo' || usuario.Cr_Perfil === 'psicólogo'
          );

          // Cargar casos después de tener los psicólogos
          this.cargarDatos();
        }
      },
      error: (error) => {
        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: 'No se pudo cargar la lista de psicólogos. Es posible que no pueda reasignar casos.',
          confirmButtonText: 'Entendido'
        });
        // Aunque falle, intentar cargar los casos
        this.cargarDatos();
      }
    });
  }

  /**
   * Obtiene el documento del psicólogo asignado a un caso
   */
  getDocumentoPsicologo(caso: CasoConUsuarioSic): string {
    if (!caso.USUARIO_SIC) {
      return 'Sin asignación';
    }

    const psicologo = this.psicologos.find(p => p._id === caso.USUARIO_SIC);

    if (!psicologo) {
      return 'Sin asignación';
    }

    return psicologo.Cr_Pe_Codigo?.Pe_Documento || 'Sin documento';
  }

  /**
   * Abre modal para reasignar caso
   */
  reasignarCaso(caso: CasoConUsuarioSic): void {
    if (!caso._id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede reasignar el caso. ID no válido.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (this.psicologos.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin Psicólogos',
        text: 'No hay psicólogos disponibles para reasignar',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Obtener documento del psicólogo actual
    const psicologoActual = this.getDocumentoPsicologo(caso);

    // Crear HTML para lista con buscador
    const psicologosHTML = this.psicologos.map((psicologo) => {
      const documento = psicologo.Cr_Pe_Codigo?.Pe_Documento || 'Sin documento';
      return `
        <div class="psicologo-item" data-id="${psicologo._id}" data-nombre="${psicologo.Cr_Nombre_Usuario.toLowerCase()}" data-documento="${documento}">
          <div class="form-check">
            <input class="form-check-input psicologo-radio" type="radio" name="psicologoRadio" id="psi_${psicologo._id}" value="${psicologo._id}">
            <label class="form-check-label w-100" for="psi_${psicologo._id}">
              <strong>${psicologo.Cr_Nombre_Usuario}</strong><br>
              <small class="text-muted">Documento: ${documento}</small>
            </label>
          </div>
        </div>
      `;
    }).join('');

    // Mostrar modal
    Swal.fire({
      title: 'Reasignar Caso',
      html: `
        <div class="text-start">
          <p class="mb-2">
            <strong>Aspirante:</strong> ${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO || ''}
          </p>
          <p class="mb-2">
            <strong>Documento:</strong> ${caso.DOCUMENTO}
          </p>
          <p class="mb-2">
            <strong>Documento Psicólogo Actual:</strong> ${psicologoActual}
          </p>
          <hr>
          <label class="form-label">
            <strong>Nuevo Psicólogo:</strong> <span class="text-danger">*</span>
          </label>

          <div class="input-group mb-3">
            <span class="input-group-text">🔍</span>
            <input
              type="text"
              class="form-control"
              id="search-psicologo"
              placeholder="Buscar por nombre o documento..."
              autocomplete="off"
            >
          </div>

          <div id="psicologos-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 4px; padding: 10px;">
            ${psicologosHTML}
          </div>
        </div>

        <style>
          .psicologo-item {
            padding: 8px;
            margin-bottom: 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .psicologo-item:hover {
            background-color: rgba(13, 110, 253, 0.1);
          }
          .psicologo-item label {
            cursor: pointer;
            margin-bottom: 0;
          }
          #psicologos-list::-webkit-scrollbar {
            width: 8px;
          }
          #psicologos-list::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          #psicologos-list::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          #psicologos-list::-webkit-scrollbar-thumb:hover {
            background: #555;
          }

          /* Dark mode support */
          .swal2-popup.swal2-modal {
            background-color: var(--bs-body-bg, #fff);
            color: var(--bs-body-color, #212529);
          }
          .psicologo-item {
            background-color: var(--bs-body-bg, #fff);
          }
          #psicologos-list {
            background-color: var(--bs-body-bg, #fff);
            border-color: var(--bs-border-color, #dee2e6);
          }
        </style>
      `,
      showCancelButton: true,
      confirmButtonText: 'Reasignar Caso',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      width: '600px',
      didOpen: () => {
        const searchInput = document.getElementById('search-psicologo') as HTMLInputElement;
        const psicologoItems = document.querySelectorAll('.psicologo-item');

        // Funcionalidad de búsqueda
        searchInput?.addEventListener('input', (e) => {
          const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();

          psicologoItems.forEach((item) => {
            const nombre = item.getAttribute('data-nombre') || '';
            const documento = item.getAttribute('data-documento') || '';

            if (nombre.includes(searchTerm) || documento.includes(searchTerm)) {
              (item as HTMLElement).style.display = 'block';
            } else {
              (item as HTMLElement).style.display = 'none';
            }
          });
        });

        // Click en item selecciona el radio
        psicologoItems.forEach((item) => {
          item.addEventListener('click', () => {
            const radio = item.querySelector('input[type="radio"]') as HTMLInputElement;
            if (radio) {
              radio.checked = true;
            }
          });
        });
      },
      preConfirm: () => {
        const selected = document.querySelector('input[name="psicologoRadio"]:checked') as HTMLInputElement;
        if (!selected) {
          Swal.showValidationMessage('Debe seleccionar un psicólogo');
          return false;
        }
        return selected.value;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.confirmarReasignacion(caso._id, result.value);
      }
    });
  }

  /**
   * Confirma la reasignación del caso
   */
  private confirmarReasignacion(casoId: string, psicologoId: string): void {
    const supervisorId = this.authService.getUserId();

    if (!supervisorId) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Autenticación',
        text: 'No se pudo obtener el ID del usuario.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Reasignando caso...',
      html: 'Por favor espere',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar request
    const request = {
      caso_id: casoId,
      psicologo_id: psicologoId,
      supervisor_id: supervisorId
    };

    // Llamar al servicio de asignación (mismo que consultar hojas de vida)
    this.psicologiaService.asignarCaso(request).subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          const psicologo = this.psicologos.find((p) => p._id === psicologoId);
          const nombrePsicologo = psicologo?.Cr_Nombre_Usuario || 'el psicólogo';

          Swal.fire({
            icon: 'success',
            title: '¡Caso Reasignado!',
            text: `El caso ha sido reasignado exitosamente a ${nombrePsicologo}`,
            timer: 2500,
            showConfirmButton: true,
            confirmButtonText: 'OK'
          });

          // Actualizar listado
          this.cargarDatos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al Reasignar',
            text: resp.response?.mensaje || 'No se pudo reasignar el caso',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: (error) => {
        let errorMessage = 'No se pudo conectar con el servidor.';

        if (error.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
        } else if (error.status === 403) {
          errorMessage = 'No tiene permisos para reasignar casos.';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error de Conexión',
          text: errorMessage,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Ver detalle completo del caso
   */
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
      { label: '📋 Complementaria 2', value: hoja.COMPLEMENTARIA_2 },
      { label: '👨‍⚕️ Psicólogo Asignado', value: hoja.USUARIO_ID?.Cr_Nombre_Usuario || 'No asignado' },
      { label: '🏥 IPS', value: hoja.IPS_ID?.NOMBRE_IPS || 'N/A' }
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

    this.psicologiaService.obtenerPDF(filename).subscribe({
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
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.hojaVidaService.descargarBiometria(casoId).subscribe({
      next: (pdfBlob: Blob) => {
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);

        Swal.close();

        const pdfHtml = `
          <div style="width: 100%; height: 80vh;">
            <iframe src="${pdfBlobUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
          </div>
        `;

        Swal.fire({
          title: 'Biometría',
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
          text: 'No se pudo cargar el documento de biometría',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
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
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.psicologiaService.obtenerPDFNotificacionAuth(filename).subscribe({
      next: (pdfBlob: Blob) => {
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);

        Swal.close();

        const pdfHtml = `
          <div style="width: 100%; height: 80vh;">
            <iframe src="${pdfBlobUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
          </div>
        `;

        Swal.fire({
          title: 'Consentimiento',
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
          text: 'No se pudo cargar el consentimiento',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
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
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.psicologiaService.descargarPDFPsicologia(casoId).subscribe({
      next: (pdfBlob: Blob) => {
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);

        Swal.close();

        const pdfHtml = `
          <div style="width: 100%; height: 80vh;">
            <iframe src="${pdfBlobUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
          </div>
        `;

        Swal.fire({
          title: 'Resultados Psicología',
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
          text: 'No se pudo cargar los resultados de psicología',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}
