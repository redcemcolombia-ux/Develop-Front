import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, inject, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { Aside } from '../../shared/aside/aside';
import type { AsidePanelId } from '../../shared/aside/aside';
import { Topbar } from '../../shared/topbar/topbar';
import { AuthService } from '../../core/auth.service';
import { RegistroUsuarios } from '../registroUsuarios/registro-usuarios';
import { ListadoUsuarios } from '../listadoUsuarios/listado-usuarios';
import { EditarUsuario } from '../editarUsuario/editar-usuario';
import { Usuario } from '../listadoUsuarios/listado-usuarios.service';
import { RegistroIps } from '../registroIps/registro-ips';
import { ListadoIps } from '../listadoIps/listado-ips';
import { GestorIpsCitas } from '../gestorIpsCitas/gestor-ips-citas';
import { MisCasos } from '../misCasos/mis-casos';
import { CasosGestionados } from '../casosGestionados/casos-gestionados';
import { Informe } from '../informe/informe';
import { ConsultarHojasVidaPs } from '../consultarHojasDeVidaPs/consultar-hojas-vida-ps';
import { MisCasosTomadosPs } from '../misCasosTomadosPs/mis-casos-tomados-ps';
import { MisCasosGestionadosPs } from '../misCasosGestionadosPs/mis-casos-gestionados-ps';
import { MisCasosFinalizadosPs } from '../misCasosFinalizadosPs/mis-casos-finalizados-ps';
import { FormularioPs } from '../formularioPs/formulario-ps';
import { FormNotificacionPs } from '../formNotificacionPs/form-notificacion-ps';
import { CreacionPreguntasPs } from '../creacionPreguntasPs/creacion-preguntas-ps';
import { InformePs } from '../informePs/informe-ps';
import { RegistroIndividual } from '../gestorHojaVida/registroIndividual/registro-individual';
import { CargaMasiva } from '../gestorHojaVida/cargaMasiva/carga-masiva';
import { ConsultaHojasVida } from '../gestorHojaVida/consultaHojasVida/consulta-hojas-vida';
import { GraficasHojasVida } from '../gestorHojaVida/graficasHojasVida/graficas-hojas-vida';
import { Aplicaciones } from '../aplicaciones/aplicaciones';

type PanelId = AsidePanelId;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Aside, Topbar, RegistroUsuarios, ListadoUsuarios, EditarUsuario, RegistroIps, ListadoIps, GestorIpsCitas, MisCasos, CasosGestionados, Informe, ConsultarHojasVidaPs, MisCasosTomadosPs, MisCasosGestionadosPs, MisCasosFinalizadosPs, FormularioPs, FormNotificacionPs, CreacionPreguntasPs, InformePs, RegistroIndividual, CargaMasiva, ConsultaHojasVida, GraficasHojasVida, Aplicaciones],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);

  readonly isAsideCollapsed = signal(false);
  readonly isAsideOpen = signal(false);
  readonly activePanel = signal<PanelId>('dashboard');

  // Control de sesión y tiempo
  readonly sessionTime = signal('0 minutos');
  private sessionStartTime: number = Date.now();
  private sessionTimeInterval: any;
  private inactivityTimeout: any;
  private lastActivityTime: number = Date.now();
  private readonly INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutos en milisegundos

  showConsultarHojasDeVida(): boolean {
    return (this.activePanel() as unknown as string) === 'consultarHojasVida';
  }

  showMisCasosTomados(): boolean {
    return (this.activePanel() as unknown as string) === 'misCasosTomados';
  }

  showCasosGestionados(): boolean {
    return (this.activePanel() as unknown as string) === 'misCasosGestionados';
  }

  showInforme(): boolean {
    return (this.activePanel() as unknown as string) === 'informe';
  }

  showConsultarHojasVidaPs(): boolean {
    return (this.activePanel() as unknown as string) === 'consultarHojasVidaPs';
  }

  showMisCasosTomadosPs(): boolean {
    return (this.activePanel() as unknown as string) === 'misCasosTomadosPs';
  }

  showMisCasosGestionadosPs(): boolean {
    return (this.activePanel() as unknown as string) === 'misCasosGestionadosPs';
  }

  showMisCasosFinalizadosPs(): boolean {
    return (this.activePanel() as unknown as string) === 'misCasosFinalizadosPs';
  }

  showFormularioPs(): boolean {
    return (this.activePanel() as unknown as string) === 'formularioPs';
  }

  showFormNotificacionPs(): boolean {
    return (this.activePanel() as unknown as string) === 'formNotificacionPs';
  }

  showCreacionPreguntasPs(): boolean {
    return (this.activePanel() as unknown as string) === 'creacionPreguntasPs';
  }

  showInformePs(): boolean {
    return (this.activePanel() as unknown as string) === 'informePs';
  }

  showRegistroIndividual(): boolean {
    return (this.activePanel() as unknown as string) === 'registroIndividual';
  }

  showCargaMasiva(): boolean {
    return (this.activePanel() as unknown as string) === 'cargaMasiva';
  }

  showConsultaHojas(): boolean {
    return (this.activePanel() as unknown as string) === 'consultaHojas';
  }

  showGraficasHojas(): boolean {
    return (this.activePanel() as unknown as string) === 'graficasHojas';
  }

  showListadoUsuarios(): boolean {
    return (this.activePanel() as unknown as string) === 'listadoUsuarios';
  }

  showEditarUsuario(): boolean {
    return (this.activePanel() as unknown as string) === 'editarUsuario';
  }

  usuarioAEditar: Usuario | null = null;

  readonly userName = signal('Usuario');
  readonly userEmail = signal('');
  readonly perfil = signal('');
  readonly empresa = signal('');
  readonly permisos = signal('');

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      const fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim();
      this.userName.set(fullName || 'Usuario');
      this.userEmail.set(user.correo || '');
      this.perfil.set(user.perfil || '');
      this.empresa.set(user.empresa || '');
      this.permisos.set(user.permiso || '');
    }

    // Inicializar control de sesión
    this.initSessionControl();
  }

  @HostListener('document:mousemove')
  @HostListener('document:keypress')
  @HostListener('document:click')
  @HostListener('document:scroll')
  onUserActivity(): void {
    this.lastActivityTime = Date.now();
  }

  private initSessionControl(): void {
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();

    // Actualizar el tiempo de sesión cada minuto
    this.sessionTimeInterval = setInterval(() => {
      this.updateSessionTime();
    }, 60000); // 60000ms = 1 minuto

    // Actualizar inmediatamente
    this.updateSessionTime();

    // Revisar inactividad cada 30 segundos
    this.inactivityTimeout = setInterval(() => {
      this.checkInactivity();
    }, 30000); // 30000ms = 30 segundos
  }

  private updateSessionTime(): void {
    const elapsedMs = Date.now() - this.sessionStartTime;
    const minutes = Math.floor(elapsedMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      this.sessionTime.set(`${hours} ${hours === 1 ? 'hora' : 'horas'} ${remainingMinutes} ${remainingMinutes === 1 ? 'minuto' : 'minutos'}`);
    } else {
      this.sessionTime.set(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
    }
  }

  private checkInactivity(): void {
    const inactiveTime = Date.now() - this.lastActivityTime;

    if (inactiveTime >= this.INACTIVITY_LIMIT) {
      this.handleInactivityLogout();
    }
  }

  private handleInactivityLogout(): void {
    // Limpiar intervalos
    if (this.sessionTimeInterval) {
      clearInterval(this.sessionTimeInterval);
    }
    if (this.inactivityTimeout) {
      clearInterval(this.inactivityTimeout);
    }

    Swal.fire({
      icon: 'warning',
      title: 'Sesión Cerrada por Inactividad',
      text: 'Tu sesión ha sido cerrada debido a 5 minutos de inactividad.',
      timer: 3000,
      showConfirmButton: false
    });

    this.authService.logout();
  }

  onToggleMenu(): void {
    if (this.isMobile()) {
      const next = !this.isAsideOpen();
      this.isAsideOpen.set(next);
      this.syncBodyScrollLock(next);
      return;
    }

    this.isAsideCollapsed.update((v) => !v);
  }

  onSelectPanel(panel: PanelId): void {
    this.activePanel.set(panel);
    if (this.isAsideOpen()) {
      this.isAsideOpen.set(false);
      this.syncBodyScrollLock(false);
    }
  }

  onEditarUsuario(usuario: Usuario): void {
    this.usuarioAEditar = usuario;
    this.activePanel.set('editarUsuario');
  }

  onVolverAListado(): void {
    this.usuarioAEditar = null;
    this.activePanel.set('listadoUsuarios');
  }

  onCloseAside(): void {
    if (!this.isAsideOpen()) {
      return;
    }
    this.isAsideOpen.set(false);
    this.syncBodyScrollLock(false);
  }

  onLogout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.syncBodyScrollLock(false);

    // Limpiar intervalos
    if (this.sessionTimeInterval) {
      clearInterval(this.sessionTimeInterval);
    }
    if (this.inactivityTimeout) {
      clearInterval(this.inactivityTimeout);
    }
  }

  private isMobile(): boolean {
    try {
      return typeof window !== 'undefined' && window.matchMedia('(max-width: 991.98px)').matches;
    } catch {
      return false;
    }
  }

  private syncBodyScrollLock(locked: boolean): void {
    try {
      if (typeof document === 'undefined') {
        return;
      }
      document.body.style.overflow = locked ? 'hidden' : '';
    } catch {
      return;
    }
  }
}
