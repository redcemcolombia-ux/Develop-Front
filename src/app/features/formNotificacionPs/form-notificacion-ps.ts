import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/auth.service';
import { PsicologiaGestionService } from '../psicologiaGestion/psicologia-gestion.service';

@Component({
  selector: 'app-form-notificacion-ps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-notificacion-ps.html'
})
export class FormNotificacionPs implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly service = inject(PsicologiaGestionService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  notificacion = { asunto: '', mensaje: '' };
  adjuntoPdf: File | null = null;
  adjuntoPdfUrl: string | null = null;
  adjuntoPdfSafeUrl: SafeResourceUrl | null = null;
  enviando = false;

  ngOnInit(): void {
    this.cargarNotificacionExistente();
  }

  ngOnDestroy(): void {
    if (this.adjuntoPdfUrl) {
      try {
        URL.revokeObjectURL(this.adjuntoPdfUrl);
      } catch {}
    }
  }

  cargarNotificacionExistente(): void {
    if (this.adjuntoPdfUrl) {
      try {
        URL.revokeObjectURL(this.adjuntoPdfUrl);
      } catch {}
      this.adjuntoPdfUrl = null;
    }

    this.service.consultarNotificaciones().subscribe({
      next: (resp) => {
        const list = resp?.response?.notificaciones ?? resp?.notificaciones ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (arr.length > 0) {
          const n = arr[0];
          this.notificacion.asunto = n?.asunto || '';
          this.notificacion.mensaje = n?.mensaje || '';
          this.cdr.detectChanges();

          const fullPath = n?.ruta_documento_adjunto || '';
          const filename = fullPath.split('/').pop()?.split('?')[0] || '';

          if (filename) {
            this.service.obtenerPDFNotificacionAuth(filename).subscribe({
              next: (blob) => {
                if (this.adjuntoPdfUrl) {
                  try {
                    URL.revokeObjectURL(this.adjuntoPdfUrl);
                  } catch {}
                }
                this.adjuntoPdfUrl = URL.createObjectURL(blob);
                this.adjuntoPdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.adjuntoPdfUrl);
                this.cdr.detectChanges();
              },
              error: () => {
                this.service.obtenerPDFNotificacion(filename).subscribe({
                  next: (blob2) => {
                    if (this.adjuntoPdfUrl) {
                      try {
                        URL.revokeObjectURL(this.adjuntoPdfUrl);
                      } catch {}
                    }
                    this.adjuntoPdfUrl = URL.createObjectURL(blob2);
                    this.adjuntoPdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.adjuntoPdfUrl);
                    this.cdr.detectChanges();
                  }
                });
              }
            });
          }
        }
      }
    });
  }

  onAdjuntoSelected(event: any): void {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      Swal.fire({
        icon: 'error',
        title: 'Archivo no permitido',
        text: 'El adjunto debe ser un archivo PDF.'
      });
      event.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo demasiado grande',
        text: 'El PDF debe pesar máximo 10 MB.'
      });
      event.target.value = '';
      return;
    }

    if (this.adjuntoPdfUrl) {
      try {
        URL.revokeObjectURL(this.adjuntoPdfUrl);
      } catch {}
    }

    this.adjuntoPdf = file;
    this.adjuntoPdfUrl = URL.createObjectURL(file);
    this.adjuntoPdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.adjuntoPdfUrl);
  }

  removerAdjunto(): void {
    if (this.adjuntoPdfUrl) {
      try {
        URL.revokeObjectURL(this.adjuntoPdfUrl);
      } catch {}
    }
    this.adjuntoPdf = null;
    this.adjuntoPdfUrl = null;
    this.adjuntoPdfSafeUrl = null;
  }

  limpiar(): void {
    if (this.adjuntoPdfUrl) {
      try {
        URL.revokeObjectURL(this.adjuntoPdfUrl);
      } catch {}
    }
    this.notificacion = { asunto: '', mensaje: '' };
    this.adjuntoPdf = null;
    this.adjuntoPdfUrl = null;
    this.adjuntoPdfSafeUrl = null;
  }

  enviar(): void {
    if (!this.notificacion.asunto || !this.notificacion.mensaje || !this.adjuntoPdf) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor completa Asunto, Mensaje y adjunta un PDF.'
      });
      return;
    }

    this.enviando = true;

    Swal.fire({
      title: 'Enviando notificación...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.service.crearNotificacion(this.notificacion.asunto.trim(), this.notificacion.mensaje.trim(), this.adjuntoPdf!).subscribe({
      next: (resp) => {
        this.enviando = false;
        Swal.close();

        const ok = resp?.error === 0 || resp?.success === true || !!resp?.response;
        const mensaje = resp?.response?.mensaje || resp?.mensaje || 'Notificación enviada correctamente.';
        if (ok) {
          Swal.fire({ icon: 'success', title: 'Éxito', text: mensaje });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
        }
      },
      error: (error) => {
        this.enviando = false;
        Swal.close();
        if (error?.status === 401) {
          Swal.fire({ icon: 'warning', title: 'Sesión expirada' });
          return;
        }
        const msg =
          error?.error?.response?.mensaje || error?.error?.mensaje || error?.message || 'Error al enviar la notificación.';
        Swal.fire({ icon: 'error', title: 'Error', text: msg });
      }
    });
  }

  verPDF(): void {
    if (!this.adjuntoPdfUrl) return;
    const html = `
      <div style="width: 100%; height: 80vh;">
        <iframe src="${this.adjuntoPdfUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
      </div>
    `;
    Swal.fire({
      title: 'Visualizador de PDF',
      html,
      width: '95%',
      showCloseButton: true,
      confirmButtonText: 'Cerrar'
    });
  }
}
