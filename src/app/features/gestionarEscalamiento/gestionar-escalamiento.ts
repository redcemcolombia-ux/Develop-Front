import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/auth.service';
import { MesaAyudaService, CasoEscalado } from '../mesaAyuda/mesa-ayuda.service';

@Component({
  selector: 'app-gestionar-escalamiento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestionar-escalamiento.html'
})
export class GestionarEscalamiento implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly mesaAyudaService = inject(MesaAyudaService);
  private readonly sanitizer = inject(DomSanitizer);

  @Input() caso: CasoEscalado | null = null;
  @Output() volverGestor = new EventEmitter<void>();

  form!: FormGroup;
  submitted = false;
  isLoading = false;
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  errorImagen: string = '';

  // Para la evidencia cargada del backend
  evidenciaCargando = false;
  evidenciaUrl: SafeUrl | null = null;
  evidenciaError: string = '';

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['caso'] && this.caso?.evidencia_url && this.caso?._id) {
      this.cargarImagenEvidencia();
    }
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initForm(): void {
    this.form = this.fb.group({
      respuesta: ['', [Validators.minLength(20), Validators.maxLength(5000)]], // Opcional ahora
      estadoFinal: ['', Validators.required]
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

    if (!this.caso || !this.caso._id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar el caso a gestionar.',
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

    // Construir FormData (nombres según documentación del backend)
    const formData = new FormData();
    formData.append('escalamiento_id', this.caso._id);
    formData.append('usuario_asignado', userId);
    formData.append('estado', this.form.value.estadoFinal);

    // notas_resolucion es opcional
    if (this.form.value.respuesta?.trim()) {
      formData.append('notas_resolucion', this.form.value.respuesta.trim());
    }

    if (this.imagenSeleccionada) {
      formData.append('imagen_resolucion', this.imagenSeleccionada, this.imagenSeleccionada.name);
    }

    // Enviar al servicio
    this.mesaAyudaService.gestionarCaso(formData).subscribe({
      next: (resp) => {
        this.isLoading = false;
        if (resp.error === 0) {
          const escalamiento = resp.response?.escalamiento;
          let mensaje = resp.response?.mensaje || 'El escalamiento ha sido gestionado exitosamente';

          if (escalamiento) {
            mensaje += `\n\nEstado: ${escalamiento.estado}`;
            if (escalamiento.usuario_asignado?.Cr_Nombre_Usuario) {
              mensaje += `\nAsignado a: ${escalamiento.usuario_asignado.Cr_Nombre_Usuario}`;
            }
          }

          Swal.fire({
            icon: 'success',
            title: 'Escalamiento Gestionado',
            text: mensaje,
            confirmButtonText: 'Entendido'
          });
          this.volver();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al Gestionar',
            text: resp.response?.mensaje || 'No se pudo gestionar el escalamiento',
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
          msg = 'El archivo de solución excede el tamaño máximo permitido (5 MB).';
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
   * Vuelve al listado de gestor
   */
  volver(): void {
    this.volverGestor.emit();
  }

  /**
   * Muestra imagen en modal
   */
  verImagen(url: string, titulo: string): void {
    Swal.fire({
      title: titulo,
      html: `<img src="${url}" alt="${titulo}" class="img-fluid" style="max-height: 600px;">`,
      width: '800px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar'
    });
  }

  getPrioridadBadgeClass(prioridad: string): string {
    switch (prioridad?.toUpperCase()) {
      case 'ALTO':
        return 'bg-danger';
      case 'MEDIO':
        return 'bg-warning text-dark';
      case 'BAJO':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
      case 'escalado':
        return 'bg-primary';
      case 'en proceso':
      case 'en_proceso':
        return 'bg-info';
      case 'resuelto':
      case 'finalizado':
        return 'bg-success';
      case 'cerrado':
        return 'bg-success';
      case 'rechazado':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Carga la imagen de evidencia con autenticación JWT
   */
  private cargarImagenEvidencia(): void {
    if (!this.caso?._id) return;

    this.evidenciaCargando = true;
    this.evidenciaError = '';
    this.evidenciaUrl = null;

    console.log('🖼️ [GESTIONAR] Cargando imagen para escalamiento:', this.caso._id);

    this.mesaAyudaService.obtenerImagenEvidencia(this.caso._id).subscribe({
      next: (blob) => {
        console.log('✅ [GESTIONAR] Imagen cargada exitosamente, tamaño:', blob.size, 'bytes');

        // Crear URL del blob
        const blobUrl = window.URL.createObjectURL(blob);
        this.evidenciaUrl = this.sanitizer.bypassSecurityTrustUrl(blobUrl);
        this.evidenciaCargando = false;

        console.log('📌 [GESTIONAR] Blob URL creada y sanitizada');
      },
      error: (error) => {
        console.error('❌ [GESTIONAR] Error al cargar imagen:', error);
        this.evidenciaCargando = false;

        if (error.status === 401) {
          this.evidenciaError = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
        } else if (error.status === 404) {
          this.evidenciaError = 'La imagen no existe en el servidor.';
        } else if (error.error?.response?.mensaje) {
          this.evidenciaError = error.error.response.mensaje;
        } else {
          this.evidenciaError = 'No se pudo cargar la imagen.';
        }
      }
    });
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }
}
