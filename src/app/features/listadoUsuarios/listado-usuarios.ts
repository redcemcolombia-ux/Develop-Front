import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, Output, EventEmitter, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { ListadoUsuariosService, Usuario } from './listado-usuarios.service';

@Component({
  selector: 'app-listado-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './listado-usuarios.html',
  styleUrls: ['./listado-usuarios.css']
})
export class ListadoUsuarios implements OnInit {
  private readonly service = inject(ListadoUsuariosService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() panelTitle = 'Listado de Usuarios';
  @Output() editarUsuario = new EventEmitter<Usuario>();
  @Output() gestionarControlUso = new EventEmitter<Usuario>();

  usuarios: Usuario[] = [];
  filtrados: Usuario[] = [];
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

    const isControlProcesos = this.panelTitle === 'Control de Procesos';
    const observable = isControlProcesos
      ? this.service.consultarUsuariosControlUso()
      : this.service.consultarUsuarios();

    observable.subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          this.usuarios = resp.response?.usuarios ?? [];
          this.totalItems = this.usuarios.length;
          this.filtrar();
          this.isLoading = false;
          this.cdr.detectChanges();

          if (showSuccessMessage) {
            Swal.fire({
              title: '¡Éxito!',
              text: resp.response?.mensaje || 'Usuarios consultados exitosamente',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } else {
          this.usuarios = [];
          this.filtrados = [];
          this.totalItems = 0;
          this.isLoading = false;
          this.cdr.detectChanges();

          Swal.fire({
            title: 'Información',
            text: resp.response?.mensaje || 'No se encontraron usuarios',
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
    if (!Array.isArray(this.usuarios)) {
      this.usuarios = [];
      this.filtrados = [];
      return;
    }

    if (!this.searchTerm.trim()) {
      this.filtrados = [...this.usuarios];
    } else {
      const t = this.searchTerm.toLowerCase();
      this.filtrados = this.usuarios.filter(
        (u) =>
          u.Cr_Nombre_Usuario?.toLowerCase().includes(t) ||
          u.Cr_Pe_Codigo?.Pe_Documento?.toLowerCase().includes(t) ||
          u.Cr_Pe_Codigo?.Pe_Nombre?.toLowerCase().includes(t) ||
          u.Cr_Pe_Codigo?.Pe_Apellido?.toLowerCase().includes(t) ||
          u.Cr_Pe_Codigo?.Pe_Correo?.toLowerCase().includes(t) ||
          u.Cr_Pe_Codigo?.Pe_Cel?.toLowerCase().includes(t) ||
          u.Cr_Perfil?.toLowerCase().includes(t) ||
          u.Cr_Empresa?.toLowerCase().includes(t) ||
          u.Cr_Pe_Codigo?.Pe_Permiso?.toLowerCase().includes(t) ||
          u.Cr_Ips?.NOMBRE_IPS?.toLowerCase().includes(t)
      );
    }
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.filtrar();
  }

  get paginados(): Usuario[] {
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

  trackById(_i: number, item: Usuario): string {
    return item._id;
  }

  onEditarUsuario(usuario: Usuario): void {
    if (this.panelTitle === 'Control de Procesos') {
      this.gestionarControlUso.emit(usuario);
    } else {
      this.editarUsuario.emit(usuario);
    }
  }

  verDetalle(usuario: Usuario): void {
    let html = '<div class="container-fluid">';

    const persona = usuario.Cr_Pe_Codigo;

    // Información Básica
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-primary text-white">';
    html += '<h6 class="mb-0">Información Básica</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const nombreCompleto = `${persona.Pe_Nombre} ${persona.Pe_Apellido} ${persona.Pe_Seg_Apellido || ''}`.trim();

    const basicFields = [
      { label: 'Nombre Completo', value: nombreCompleto },
      { label: 'Tipo Documento', value: persona.Pe_Tipo_Documento },
      { label: 'Documento', value: persona.Pe_Documento },
      { label: 'Correo Electrónico', value: persona.Pe_Correo },
      { label: 'Celular', value: persona.Pe_Cel },
      { label: 'Teléfono Fijo', value: persona.Pe_Telefons_Fijo },
      { label: 'Perfil', value: usuario.Cr_Perfil, isBadge: true },
      { label: 'Estado', value: usuario.Cr_Estado, isStateBadge: true },
      { label: 'Usuario de Acceso', value: usuario.Cr_Nombre_Usuario },
      { label: 'Permisos', value: persona.Pe_Permiso }
    ];

    basicFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;

      if (field.isBadge) {
        const badgeClass = this.getPerfilBadgeClass(field.value as string);
        html += `<span class="badge ${badgeClass}" style="font-size: 1em;">${field.value}</span>`;
      } else if (field.isStateBadge) {
        const badgeClass = field.value === 'Activo' ? 'bg-success' : 'bg-danger';
        html += `<span class="badge ${badgeClass}" style="font-size: 1em;">${field.value}</span>`;
      } else {
        html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      }
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información de Ubicación
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-info text-white">';
    html += '<h6 class="mb-0">Información de Ubicación</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const locationFields = [
      { label: 'Dirección', value: persona.Pe_Direccion },
      { label: 'Ciudad', value: persona.Pe_Ciudad },
      { label: 'Departamento', value: persona.Pe_Departamento }
    ];

    locationFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    // Información de Empresa/IPS
    if (usuario.Cr_Empresa || usuario.Cr_Ips) {
      html += '<div class="card mb-3">';
      html += '<div class="card-header bg-warning text-dark">';
      html += '<h6 class="mb-0">Información de Empresa/IPS</h6>';
      html += '</div>';
      html += '<div class="card-body">';
      html += '<div class="row">';

      if (usuario.Cr_Ips) {
        const ips = usuario.Cr_Ips;
        html += `<div class="col-md-6 mb-2 p-2">`;
        html += `<strong class="text-muted">Nombre IPS:</strong><br>`;
        html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${ips.NOMBRE_IPS || 'N/A'}</span>`;
        html += `</div>`;
        html += `<div class="col-md-6 mb-2 p-2">`;
        html += `<strong class="text-muted">NIT:</strong><br>`;
        html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${ips.NIT || 'N/A'}</span>`;
        html += `</div>`;
        html += `<div class="col-md-6 mb-2 p-2">`;
        html += `<strong class="text-muted">Ciudad IPS:</strong><br>`;
        html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${ips.CIUDAD || 'N/A'}</span>`;
        html += `</div>`;
      } else if (usuario.Cr_Empresa) {
        html += `<div class="col-md-6 mb-2 p-2">`;
        html += `<strong class="text-muted">Empresa:</strong><br>`;
        html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${usuario.Cr_Empresa}</span>`;
        html += `</div>`;
      }

      html += '</div></div></div>';
    }

    // Información Adicional
    html += '<div class="card mb-3">';
    html += '<div class="card-header bg-secondary text-white">';
    html += '<h6 class="mb-0">Información del Sistema</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="row">';

    const additionalFields = [
      { label: 'ID de Usuario', value: usuario._id },
      { label: 'ID de Persona', value: persona._id },
      {
        label: 'Fecha de Creación',
        value: usuario.createdAt ? new Date(usuario.createdAt).toLocaleDateString('es-CO') : 'N/A'
      },
      {
        label: 'Última Actualización',
        value: usuario.updatedAt ? new Date(usuario.updatedAt).toLocaleDateString('es-CO') : 'N/A'
      }
    ];

    additionalFields.forEach((field) => {
      html += `<div class="col-md-6 mb-2 p-2">`;
      html += `<strong class="text-muted">${field.label}:</strong><br>`;
      html += `<span class="text-dark" style="font-size: 1.1em; font-family: monospace;">${field.value || 'N/A'}</span>`;
      html += `</div>`;
    });

    html += '</div></div></div>';

    html += '</div>';

    Swal.fire({
      title: `Usuario - ${nombreCompleto}`,
      html: html,
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar'
    });
  }

  exportarExcel(): void {
    if (this.filtrados.length === 0) {
      Swal.fire({
        title: 'Sin Datos',
        text: 'No hay usuarios para exportar',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const isControlProcesos = this.panelTitle === 'Control de Procesos';

    const datosExport = this.filtrados.map((usuario) => {
      const persona = usuario.Cr_Pe_Codigo;
      const baseData: any = {
        Nombre: persona.Pe_Nombre,
        Apellido: persona.Pe_Apellido,
        'Segundo Apellido': persona.Pe_Seg_Apellido || 'N/A',
        Documento: persona.Pe_Documento,
        Correo: persona.Pe_Correo,
        Celular: persona.Pe_Cel,
        Perfil: usuario.Cr_Perfil,
        Estado: usuario.Cr_Estado,
        'Usuario Acceso': usuario.Cr_Nombre_Usuario,
        Permisos: persona.Pe_Permiso,
        Ciudad: persona.Pe_Ciudad,
        Departamento: persona.Pe_Departamento,
        'IPS/Empresa': usuario.Cr_Ips?.NOMBRE_IPS || usuario.Cr_Empresa || 'N/A'
      };

      if (isControlProcesos) {
        baseData['# Casos'] = usuario.control_uso?.co_cantidad || 0;
        baseData['Estado Control'] = usuario.control_uso?.co_estado ? 'Activo' : 'Inactivo';
        baseData['Fecha Registro'] = usuario.control_uso?.co_fecha_registro || 'sin gestion';
        baseData['Hora Registro'] = usuario.control_uso?.co_hora_registro || 'sin gestion';
      }

      return baseData;
    });

    const ws = XLSX.utils.json_to_sheet(datosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

    const fecha = new Date().toISOString().split('T')[0];
    const filename = isControlProcesos ? `control_procesos_${fecha}.xlsx` : `usuarios_${fecha}.xlsx`;
    XLSX.writeFile(wb, filename);

    Swal.fire({
      title: '¡Exportación Exitosa!',
      text: `Se han exportado ${datosExport.length} registros`,
      icon: 'success',
      confirmButtonText: 'Entendido'
    });
  }

  getPerfilBadgeClass(perfil: string): string {
    switch (perfil?.toLowerCase()) {
      case 'administrador':
        return 'bg-danger';
      case 'supervisor':
        return 'bg-warning';
      case 'supervisor_psicologia':
      case 'supervisor psicologia':
        return 'bg-info';
      case 'psicologo':
      case 'psicólogo':
      case 'psicologo supervisor':
      case 'psicólogo supervisor':
      case 'psicologo-supervisor':
      case 'psicólogo-supervisor':
        return 'bg-primary';
      case 'usuario':
        return 'bg-success';
      case 'cliente':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }
}
