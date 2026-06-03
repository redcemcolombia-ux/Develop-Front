import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import Swal from 'sweetalert2';

import { ThemeService } from '../theme/theme.service';
import { AuthService } from '../../core/auth.service';
import { HojaVidaService } from '../../features/gestorHojaVida/hoja-vida.service';
import { Notificacion } from '../../core/notificaciones.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.css']
})
export class Topbar implements OnInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly hojaVidaService = inject(HojaVidaService);

  @Input() displayName = 'Usuario';

  @Output() menuToggle = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  readonly isDarkMode = computed(() => this.themeService.isDarkMode());

  readonly initials = computed(() => {
    const name = String(this.displayName ?? '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    const first = parts[0]?.slice(0, 1) ?? 'U';
    const last = parts[parts.length - 1]?.slice(0, 1) ?? '';
    return (first + last).toUpperCase();
  });

  readonly themeLabel = computed(() => (this.themeService.isDarkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'));

  // Notificaciones
  notificaciones: Notificacion[] = [];
  totalNotificaciones = 0;
  mostrarDropdown = false;
  isClienteAdmin = false;
  private intervalId: any;

  ngOnInit(): void {
    this.isClienteAdmin = this.authService.isClienteAdmin();

    if (this.isClienteAdmin) {
      this.cargarNotificaciones();
      // Polling cada 60 segundos
      this.intervalId = setInterval(() => {
        this.cargarNotificaciones();
      }, 60000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cargarNotificaciones(): void {
    console.log('🔄 [Notificaciones] Iniciando carga...');
    this.hojaVidaService.obtenerNotificaciones().subscribe({
      next: (resp) => {
        console.log('✅ [Notificaciones] Respuesta completa del servidor:', JSON.stringify(resp, null, 2));

        if (resp.error === 0 && resp.response) {
          this.notificaciones = resp.response.notificaciones || [];
          this.totalNotificaciones = resp.response.total || 0;
          console.log(`📊 [Notificaciones] Total cargadas: ${this.totalNotificaciones}`);
          console.log(`📋 [Notificaciones] Notificaciones:`, this.notificaciones);
        } else {
          console.warn('⚠️ [Notificaciones] Respuesta con error:', resp);
          this.notificaciones = [];
          this.totalNotificaciones = 0;
        }
      },
      error: (err) => {
        console.error('❌ [Notificaciones] Error al cargar:', {
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          mensaje: err.error?.response?.mensaje || 'Error desconocido',
          detalle: err.error?.response?.detalle || 'Sin detalles',
          error_completo: err
        });

        // Resetear notificaciones en caso de error
        this.notificaciones = [];
        this.totalNotificaciones = 0;

        // Mostrar mensaje de error específico según el status
        if (err.status === 401) {
          console.warn('🔒 [Notificaciones] Sesión expirada o token inválido');
        } else if (err.status === 500) {
          console.error('🔥 [Notificaciones] Error del servidor:', err.error?.response?.detalle);
        }
      }
    });
  }

  toggleNotificaciones(): void {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  cerrarDropdown(): void {
    this.mostrarDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const notificationsContainer = target.closest('.notifications');

    if (!notificationsContainer && this.mostrarDropdown) {
      this.mostrarDropdown = false;
    }
  }

  verNotificacion(notif: Notificacion): void {
    // Primero marcar como leído en el backend
    this.marcarComoLeido(notif);

    // Luego mostrar el modal
    const nombreCompleto = this.getNombreCompleto(notif);

    let historialHtml = '';
    if (notif.HISTORIAL_EXAMENES && notif.HISTORIAL_EXAMENES.length > 0) {
      historialHtml = '<div class="mt-3"><strong>📋 Historial de Exámenes:</strong><ul class="text-start mt-2">';
      notif.HISTORIAL_EXAMENES.forEach(hist => {
        historialHtml += `
          <li class="mb-2">
            <small class="text-muted">${this.formatearFecha(hist.fecha_cambio)}</small><br>
            <strong>Usuario:</strong> ${hist.id_usuario_cambio?.Cr_Nombre_Usuario || 'N/A'}<br>
            <strong>Notas:</strong> ${hist.notas_cambio || 'Sin notas'}
          </li>
        `;
      });
      historialHtml += '</ul></div>';
    }

    let liberacionHtml = '';
    if (notif.INFO_LIBERACION && notif.INFO_LIBERACION.length > 0) {
      liberacionHtml = '<div class="mt-3"><strong>🔓 Info Liberación:</strong><ul class="text-start mt-2">';
      notif.INFO_LIBERACION.slice(0, 3).forEach(lib => {
        const usuarioInfo = lib.usuario_id?.Cr_Nombre_Usuario
          ? `<strong>Usuario:</strong> ${lib.usuario_id.Cr_Nombre_Usuario}<br>`
          : '';

        liberacionHtml += `
          <li class="mb-2">
            <small class="text-muted">${this.formatearFecha(lib.fecha_liberacion)}</small><br>
            ${usuarioInfo}
            <strong>Informe:</strong> ${lib.informe_liberacion || 'Sin informe'}
          </li>
        `;
      });
      if (notif.INFO_LIBERACION.length > 3) {
        liberacionHtml += `<li class="text-muted"><small>... y ${notif.INFO_LIBERACION.length - 3} más</small></li>`;
      }
      liberacionHtml += '</ul></div>';
    }

    let biometriaHtml = '';
    if (notif.HISTORIAL_BIOMETRIA && notif.HISTORIAL_BIOMETRIA.length > 0) {
      biometriaHtml = '<div class="mt-3"><strong>📸 Historial Biometría:</strong><ul class="text-start mt-2">';
      notif.HISTORIAL_BIOMETRIA.slice(0, 3).forEach(bio => {
        const usuarioInfo = bio.id_usuario_cambio?.Cr_Nombre_Usuario
          ? `<strong>Usuario:</strong> ${bio.id_usuario_cambio.Cr_Nombre_Usuario}<br>`
          : '';

        biometriaHtml += `
          <li class="mb-2">
            <small class="text-muted">${this.formatearFecha(bio.fecha_cambio)}</small><br>
            ${usuarioInfo}
            <strong>Notas:</strong> ${bio.notas_cambio || 'Sin notas'}
          </li>
        `;
      });
      if (notif.HISTORIAL_BIOMETRIA.length > 3) {
        biometriaHtml += `<li class="text-muted"><small>... y ${notif.HISTORIAL_BIOMETRIA.length - 3} más</small></li>`;
      }
      biometriaHtml += '</ul></div>';
    }

    Swal.fire({
      title: 'Notificación - Actualización de Información',
      html: `
        <div class="text-start">
          <p class="mb-2"><strong>Documento:</strong> ${notif.DOCUMENTO}</p>
          <p class="mb-2"><strong>Nombre:</strong> ${nombreCompleto}</p>
          <p class="mb-2"><strong>Estado:</strong> ${notif.ESTADO}</p>
          <p class="mb-2"><strong>IPS:</strong> ${notif.IPS?.NOMBRE_IPS || 'Sin IPS'}</p>
          <p class="mb-3"><strong>Correo:</strong> ${notif.CORREO}</p>
          ${historialHtml}
          ${liberacionHtml}
          ${biometriaHtml}
          <p class="mb-0 text-muted mt-3"><small>Última actualización: ${this.formatearFecha(notif.updatedAt)}</small></p>
        </div>
      `,
      icon: 'info',
      width: '700px',
      confirmButtonText: 'Cerrar',
      showCloseButton: true
    });
  }

  marcarComoLeido(notif: Notificacion): void {
    // Recopilar todos los IDs de elementos no leídos
    const historialExamenesIds = notif.HISTORIAL_EXAMENES
      ?.filter((item: any) => item.leido !== true)
      .map((item: any) => item._id) || [];

    const infoLiberacionIds = notif.INFO_LIBERACION
      ?.filter((item: any) => item.leido !== true)
      .map((item: any) => item._id) || [];

    const historialBiometriaIds = notif.HISTORIAL_BIOMETRIA
      ?.filter((item: any) => item.leido !== true)
      .map((item: any) => item._id) || [];

    // Verificar si hay campos principales para marcar como leído
    const notifAny = notif as any;
    const marcarRutaBiometria = !!(notifAny.RUTA_BIOMETRIA?.ruta && notifAny.leido_ruta_biometria !== true);
    const marcarRutaPsicologia = !!(notifAny.RUTA_PSICOLOGIA?.ruta && notifAny.leido_ruta_psicologia !== true);
    const marcarPdfUrl = !!(notifAny.PDF_URL && notifAny.leido_pdf_url !== true);

    // Solo llamar al servicio si hay algo para marcar
    const hayElementosArrays = historialExamenesIds.length > 0 || infoLiberacionIds.length > 0 || historialBiometriaIds.length > 0;
    const hayCamposPrincipales = marcarRutaBiometria || marcarRutaPsicologia || marcarPdfUrl;

    if (hayElementosArrays || hayCamposPrincipales) {
      console.log('🔔 [Notificaciones] Marcando como leído:', {
        hoja_vida_id: notif._id,
        historial_examenes: historialExamenesIds.length,
        info_liberacion: infoLiberacionIds.length,
        historial_biometria: historialBiometriaIds.length,
        ruta_biometria: marcarRutaBiometria,
        ruta_psicologia: marcarRutaPsicologia,
        pdf_url: marcarPdfUrl
      });

      this.hojaVidaService.marcarNotificacionesLeidas(
        notif._id,
        historialExamenesIds,
        infoLiberacionIds,
        historialBiometriaIds,
        marcarRutaBiometria,
        marcarRutaPsicologia,
        marcarPdfUrl
      ).subscribe({
        next: (response) => {
          console.log('✅ [Notificaciones] Marcadas como leídas:', response.response?.actualizados);

          // Actualizar el contador inmediatamente para feedback visual
          const totalMarcados = (response.response?.actualizados?.total_arrays || 0) +
                               (response.response?.actualizados?.total_campos || 0);

          if (totalMarcados > 0) {
            // Decrementar el contador local
            this.totalNotificaciones = Math.max(0, this.totalNotificaciones - 1);

            // Eliminar la notificación del array local si ya no tiene elementos sin leer
            const index = this.notificaciones.findIndex(n => n._id === notif._id);
            if (index !== -1) {
              this.notificaciones.splice(index, 1);
            }

            console.log(`📊 [Notificaciones] Contador actualizado: ${this.totalNotificaciones}`);
          }

          // Recargar notificaciones del servidor después de 2 segundos para sincronizar
          setTimeout(() => {
            this.cargarNotificaciones();
          }, 2000);
        },
        error: (error) => {
          console.error('❌ [Notificaciones] Error al marcar como leído:', error);
        }
      });
    }
  }

  getNombreCompleto(notif: Notificacion): string {
    return `${notif.NOMBRE} ${notif.PRIMER_APELLIDO} ${notif.SEGUNDO_APELLIDO}`.trim();
  }

  recargarNotificaciones(): void {
    console.log('🔄 [Notificaciones] Recarga manual iniciada...');
    this.cargarNotificaciones();
  }

  formatearFecha(fecha: string): string {
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

  onToggleMenu(): void {
    this.menuToggle.emit();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  logout(): void {
    this.logoutClick.emit();
  }
}
