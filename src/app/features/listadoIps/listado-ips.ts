import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { Ips, ListadoIpsService } from './listado-ips.service';

@Component({
  selector: 'app-listado-ips',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './listado-ips.html'
})
export class ListadoIps implements OnInit {
  private readonly listadoIpsService = inject(ListadoIpsService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Output() editarIps = new EventEmitter<Ips>();

  ipsExistentes: Ips[] = [];
  ipsFiltradas: Ips[] = [];
  isLoadingConsulta = false;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  Math = Math;

  ngOnInit(): void {
    this.consultarIps(false);
  }

  consultarIps(showSuccessMessage = true): void {
    this.isLoadingConsulta = true;
    this.cdr.detectChanges();

    this.listadoIpsService.consultarIps().subscribe({
      next: (response) => {
        if (response.error === 0) {
          this.ipsExistentes = response.response?.ips || [];
          this.totalItems = response.response?.total || 0;
          this.filtrarIps();

          if (showSuccessMessage) {
            Swal.fire({
              title: '¡Éxito!',
              text: response.response?.mensaje || 'IPS consultadas exitosamente',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } else {
          this.ipsExistentes = [];
          this.ipsFiltradas = [];
          this.totalItems = 0;

          Swal.fire({
            title: 'Información',
            text: response.response?.mensaje || 'No se encontraron IPS registradas',
            icon: 'info',
            confirmButtonText: 'Entendido'
          });
        }

        this.isLoadingConsulta = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingConsulta = false;
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

  filtrarIps(): void {
    if (!this.searchTerm.trim()) {
      this.ipsFiltradas = [...this.ipsExistentes];
    } else {
      const termino = this.searchTerm.toLowerCase();
      this.ipsFiltradas = this.ipsExistentes.filter(
        (ips) =>
          ips.NOMBRE_IPS.toLowerCase().includes(termino) ||
          ips.NIT.toLowerCase().includes(termino) ||
          ips.CORREO.toLowerCase().includes(termino) ||
          ips.REPRESENTANTE.toLowerCase().includes(termino) ||
          ips.CIUDAD.toLowerCase().includes(termino) ||
          ips.DEPARTAMENTO.toLowerCase().includes(termino) ||
          ips.REGIONAL.toLowerCase().includes(termino) ||
          ips.ESTADO.toLowerCase().includes(termino)
      );
    }
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.filtrarIps();
  }

  get paginatedIps(): Ips[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.ipsFiltradas.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.ipsFiltradas.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  trackById(_index: number, item: Ips): string {
    return item._id;
  }

  verDetalle(ips: Ips): void {
    const especialidades = ips.COMPLEMENTARIA_1.especialidades.join(', ');

    let html = '<div class="text-start" style="font-family: Arial, sans-serif;">';

    html += `<div class="d-flex align-items-center mb-3">`;
    html += `<h5 class="mb-0 me-3">Detalle de IPS</h5>`;
    const statusBadge =
      ips.ESTADO === 'ACTIVA'
        ? '<span class="badge bg-success">✓ Activa</span>'
        : ips.ESTADO === 'SUSPENDIDA'
          ? '<span class="badge bg-warning">⏸️ Suspendida</span>'
          : '<span class="badge bg-danger">✗ Cancelada</span>';
    html += statusBadge;
    html += `</div>`;

    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-primary text-white"><strong>Información Básica</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const basicFields: Array<{ label: string; value: string | undefined }> = [
      { label: 'Nombre de la IPS', value: ips.NOMBRE_IPS },
      { label: 'NIT', value: ips.NIT },
      { label: 'Representante Legal', value: ips.REPRESENTANTE },
      { label: 'Regional', value: ips.REGIONAL }
    ];

    basicFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-info text-white"><strong>Información de Contacto</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const contactFields: Array<{ label: string; value: string | undefined }> = [
      { label: 'Dirección', value: ips.DIRECCION },
      { label: 'Teléfono', value: ips.TELEFONO },
      { label: 'Correo Electrónico', value: ips.CORREO },
      { label: 'Ciudad', value: ips.CIUDAD },
      { label: 'Departamento', value: ips.DEPARTAMENTO }
    ];

    contactFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-success text-white"><strong>Información de Servicios</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const serviceFields: Array<{ label: string; value: string | undefined }> = [
      { label: 'Tipo de Atención', value: ips.COMPLEMENTARIA_1.tipo_atencion },
      { label: 'Nivel de Complejidad', value: ips.COMPLEMENTARIA_2.nivel_complejidad },
      { label: 'Horario de Atención', value: ips.COMPLEMENTARIA_2.horario_atencion }
    ];

    serviceFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += `<div class="col-12 mb-2 p-2" style="border-radius: 5px;">`;
    html += `<strong class="text-muted">Especialidades:</strong><br>`;
    html += `<span class="text-dark" style="font-size: 1.1em;">${especialidades || 'N/A'}</span>`;
    html += `</div>`;

    html += '</div></div></div>';

    html += '<div class="card mb-3 shadow">';
    html += '<div class="card-header bg-secondary text-white"><strong>Información del Sistema</strong></div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const systemFields: Array<{ label: string; value: string; isBadge?: boolean }> = [
      { label: 'Estado', value: ips.ESTADO, isBadge: true },
      { label: 'Fecha de Registro', value: new Date(ips.FECHA_REGISTRO).toLocaleDateString('es-CO') },
      { label: 'Fecha de Creación', value: new Date(ips.createdAt).toLocaleDateString('es-CO') },
      { label: 'Última Actualización', value: new Date(ips.updatedAt).toLocaleDateString('es-CO') }
    ];

    systemFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2" style="border-radius: 5px;">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;

      if (field.isBadge) {
        const badgeClass =
          field.value === 'ACTIVA' ? 'bg-success' : field.value === 'SUSPENDIDA' ? 'bg-warning' : 'bg-danger';
        html += `<span class="badge ${badgeClass}" style="font-size: 1em;">${field.value}</span>`;
      } else {
        html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      }
      html += `</div>`;
    });

    html += '</div></div></div>';
    html += '</div>';

    Swal.fire({
      title: `${ips.NOMBRE_IPS}`,
      html,
      icon: 'info',
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar'
    });
  }

  onEditarIps(ips: Ips): void {
    this.editarIps.emit(ips);
  }

  exportarExcel(): void {
    if (this.ipsFiltradas.length === 0) {
      Swal.fire({
        title: 'Sin datos',
        text: 'No hay datos para exportar',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const datosExportar = this.ipsFiltradas.map((ips) => ({
      'Nombre IPS': ips.NOMBRE_IPS,
      NIT: ips.NIT,
      Dirección: ips.DIRECCION,
      Teléfono: ips.TELEFONO,
      Correo: ips.CORREO,
      Representante: ips.REPRESENTANTE,
      Ciudad: ips.CIUDAD,
      Departamento: ips.DEPARTAMENTO,
      Regional: ips.REGIONAL,
      Estado: ips.ESTADO,
      'Tipo de Atención': ips.COMPLEMENTARIA_1.tipo_atencion,
      Especialidades: ips.COMPLEMENTARIA_1.especialidades.join(', '),
      'Horario de Atención': ips.COMPLEMENTARIA_2.horario_atencion,
      'Nivel de Complejidad': ips.COMPLEMENTARIA_2.nivel_complejidad,
      'Fecha de Registro': new Date(ips.FECHA_REGISTRO).toLocaleDateString('es-CO')
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IPS');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `IPS_${fecha}.xlsx`);

    Swal.fire({
      title: '¡Éxito!',
      text: 'Archivo Excel exportado correctamente',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'ACTIVA':
        return 'bg-success';
      case 'SUSPENDIDA':
        return 'bg-warning text-dark';
      case 'CANCELADA':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}
