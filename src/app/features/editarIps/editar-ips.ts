import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditarIpsService } from './editar-ips.service';
import { Ips } from '../listadoIps/listado-ips.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-ips',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-ips.html'
})
export class EditarIps implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly editarIpsService = inject(EditarIpsService);

  @Input() ips: Ips | null = null;
  @Output() volverListado = new EventEmitter<void>();

  readonly form = this.fb.group({
    NOMBRE_IPS: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    NIT: this.fb.control('', [Validators.required]),
    DIRECCION: this.fb.control('', [Validators.required, Validators.maxLength(200)]),
    TELEFONO: this.fb.control('', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]),
    CORREO: this.fb.control('', [Validators.required, Validators.email]),
    REPRESENTANTE: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    CIUDAD: this.fb.control('', [Validators.required, Validators.maxLength(50)]),
    DEPARTAMENTO: this.fb.control('', [Validators.required]),
    REGIONAL: this.fb.control('', [Validators.required]),
    ESTADO: this.fb.control<'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA'>('ACTIVA', [Validators.required]),
    tipo_atencion: this.fb.control('', [Validators.required]),
    especialidades: this.fb.array<string>([]),
    horario_atencion: this.fb.control('', [Validators.required]),
    nivel_complejidad: this.fb.control('', [Validators.required])
  });

  submitted = false;
  isLoading = false;

  regionales = [
    'Regional Norte',
    'Regional Sur',
    'Regional Oriente',
    'Regional Occidente',
    'Regional Centro',
    'Regional Caribe',
    'Regional Pacífico',
    'Regional Amazonía'
  ];
  estados: Array<'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA'> = ['ACTIVA', 'SUSPENDIDA', 'CANCELADA'];
  tiposAtencion = [
    'Ambulatoria',
    'Hospitalaria',
    'Urgencias',
    'Domiciliaria',
    'Cirugía',
    'Consulta Externa',
    'Hospitalización'
  ];
  especialidades = [
    'Medicina General',
    'Pediatría',
    'Ginecología',
    'Cardiología',
    'Neurología',
    'Ortopedia',
    'Dermatología',
    'Psiquiatría',
    'Oftalmología',
    'Otorrinolaringología'
  ];
  nivelesComplejidad = ['I', 'II', 'III', 'IV'];
  horariosAtencion = [
    '24 Horas',
    '6:00 AM - 6:00 PM',
    '7:00 AM - 7:00 PM',
    '8:00 AM - 5:00 PM',
    '8:00 AM - 6:00 PM',
    'Lunes a Viernes 8:00 AM - 5:00 PM',
    'Lunes a Sábado 7:00 AM - 6:00 PM'
  ];

  get especialidadesArray(): FormArray {
    return this.form.get('especialidades') as FormArray;
  }

  ngOnInit(): void {
    if (this.ips) {
      this.cargarDatosIps();
    }
  }

  cargarDatosIps(): void {
    if (!this.ips) return;

    this.form.patchValue({
      NOMBRE_IPS: this.ips.NOMBRE_IPS || '',
      NIT: this.ips.NIT || '',
      DIRECCION: this.ips.DIRECCION || '',
      TELEFONO: this.ips.TELEFONO || '',
      CORREO: this.ips.CORREO || '',
      REPRESENTANTE: this.ips.REPRESENTANTE || '',
      CIUDAD: this.ips.CIUDAD || '',
      DEPARTAMENTO: this.ips.DEPARTAMENTO || '',
      REGIONAL: this.ips.REGIONAL || '',
      ESTADO: this.ips.ESTADO as 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA',
      tipo_atencion: this.ips.COMPLEMENTARIA_1?.tipo_atencion || '',
      horario_atencion: this.ips.COMPLEMENTARIA_2?.horario_atencion || '',
      nivel_complejidad: this.ips.COMPLEMENTARIA_2?.nivel_complejidad || ''
    });

    // Cargar especialidades
    if (this.ips.COMPLEMENTARIA_1?.especialidades && Array.isArray(this.ips.COMPLEMENTARIA_1.especialidades)) {
      this.especialidadesArray.clear();
      this.ips.COMPLEMENTARIA_1.especialidades.forEach((esp) => {
        this.especialidadesArray.push(this.fb.control(esp));
      });
    }
  }

  onEspecialidadChange(especialidad: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    if (input.checked) {
      this.especialidadesArray.push(this.fb.control(especialidad));
      return;
    }

    const index = this.especialidadesArray.controls.findIndex((x) => x.value === especialidad);
    if (index >= 0) {
      this.especialidadesArray.removeAt(index);
    }
  }

  isEspecialidadSelected(especialidad: string): boolean {
    return (this.especialidadesArray.value as string[]).includes(especialidad);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.especialidadesArray.length === 0) {
      Swal.fire({
        title: 'Formulario Incompleto',
        text: 'Por favor, seleccione al menos una especialidad.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (this.form.invalid) {
      this.markFormGroupTouched();
      Swal.fire({
        title: 'Formulario Incompleto',
        text: 'Por favor, complete todos los campos requeridos.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!this.ips?._id) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo identificar la IPS a actualizar',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.isLoading = true;

    const v = this.form.getRawValue();
    const payload = {
      id: this.ips._id,
      NOMBRE_IPS: v.NOMBRE_IPS,
      NIT: v.NIT,
      DIRECCION: v.DIRECCION,
      TELEFONO: v.TELEFONO,
      CORREO: v.CORREO,
      REPRESENTANTE: v.REPRESENTANTE,
      CIUDAD: v.CIUDAD,
      DEPARTAMENTO: v.DEPARTAMENTO,
      REGIONAL: v.REGIONAL,
      ESTADO: v.ESTADO,
      COMPLEMENTARIA_1: {
        tipo_atencion: v.tipo_atencion,
        especialidades: v.especialidades as string[]
      },
      COMPLEMENTARIA_2: {
        horario_atencion: v.horario_atencion,
        nivel_complejidad: v.nivel_complejidad
      }
    };

    this.editarIpsService.actualizarIps(payload).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.error === 0) {
          Swal.fire({
            title: '¡Éxito!',
            text: response.response?.mensaje || 'IPS actualizada exitosamente',
            icon: 'success',
            confirmButtonText: 'Continuar'
          }).then(() => {
            this.volverAlListado();
          });
          return;
        }

        Swal.fire({
          title: 'Error',
          text: response.response?.mensaje || 'Error al actualizar la IPS',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      },
      error: () => {
        this.isLoading = false;
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  volverAlListado(): void {
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
        this.volverAlListado();
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['email']) return 'Ingrese un email válido';
      if (field.errors['pattern']) {
        if (fieldName === 'TELEFONO') return 'Ingrese un teléfono válido';
      }
      if (field.errors['maxlength'])
        return `Máximo ${(field.errors['maxlength'] as { requiredLength: number }).requiredLength} caracteres`;
    }
    return '';
  }
}
