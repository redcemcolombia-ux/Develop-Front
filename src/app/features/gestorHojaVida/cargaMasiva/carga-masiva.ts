import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { HojaVidaService } from '../hoja-vida.service';

@Component({
  selector: 'app-carga-masiva',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carga-masiva.html',
  styleUrl: './carga-masiva.css'
})
export class CargaMasiva {
  private readonly hojaVidaService = inject(HojaVidaService);

  selectedFile: File | null = null;
  isProcessing = false;
  uploadResults: any[] = [];
  showResults = false;

  previewData: any[] = [];
  showPreview = false;
  validationErrors: any[] = [];

  previewSearchTerm = '';
  previewCurrentPage = 1;
  previewItemsPerPage = 10;
  previewFilteredData: any[] = [];

  successfulRecords: any[] = [];
  duplicateRecords: any[] = [];
  processingMessage = '';
  hasErrors = false;

  Math = Math;

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';
      const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

      if (isExcel || isCsv) {
        this.selectedFile = file;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Archivo inválido',
          text: 'Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)'
        });
        event.target.value = '';
      }
    }
  }

  processExcelFile(): void {
    if (!this.selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay archivo',
        text: 'Por favor selecciona un archivo Excel o CSV primero'
      });
      return;
    }

    this.isProcessing = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        let jsonData: any[];

        if (this.selectedFile!.name.toLowerCase().endsWith('.csv')) {
          const csvText = e.target.result as string;
          const cleanText = csvText.replace(/^\uFEFF/, '');
          const lines = cleanText.split('\n').filter(line => line.trim() !== '');
          jsonData = lines.map(line => line.split(';').map(cell => cell.trim()));
        } else {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        }

        if (jsonData.length < 2) {
          throw new Error('El archivo debe contener al menos una fila de datos además de los encabezados');
        }

        const headers = jsonData[0] as string[];
        const expectedHeaders = [
          'PKEYHOJAVIDA', 'PKEYASPIRANT', 'CODIPROGACAD', 'ANNOPERIACAD', 'NUMEPERIACAD',
          'CODIGO_INSCRIPCION', 'DOCUMENTO', 'NOMBRE', 'PRIMER_APELLIDO', 'SEGUNDO_APELLIDO',
          'EDAD', 'GENERO', 'FECH_NACIMIENTO', 'CORREO', 'TELEFONO', 'CELULAR',
          'DIRECCION', 'CIUDAD', 'ESTADO', 'DEPARTAMENTO', 'REGIONAL',
          'COMPLEMENTARIA_1', 'COMPLEMENTARIA_2', 'FECHA_INSCRIPCION', 'GRUP_MINO',
          'ESTRATO', 'TIPO_MEDIO', 'COLEGIO'
        ];

        const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
          throw new Error(`Faltan las siguientes columnas: ${missingHeaders.join(', ')}`);
        }

        this.previewData = [];
        this.validationErrors = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          const rowData: any = {};

          headers.forEach((header, index) => {
            rowData[header] = row[index] || '';
          });

          const validation = this.hojaVidaService.validateHojaVida(rowData);
          if (!validation.isValid) {
            this.validationErrors.push({
              fila: i + 1,
              errores: validation.errors,
              data: rowData
            });
          }

          this.previewData.push({
            fila: i + 1,
            data: rowData,
            isValid: validation.isValid,
            errors: validation.errors
          });
        }

        // Inicializar datos filtrados ANTES de mostrar la previsualización
        this.previewFilteredData = [...this.previewData];
        this.previewCurrentPage = 1;

        this.showPreview = true;
        this.isProcessing = false;

        if (this.validationErrors.length > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Errores de validación encontrados',
            html: `Se encontraron ${this.validationErrors.length} filas con errores. Revisa la previsualización para más detalles.`,
            confirmButtonText: 'Revisar'
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Archivo válido',
            text: `${this.previewData.length} registros listos para procesar`,
            confirmButtonText: 'Continuar'
          });
        }

      } catch (error: any) {
        this.isProcessing = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al procesar archivo',
          text: error.message || 'Error desconocido al procesar el archivo'
        });
      }
    };

    if (this.selectedFile.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(this.selectedFile, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(this.selectedFile);
    }
  }

  confirmBulkSave(): void {
    const validRecords = this.previewData.filter(item => item.isValid);

    if (validRecords.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'No hay registros válidos',
        text: 'Corrige los errores antes de continuar'
      });
      return;
    }

    Swal.fire({
      title: '¿Confirmar guardado masivo?',
      html: `Se guardarán ${validRecords.length} registros válidos.<br>Los registros con errores serán omitidos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.saveBulkData(validRecords);
      }
    });
  }

  private saveBulkData(validRecords: any[]): void {
    this.isProcessing = true;
    const hojasVida = validRecords.map(record => record.data);

    this.hojaVidaService.registerBulk(hojasVida).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.hasErrors = false;

        this.successfulRecords = response.response?.hojas_vida || [];
        this.duplicateRecords = [];
        this.processingMessage = response.response?.mensaje || 'Procesamiento completado';

        this.showResults = true;
        this.showPreview = false;

        Swal.fire({
          icon: 'success',
          title: 'Carga masiva completada',
          text: this.processingMessage
        });
      },
      error: (error) => {
        this.isProcessing = false;

        if (error.status === 409 && error.error?.response) {
          this.hasErrors = true;
          this.successfulRecords = [];
          this.duplicateRecords = error.error.response.documentos_duplicados || [];
          this.processingMessage = error.error.response.mensaje || 'Se encontraron documentos duplicados';

          this.showResults = true;
          this.showPreview = false;

          Swal.fire({
            icon: 'warning',
            title: 'Documentos duplicados encontrados',
            text: this.processingMessage,
            confirmButtonText: 'Ver detalles'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error en carga masiva',
            text: 'Error al procesar los registros: ' + (error.error?.message || error.message)
          });
        }
      }
    });
  }

  cancelPreview(): void {
    this.showPreview = false;
    this.previewData = [];
    this.validationErrors = [];
    this.previewSearchTerm = '';
    this.previewCurrentPage = 1;
    this.previewFilteredData = [];
  }

  filtrarPreviewData(): void {
    if (!this.previewSearchTerm.trim()) {
      this.previewFilteredData = [...this.previewData];
    } else {
      const searchTerm = this.previewSearchTerm.toLowerCase().trim();
      this.previewFilteredData = this.previewData.filter(item => {
        const data = item.data;
        return (
          (data.DOCUMENTO && data.DOCUMENTO.toString().toLowerCase().includes(searchTerm)) ||
          (data.NOMBRE && data.NOMBRE.toLowerCase().includes(searchTerm)) ||
          (data.PRIMER_APELLIDO && data.PRIMER_APELLIDO.toLowerCase().includes(searchTerm)) ||
          (data.SEGUNDO_APELLIDO && data.SEGUNDO_APELLIDO.toLowerCase().includes(searchTerm)) ||
          (data.CORREO && data.CORREO.toLowerCase().includes(searchTerm)) ||
          (data.CODIPROGACAD && data.CODIPROGACAD.toString().toLowerCase().includes(searchTerm)) ||
          (data.CIUDAD && data.CIUDAD.toLowerCase().includes(searchTerm))
        );
      });
    }
    this.previewCurrentPage = 1;
  }

  get previewDataPaginados(): any[] {
    const startIndex = (this.previewCurrentPage - 1) * this.previewItemsPerPage;
    const endIndex = startIndex + this.previewItemsPerPage;
    return this.previewFilteredData.slice(startIndex, endIndex);
  }

  get previewTotalPages(): number {
    return Math.ceil(this.previewFilteredData.length / this.previewItemsPerPage);
  }

  cambiarPaginaPreview(page: number): void {
    if (page >= 1 && page <= this.previewTotalPages) {
      this.previewCurrentPage = page;
    }
  }

  get previewPaginasArray(): number[] {
    const totalPages = this.previewTotalPages;
    const currentPage = this.previewCurrentPage;
    const pages: number[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(totalPages);
      }
    }

    return pages;
  }

  get previewValidCount(): number {
    return this.previewData.filter(item => item.isValid).length;
  }

  get previewErrorCount(): number {
    return this.previewData.filter(item => !item.isValid).length;
  }

  downloadTemplate(): void {
    const headers = [
      'PKEYHOJAVIDA', 'PKEYASPIRANT', 'CODIPROGACAD', 'ANNOPERIACAD', 'NUMEPERIACAD',
      'CODIGO_INSCRIPCION', 'DOCUMENTO', 'NOMBRE', 'PRIMER_APELLIDO', 'SEGUNDO_APELLIDO',
      'EDAD', 'GENERO', 'FECH_NACIMIENTO', 'CORREO', 'TELEFONO', 'CELULAR',
      'DIRECCION', 'CIUDAD', 'ESTADO', 'DEPARTAMENTO', 'REGIONAL',
      'COMPLEMENTARIA_1', 'COMPLEMENTARIA_2', 'FECHA_INSCRIPCION', 'GRUP_MINO',
      'ESTRATO', 'TIPO_MEDIO', 'COLEGIO'
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, 'plantilla_hoja_vida.xlsx');
  }

  clearResults(): void {
    this.uploadResults = [];
    this.showResults = false;
    this.previewData = [];
    this.showPreview = false;
    this.validationErrors = [];
    this.selectedFile = null;

    this.successfulRecords = [];
    this.duplicateRecords = [];
    this.processingMessage = '';
    this.hasErrors = false;

    const fileInput = document.getElementById('excelFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  showRowDetails(item: any): void {
    const data = item.data;
    const errors = item.errors || [];

    let html = '<div class="text-start" style="font-family: Arial, sans-serif;">';

    // Header con estado
    html += `<div class="d-flex align-items-center mb-3">`;
    html += `<h5 class="mb-0 me-3">Detalles del Registro - Fila ${item.fila}</h5>`;
    const statusBadge = item.isValid ?
      '<span class="badge bg-success">✓ Válido</span>' :
      '<span class="badge bg-danger">✗ Con Errores</span>';
    html += statusBadge;
    html += `</div>`;

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
      { key: 'FECH_NACIMIENTO', label: '📅 Fecha de Nacimiento' }
    ];

    personalFields.forEach(field => {
      const value = data[field.key] || 'N/A';
      const hasError = errors.some((error: string) => error.toLowerCase().includes(field.key.toLowerCase().replace(/_/g, ' ')));
      const colorClass = hasError ? 'text-danger fw-bold' : 'text-dark';
      const bgClass = hasError ? 'bg-danger bg-opacity-10' : '';

      html += `<div class="col-md-6 mb-2 p-2 ${bgClass}" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="${colorClass}" style="font-size: 1.1em;">${value}</span>`;
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
      { key: 'TELEFONO', label: '☎️ Teléfono' },
      { key: 'CELULAR', label: '📱 Celular' },
      { key: 'DIRECCION', label: '🏠 Dirección' }
    ];

    contactFields.forEach(field => {
      const value = data[field.key] || 'N/A';
      const hasError = errors.some((error: string) => error.toLowerCase().includes(field.key.toLowerCase().replace(/_/g, ' ')));
      const colorClass = hasError ? 'text-danger fw-bold' : 'text-dark';
      const bgClass = hasError ? 'bg-danger bg-opacity-10' : '';

      html += `<div class="col-md-6 mb-2 p-2 ${bgClass}" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="${colorClass}" style="font-size: 1.1em;">${value}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información Académica y Ubicación
    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-success text-white"><strong>🎓 Información Académica y Ubicación</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const academicFields = [
      { key: 'CODIPROGACAD', label: '🎓 Programa Académico' },
      { key: 'ANNOPERIACAD', label: '📅 Año Período Académico' },
      { key: 'NUMEPERIACAD', label: '🔢 Número Período Académico' },
      { key: 'CIUDAD', label: '🏙️ Ciudad' },
      { key: 'DEPARTAMENTO', label: '🗺️ Departamento' },
      { key: 'REGIONAL', label: '🏢 Regional' },
      { key: 'COLEGIO', label: '🏫 Colegio' }
    ];

    academicFields.forEach(field => {
      const value = data[field.key] || 'N/A';
      const hasError = errors.some((error: string) => error.toLowerCase().includes(field.key.toLowerCase().replace(/_/g, ' ')));
      const colorClass = hasError ? 'text-danger fw-bold' : 'text-dark';
      const bgClass = hasError ? 'bg-danger bg-opacity-10' : '';

      html += `<div class="col-md-6 mb-2 p-2 ${bgClass}" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="${colorClass}" style="font-size: 1.1em;">${value}</span>`;
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
      { key: 'ESTADO', label: '📊 Estado' },
      { key: 'ESTRATO', label: '🏘️ Estrato' },
      { key: 'GRUP_MINO', label: '👥 Grupo Minoritario' },
      { key: 'TIPO_MEDIO', label: '📺 Tipo de Medio' },
      { key: 'COMPLEMENTARIA_1', label: '📝 Info Complementaria 1' },
      { key: 'COMPLEMENTARIA_2', label: '📝 Info Complementaria 2' }
    ];

    additionalFields.forEach(field => {
      const value = data[field.key] || 'N/A';
      const hasError = errors.some((error: string) => error.toLowerCase().includes(field.key.toLowerCase().replace(/_/g, ' ')));
      const colorClass = hasError ? 'text-danger fw-bold' : 'text-dark';
      const bgClass = hasError ? 'bg-danger bg-opacity-10' : '';

      html += `<div class="col-md-6 mb-2 p-2 ${bgClass}" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="${colorClass}" style="font-size: 1.1em;">${value}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // IDs del Sistema
    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-secondary text-white"><strong>🔑 IDs del Sistema</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const systemFields = [
      { key: 'PKEYHOJAVIDA', label: '🔑 ID Hoja de Vida' },
      { key: 'PKEYASPIRANT', label: '🔑 ID Aspirante' }
    ];

    systemFields.forEach(field => {
      const value = data[field.key] || 'N/A';
      const hasError = errors.some((error: string) => error.toLowerCase().includes(field.key.toLowerCase().replace(/_/g, ' ')));
      const colorClass = hasError ? 'text-danger fw-bold' : 'text-dark';
      const bgClass = hasError ? 'bg-danger bg-opacity-10' : '';

      html += `<div class="col-md-6 mb-2 p-2 ${bgClass}" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="${colorClass}" style="font-size: 1.1em; font-family: monospace;">${value}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Errores (si los hay)
    if (errors.length > 0) {
      html += '<div class="card border-danger">';
      html += '<div class="card-header bg-danger text-white"><strong>❌ Errores Encontrados</strong></div>';
      html += '<div class="card-body">';
      html += '<div class="alert alert-danger">';
      html += '<ul class="mb-0">';
      errors.forEach((error: string) => {
        html += `<li class="mb-1"><strong>⚠️ ${error}</strong></li>`;
      });
      html += '</ul>';
      html += '</div></div></div>';
    }

    html += '</div>';

    Swal.fire({
      title: item.isValid ? '✅ Registro Válido' : '❌ Registro con Errores',
      html: html,
      icon: item.isValid ? 'success' : 'error',
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar',
      customClass: {
        popup: 'swal-wide'
      }
    });
  }
}
