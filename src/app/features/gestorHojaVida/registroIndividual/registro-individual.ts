import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { HojaVidaService } from '../hoja-vida.service';

@Component({
  selector: 'app-registro-individual',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-individual.html'
})
export class RegistroIndividual implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly hojaVidaService = inject(HojaVidaService);

  form: FormGroup;
  submitted = false;

  generos = ['Masculino', 'Femenino', 'Otro'];
  estados = ['Activo', 'Pendiente', 'Rechazado', 'Admitido'];
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
      estado: ['Activo', [Validators.required]],
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

  ngOnInit(): void {}

  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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

    const validation = this.hojaVidaService.validateHojaVida(hojaVida);
    if (!validation.isValid) {
      Swal.fire({
        icon: 'error',
        title: 'Errores de validación',
        html: validation.errors.join('<br>')
      });
      return;
    }

    this.hojaVidaService.register(hojaVida).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Hoja de vida registrada correctamente'
        });
        this.limpiar();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al registrar la hoja de vida: ' + (error.error?.message || error.message)
        });
      }
    });
  }

  limpiar(): void {
    this.form.reset();
    this.submitted = false;
    this.form.patchValue({
      annoPeriacad: new Date().getFullYear(),
      numePeriacad: '1',
      genero: 'Masculino',
      estado: 'Activo',
      grupMino: 'Ninguno',
      estrato: '3',
      tipoMedio: 'Web',
      fechaInscripcion: new Date().toISOString().split('T')[0]
    });
  }
}
