import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { HojaVidaService } from '../hoja-vida.service';

@Component({
  selector: 'app-actualizar-aspirante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actualizar-aspirante.html'
})
export class ActualizarAspirante implements OnInit {
  private readonly service = inject(HojaVidaService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Output() editarAspirante = new EventEmitter<any>();

  aspirantes: any[] = [];
  filtrados: any[] = [];
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
        if (resp.error === 0 || resp.error === '0') {
          const datos = resp.response?.data || resp.data || resp.response || [];
          this.aspirantes = Array.isArray(datos) ? datos : [];
          this.totalItems = this.aspirantes.length;
          this.filtrar();
          this.isLoading = false;
          this.cdr.detectChanges();

          if (showSuccessMessage && this.aspirantes.length > 0) {
            Swal.fire({
              title: 'Éxito',
              text: `Se encontraron ${this.aspirantes.length} aspirantes`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } else {
          this.aspirantes = [];
          this.filtrados = [];
          this.totalItems = 0;
          this.isLoading = false;
          this.cdr.detectChanges();

          Swal.fire({
            title: 'Información',
            text: resp.response?.mensaje || 'No se encontraron aspirantes',
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
    if (!Array.isArray(this.aspirantes)) {
      this.aspirantes = [];
      this.filtrados = [];
      return;
    }

    if (!this.searchTerm.trim()) {
      this.filtrados = [...this.aspirantes];
    } else {
      const t = this.searchTerm.toLowerCase();
      this.filtrados = this.aspirantes.filter(
        (a) =>
          a.DOCUMENTO?.toLowerCase().includes(t) ||
          a.NOMBRE?.toLowerCase().includes(t) ||
          a.PRIMER_APELLIDO?.toLowerCase().includes(t) ||
          a.SEGUNDO_APELLIDO?.toLowerCase().includes(t) ||
          a.CORREO?.toLowerCase().includes(t) ||
          a.CIUDAD?.toLowerCase().includes(t) ||
          a.DEPARTAMENTO?.toLowerCase().includes(t) ||
          a.ESTADO?.toLowerCase().includes(t) ||
          a.REGIONAL?.toLowerCase().includes(t)
      );
    }
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.filtrar();
  }

  get paginados(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filtrados.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filtrados.length / this.itemsPerPage);
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
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  trackById(_i: number, item: any): string {
    return item._id;
  }

  getEstadoBadgeClass(estado: string): string {
    if (!estado) return 'bg-secondary';
    const e = estado.toUpperCase();
    switch (e) {
      case 'INSCRITO':
      case 'ACTIVO':
        return 'bg-success';
      case 'EN GESTION':
        return 'bg-primary';
      case 'GESTIONADO':
        return 'bg-info';
      case 'ABANDONO':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  seleccionarAspirante(aspirante: any): void {
    this.editarAspirante.emit(aspirante);
  }

  exportarExcel(): void {
    if (this.filtrados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay datos para exportar'
      });
      return;
    }

    const datosExcel = this.filtrados.map(a => ({
      'Documento': a.DOCUMENTO || '',
      'Nombre Completo': `${a.NOMBRE || ''} ${a.PRIMER_APELLIDO || ''} ${a.SEGUNDO_APELLIDO || ''}`.trim(),
      'Teléfono': a.TELEFONO || '',
      'Celular': a.CELULAR || '',
      'Departamento': a.DEPARTAMENTO || '',
      'Regional': a.REGIONAL || '',
      'Estado': a.ESTADO || '',
      'Edad': a.EDAD || '',
      'Género': a.GENERO || '',
      'Colegio': a.COLEGIO || '',
      'Estrato': a.ESTRATO || '',
      'Fecha Inscripción': a.FECHA_INSCRIPCION || ''
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aspirantes');

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Aspirantes_${fecha}.xlsx`;

    XLSX.writeFile(wb, nombreArchivo);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: `Se han exportado ${datosExcel.length} registros`,
      timer: 2000,
      showConfirmButton: false
    });
  }
}
