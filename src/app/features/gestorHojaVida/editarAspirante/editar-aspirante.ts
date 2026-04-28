import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { HojaVidaService } from '../hoja-vida.service';

@Component({
  selector: 'app-editar-aspirante',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-aspirante.html'
})
export class EditarAspirante implements OnInit {
  private readonly service = inject(HojaVidaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  @Input() aspirante: any = null;
  @Output() volverListado = new EventEmitter<void>();

  form: FormGroup;
  submitted = false;

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
    if (this.aspirante) {
      this.cargarDatos();
    }
  }

  get f() {
    return this.form.controls;
  }

  cargarDatos(): void {
    // Formatear fecha de nacimiento
    let fechaNac = '';
    if (this.aspirante.FECH_NACIMIENTO) {
      const date = new Date(this.aspirante.FECH_NACIMIENTO);
      fechaNac = date.toISOString().split('T')[0];
    }

    // Formatear fecha de inscripción
    let fechaIns = '';
    if (this.aspirante.FECHA_INSCRIPCION) {
      if (this.aspirante.FECHA_INSCRIPCION.includes('-') && this.aspirante.FECHA_INSCRIPCION.split('-')[0].length === 2) {
        const parts = this.aspirante.FECHA_INSCRIPCION.split('-');
        fechaIns = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        const date = new Date(this.aspirante.FECHA_INSCRIPCION);
        fechaIns = date.toISOString().split('T')[0];
      }
    }

    // Normalizar valores de selects
    const genero = this.generos.includes(this.aspirante.GENERO) ? this.aspirante.GENERO : 'Masculino';
    const estado = this.estados.includes(this.aspirante.ESTADO) ? this.aspirante.ESTADO : 'Inscrito';
    const estrato = this.estratos.includes(String(this.aspirante.ESTRATO)) ? String(this.aspirante.ESTRATO) : '3';
    const tipoMedio = this.tiposMedio.includes(this.aspirante.TIPO_MEDIO) ? this.aspirante.TIPO_MEDIO : 'Web';
    const grupMino = this.gruposMinoritarios.includes(this.aspirante.GRUP_MINO) ? this.aspirante.GRUP_MINO : 'Ninguno';
    const numePeriacad = ['1', '2'].includes(String(this.aspirante.NUMEPERIACAD)) ? String(this.aspirante.NUMEPERIACAD) : '1';

    this.form.patchValue({
      numeroCurso: this.aspirante.NUMERO_CURSO || '',
      tipoCurso: this.aspirante.TIPO_CURSO || '',
      codiProgAcad: this.aspirante.CODIPROGACAD || '',
      annoPeriacad: this.aspirante.ANNOPERIACAD || new Date().getFullYear(),
      numePeriacad: numePeriacad,
      codigoInscripcion: this.aspirante.CODIGO_INSCRIPCION || '',
      documento: this.aspirante.DOCUMENTO || '',
      nombre: this.aspirante.NOMBRE || '',
      primerApellido: this.aspirante.PRIMER_APELLIDO || '',
      segundoApellido: this.aspirante.SEGUNDO_APELLIDO || '',
      edad: this.aspirante.EDAD || '',
      genero: genero,
      fechNacimiento: fechaNac,
      departamentoNacimiento: this.aspirante.DEPARTAMENTO_NACIMIENTO || '',
      ciudadNacimiento: this.aspirante.CIUDAD_NACIMIENTO || '',
      correo: this.aspirante.CORREO || '',
      telefono: this.aspirante.TELEFONO || '',
      celular: this.aspirante.CELULAR || '',
      direccion: this.aspirante.DIRECCION || '',
      ciudad: this.aspirante.CIUDAD || '',
      estado: estado,
      departamento: this.aspirante.DEPARTAMENTO || '',
      regional: this.aspirante.REGIONAL || '',
      complementaria1: this.aspirante.COMPLEMENTARIA_1 || '',
      complementaria2: this.aspirante.COMPLEMENTARIA_2 || '',
      fechaInscripcion: fechaIns || new Date().toISOString().split('T')[0],
      grupMino: grupMino,
      estrato: estrato,
      tipoMedio: tipoMedio,
      colegio: this.aspirante.COLEGIO || ''
    });

    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  regresar(): void {
    this.volverListado.emit();
  }

  cancelar(): void {
    Swal.fire({
      title: '¿Cancelar edición?',
      text: 'Los cambios no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar editando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.regresar();
      }
    });
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

    if (!this.aspirante || !this.aspirante._id) {
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
        this.service.updateHojaVida(this.aspirante._id, hojaVida).subscribe({
          next: (resp) => {
            if (resp.error === 0 || resp.error === '0') {
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Aspirante actualizado correctamente',
                timer: 2000,
                showConfirmButton: false
              });
              this.volverListado.emit();
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
}
