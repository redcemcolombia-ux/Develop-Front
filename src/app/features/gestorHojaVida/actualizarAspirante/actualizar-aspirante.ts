import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { HojaVidaService } from '../hoja-vida.service';

@Component({
  selector: 'app-actualizar-aspirante',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './actualizar-aspirante.html'
})
export class ActualizarAspirante implements OnInit {
  private readonly service = inject(HojaVidaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  aspirantes: any[] = [];
  filtrados: any[] = [];
  isLoading = false;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  Math = Math;

  // Variables para el modal de edición
  showModal = false;
  form: FormGroup;
  submitted = false;
  aspiranteActual: any = null;

  generos = ['Masculino', 'Femenino', 'Otro'];
  estados = ['Inscrito', 'Abandono', 'Activo', 'EN GESTION', 'GESTIONADO'];
  estratos = ['1', '2', '3', '4', '5', '6'];
  tiposMedio = ['Radio', 'TV', 'Web', 'Prensa', 'Redes Sociales', 'Referido'];
  gruposMinoritarios = ['Ninguno', 'Étnico', 'Indígena', 'Afrodescendiente', 'ROM', 'Otro'];
  regionales = ['Regional Oriente', 'Regional Caribe', 'Regional Centro', 'Regional Occidente', 'Regional Sur'];

  constructor() {
    this.form = this.fb.group({
      numeroCurso: ['', [Validators.required]],
      tipoCurso: ['', [Validators.required]],
      codiProgAcad: ['', [Validators.required]],
      annoPeriacad: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2030)]],
      numePeriacad: ['1', [Validators.required]],
      codigoInscripcion: ['', [Validators.required]],
      documento: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\-\.]+$/)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      primerApellido: ['', [Validators.required, Validators.maxLength(50)]],
      segundoApellido: ['', [Validators.maxLength(50)]],
      edad: ['', [Validators.required, Validators.min(16), Validators.max(35)]],
      genero: ['Masculino', [Validators.required]],
      fechNacimiento: ['', [Validators.required]],
      departamentoNacimiento: ['', [Validators.required]],
      ciudadNacimiento: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^\d{7,12}$/)]],
      celular: ['', [Validators.required, Validators.pattern(/^\d{7,12}$/)]],
      direccion: ['', [Validators.required, Validators.maxLength(200)]],
      ciudad: ['', [Validators.required]],
      estado: ['Inscrito', [Validators.required]],
      departamento: ['', [Validators.required]],
      regional: ['', [Validators.required]],
      complementaria1: ['', [Validators.maxLength(200)]],
      complementaria2: ['', [Validators.maxLength(200)]],
      fechaInscripcion: [new Date().toISOString().split('T')[0], [Validators.required]],
      grupMino: ['Ninguno'],
      estrato: ['3', [Validators.required]],
      tipoMedio: ['Web', [Validators.required]],
      colegio: ['', [Validators.required, Validators.maxLength(150)]]
    });
  }

  ngOnInit(): void {
    this.consultar(false);
  }

  get f() {
    return this.form.controls;
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
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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
        return 'bg-warning';
      case 'GESTIONADO':
        return 'bg-info';
      case 'ABANDONO':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  abrirModalEdicion(aspirante: any): void {
    this.aspiranteActual = aspirante;
    this.submitted = false;

    // Formatear fecha de nacimiento
    let fechaNac = '';
    if (aspirante.FECH_NACIMIENTO) {
      const date = new Date(aspirante.FECH_NACIMIENTO);
      fechaNac = date.toISOString().split('T')[0];
    }

    // Formatear fecha de inscripción
    let fechaIns = '';
    if (aspirante.FECHA_INSCRIPCION) {
      // Si viene en formato DD-MM-YYYY convertir a YYYY-MM-DD
      if (aspirante.FECHA_INSCRIPCION.includes('-') && aspirante.FECHA_INSCRIPCION.split('-')[0].length === 2) {
        const parts = aspirante.FECHA_INSCRIPCION.split('-');
        fechaIns = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        const date = new Date(aspirante.FECHA_INSCRIPCION);
        fechaIns = date.toISOString().split('T')[0];
      }
    }

    this.form.patchValue({
      numeroCurso: aspirante.NUMERO_CURSO || '',
      tipoCurso: aspirante.TIPO_CURSO || '',
      codiProgAcad: aspirante.CODIPROGACAD || '',
      annoPeriacad: aspirante.ANNOPERIACAD || new Date().getFullYear(),
      numePeriacad: aspirante.NUMEPERIACAD || '1',
      codigoInscripcion: aspirante.CODIGO_INSCRIPCION || '',
      documento: aspirante.DOCUMENTO || '',
      nombre: aspirante.NOMBRE || '',
      primerApellido: aspirante.PRIMER_APELLIDO || '',
      segundoApellido: aspirante.SEGUNDO_APELLIDO || '',
      edad: aspirante.EDAD || '',
      genero: aspirante.GENERO || 'Masculino',
      fechNacimiento: fechaNac,
      departamentoNacimiento: aspirante.DEPARTAMENTO_NACIMIENTO || '',
      ciudadNacimiento: aspirante.CIUDAD_NACIMIENTO || '',
      correo: aspirante.CORREO || '',
      telefono: aspirante.TELEFONO || '',
      celular: aspirante.CELULAR || '',
      direccion: aspirante.DIRECCION || '',
      ciudad: aspirante.CIUDAD || '',
      estado: aspirante.ESTADO || 'Inscrito',
      departamento: aspirante.DEPARTAMENTO || '',
      regional: aspirante.REGIONAL || '',
      complementaria1: aspirante.COMPLEMENTARIA_1 || '',
      complementaria2: aspirante.COMPLEMENTARIA_2 || '',
      fechaInscripcion: fechaIns || new Date().toISOString().split('T')[0],
      grupMino: aspirante.GRUP_MINO || 'Ninguno',
      estrato: aspirante.ESTRATO || '3',
      tipoMedio: aspirante.TIPO_MEDIO || 'Web',
      colegio: aspirante.COLEGIO || ''
    });

    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.aspiranteActual = null;
    this.form.reset();
    this.submitted = false;
  }

  guardarCambios(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    if (!this.aspiranteActual || !this.aspiranteActual._id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar el aspirante a actualizar'
      });
      return;
    }

    const hojaVida = {
      NUMERO_CURSO: this.f['numeroCurso'].value,
      TIPO_CURSO: this.f['tipoCurso'].value,
      CODIPROGACAD: this.f['codiProgAcad'].value,
      ANNOPERIACAD: this.f['annoPeriacad'].value,
      NUMEPERIACAD: this.f['numePeriacad'].value,
      CODIGO_INSCRIPCION: this.f['codigoInscripcion'].value,
      DOCUMENTO: this.f['documento'].value,
      NOMBRE: this.f['nombre'].value,
      PRIMER_APELLIDO: this.f['primerApellido'].value,
      SEGUNDO_APELLIDO: this.f['segundoApellido'].value,
      EDAD: this.f['edad'].value,
      GENERO: this.f['genero'].value,
      FECH_NACIMIENTO: this.f['fechNacimiento'].value,
      DEPARTAMENTO_NACIMIENTO: this.f['departamentoNacimiento'].value,
      CIUDAD_NACIMIENTO: this.f['ciudadNacimiento'].value,
      CORREO: this.f['correo'].value,
      TELEFONO: this.f['telefono'].value,
      CELULAR: this.f['celular'].value,
      DIRECCION: this.f['direccion'].value,
      CIUDAD: this.f['ciudad'].value,
      ESTADO: this.f['estado'].value,
      DEPARTAMENTO: this.f['departamento'].value,
      REGIONAL: this.f['regional'].value,
      COMPLEMENTARIA_1: this.f['complementaria1'].value,
      COMPLEMENTARIA_2: this.f['complementaria2'].value,
      FECHA_INSCRIPCION: this.f['fechaInscripcion'].value,
      GRUP_MINO: this.f['grupMino'].value,
      ESTRATO: this.f['estrato'].value,
      TIPO_MEDIO: this.f['tipoMedio'].value,
      COLEGIO: this.f['colegio'].value
    };

    const validation = this.service.validateHojaVida(hojaVida);
    if (!validation.isValid) {
      Swal.fire({
        icon: 'error',
        title: 'Errores de validación',
        html: validation.errors.join('<br>')
      });
      return;
    }

    Swal.fire({
      title: '¿Actualizar aspirante?',
      text: `Se actualizará la información de ${hojaVida.NOMBRE} ${hojaVida.PRIMER_APELLIDO}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.updateHojaVida(this.aspiranteActual._id, hojaVida).subscribe({
          next: (resp) => {
            if (resp.error === 0 || resp.error === '0') {
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Aspirante actualizado correctamente',
                timer: 2000,
                showConfirmButton: false
              });
              this.cerrarModal();
              this.consultar(false);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: resp.response?.mensaje || resp.mensaje || 'Error al actualizar el aspirante'
              });
            }
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al actualizar el aspirante: ' + (error.error?.message || error.message)
            });
          }
        });
      }
    });
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
      'Correo': a.CORREO || '',
      'Teléfono': a.TELEFONO || '',
      'Celular': a.CELULAR || '',
      'Ciudad': a.CIUDAD || '',
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
