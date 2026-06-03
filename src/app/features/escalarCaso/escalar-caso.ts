import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/auth.service';
import { MesaAyudaService } from '../mesaAyuda/mesa-ayuda.service';

@Component({
  selector: 'app-escalar-caso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './escalar-caso.html',
  styleUrls: ['./escalar-caso.css']
})
export class EscalarCaso implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly mesaAyudaService = inject(MesaAyudaService);

  form!: FormGroup;
  submitted = false;
  isLoading = false;
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  errorImagen: string = '';

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initForm(): void {
    this.form = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(100), Validators.maxLength(5000)]],
      prioridad: ['', Validators.required]
    });
  }

  /**
   * Getter para acceder a los controles del formulario
   */
  get f() {
    return this.form.controls;
  }

  /**
   * Maneja la selección de archivo de imagen
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorImagen = '';
    this.imagenSeleccionada = null;
    this.imagenPreview = null;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      this.errorImagen = 'Solo se permiten imágenes JPG y PNG';
      input.value = '';
      return;
    }

    // Validar tamaño
    if (file.size > maxBytes) {
      this.errorImagen = 'La imagen no puede superar 5 MB';
      input.value = '';
      return;
    }

    // Guardar archivo y crear preview
    this.imagenSeleccionada = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenPreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Elimina la imagen seleccionada
   */
  eliminarImagen(): void {
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.errorImagen = '';

    // Limpiar el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Envía el formulario
   */
  submit(): void {
    this.submitted = true;

    // Validar formulario
    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Por favor complete todos los campos requeridos correctamente.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Autenticación',
        text: 'No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.isLoading = true;

    // Construir FormData
    const formData = new FormData();
    formData.append('descripcion', this.form.value.descripcion.trim());
    formData.append('prioridad', this.form.value.prioridad);
    formData.append('usuario_id', userId);

    if (this.imagenSeleccionada) {
      formData.append('evidencia', this.imagenSeleccionada, this.imagenSeleccionada.name);
    }

    // Enviar al servicio
    this.mesaAyudaService.escalarCaso(formData).subscribe({
      next: (resp) => {
        this.isLoading = false;
        if (resp.error === 0) {
          Swal.fire({
            icon: 'success',
            title: 'Caso Escalado',
            text: resp.response?.mensaje || 'El caso ha sido escalado exitosamente a Mesa de Ayuda',
            confirmButtonText: 'Entendido'
          });
          this.resetForm();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al Escalar',
            text: resp.response?.mensaje || 'No se pudo escalar el caso',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        let msg = 'No se pudo conectar con el servidor.';
        if (err.status === 401) {
          msg = 'Sesión expirada. Por favor inicie sesión nuevamente.';
        } else if (err.status === 413) {
          msg = 'El archivo de evidencia excede el tamaño máximo permitido (5 MB).';
        } else if (err.error?.response?.mensaje) {
          msg = err.error.response.mensaje;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error de Conexión',
          text: msg,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Reinicia el formulario
   */
  private resetForm(): void {
    this.form.reset();
    this.submitted = false;
    this.eliminarImagen();
    this.form.patchValue({ prioridad: '' });
  }

  /**
   * Cancela y limpia el formulario
   */
  cancelar(): void {
    if (this.form.dirty) {
      Swal.fire({
        icon: 'question',
        title: '¿Cancelar?',
        text: '¿Está seguro que desea cancelar? Se perderán los datos ingresados.',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, continuar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetForm();
        }
      });
    } else {
      this.resetForm();
    }
  }
}
