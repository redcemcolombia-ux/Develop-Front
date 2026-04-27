import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth.service';

export type AsidePanelId =
  | 'dashboard'
  | 'registroUsuarios'
  | 'listadoUsuarios'
  | 'controlProcesos'
  | 'gestionarControlUso'
  | 'editarUsuario'
  | 'registroIps'
  | 'listadoIps'
  | 'editarIps'
  | 'gestorIps'
  | 'ipsGestion'
  | 'consultarHojasVida'
  | 'misCasosTomados'
  | 'misCasosGestionados'
  | 'casosAplazadosIps'
  | 'informe'
  | 'psicologiaGestion'
  | 'consultarHojasVidaPs'
  | 'misCasosTomadosPs'
  | 'misCasosGestionadosPs'
  | 'misCasosFinalizadosPs'
  | 'formularioPs'
  | 'formNotificacionPs'
  | 'creacionPreguntasPs'
  | 'informePs'
  | 'hojaVida'
  | 'aplicaciones'
  | 'gestorHojaVida'
  | 'registroIndividual'
  | 'cargaMasiva'
  | 'consultaHojas'
  | 'actualizarAspirante'
  | 'gestionarAspirante'
  | 'casosCerrados'
  | 'casosAplazados'
  | 'graficasHojas';

@Component({
  selector: 'app-aside',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aside.html',
  styleUrl: './aside.css'
})
export class Aside implements OnInit {
  @Input() activePanel: AsidePanelId = 'dashboard';
  @Input() userName = 'Usuario';
  @Output() selectPanel = new EventEmitter<AsidePanelId>();

  adminMenuExpanded = false;
  adminIpsMenuExpanded = false;
  ipsGestionMenuExpanded = false;
  psicologiaGestionMenuExpanded = false;
  gestorHojaVidaMenuExpanded = false;

  // Variables para controlar la visibilidad de las opciones del menú
  canViewGestorUsuarios: boolean = false;
  canViewAdminIps: boolean = false;
  canViewIpsGestion: boolean = false;
  canViewCasosAplazadosIps: boolean = false;
  canViewPsicologiaGestion: boolean = false;
  canViewFormularioNotificacion: boolean = false;
  canViewGestorHojaVida: boolean = false;
  canViewAplicaciones: boolean = false;

  // Permisos granulares para Gestor Hoja de Vida
  canViewRegistroIndividual: boolean = false;
  canViewCargaMasiva: boolean = false;
  canViewConsultaHojas: boolean = false;
  canViewActualizarAspirante: boolean = false;
  canViewGestionarAspirante: boolean = false;
  canViewCasosCerrados: boolean = false;
  canViewCasosAplazados: boolean = false;
  canViewGraficas: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.setPermissions();
  }

  /**
   * Establece los permisos basados en el perfil del usuario
   */
  private setPermissions(): void {
    const userInfo = this.authService.getUserInfo();

    if (!userInfo || !userInfo.perfil) {
      this.resetPermissions();
      this.userName = '';
      return;
    }

    this.userName = userInfo.nombre || userInfo.usuario || 'Usuario';

    const perfil = userInfo.perfil.toLowerCase();
    const permiso = userInfo.permiso?.toLowerCase() || '';

    this.resetPermissions();

    switch (perfil) {
      case 'administrador':
        if (permiso.includes('lectura') && permiso.includes('escritura')) {
          this.canViewGestorUsuarios = true;
          this.canViewAdminIps = true;
          this.canViewIpsGestion = true;
          this.canViewCasosAplazadosIps = true;
          this.canViewPsicologiaGestion = true;
          this.canViewFormularioNotificacion = true;
          this.canViewGestorHojaVida = true;
          this.canViewAplicaciones = true;
          this.canViewRegistroIndividual = true;
          this.canViewCargaMasiva = true;
          this.canViewConsultaHojas = true;
          this.canViewActualizarAspirante = true;
          this.canViewGestionarAspirante = true;
          this.canViewCasosCerrados = true;
          this.canViewCasosAplazados = true;
          this.canViewGraficas = true;
        }
        break;

      case 'supervisor':
        this.canViewAdminIps = true;
        this.canViewIpsGestion = true;
        this.canViewCasosAplazadosIps = true;
        this.canViewGestorHojaVida = true;
        this.canViewRegistroIndividual = true;
        this.canViewCargaMasiva = true;
        this.canViewConsultaHojas = true;
        this.canViewActualizarAspirante = true;
        this.canViewGestionarAspirante = true;
        this.canViewCasosCerrados = true;
        this.canViewCasosAplazados = true;
        this.canViewGraficas = true;
        break;

      case 'supervisor_psicologia':
      case 'supervisor psicologia':
      case 'psicólogo-supervisor':
      case 'psicologo-supervisor':
      case 'psicologo supervisor':
      case 'psicólogo supervisor':
        this.canViewPsicologiaGestion = true;
        this.canViewFormularioNotificacion = true;
        break;

      case 'psicologo':
      case 'psicólogo':
        this.canViewPsicologiaGestion = true;
        this.canViewFormularioNotificacion = false;
        break;

      case 'usuario':
        this.canViewIpsGestion = true;
        this.canViewCasosAplazadosIps = true;
        break;

      case 'cliente':
        this.canViewGestorHojaVida = true;
        this.canViewRegistroIndividual = true;
        this.canViewCargaMasiva = true;
        this.canViewConsultaHojas = true;
        this.canViewActualizarAspirante = true;
        this.canViewGestionarAspirante = true;
        this.canViewCasosCerrados = true;
        this.canViewCasosAplazados = true;
        break;

      case 'cliente gestor':
        this.canViewGestorHojaVida = true;
        this.canViewConsultaHojas = true;
        this.canViewActualizarAspirante = true;
        this.canViewGestionarAspirante = true;
        this.canViewCasosCerrados = true;
        this.canViewCasosAplazados = true;
        break;

      case 'cliente admin':
        this.canViewGestorHojaVida = true;
        this.canViewRegistroIndividual = true;
        this.canViewCargaMasiva = true;
        this.canViewConsultaHojas = true;
        this.canViewActualizarAspirante = true;
        this.canViewGestionarAspirante = true;
        this.canViewCasosCerrados = true;
        this.canViewCasosAplazados = true;
        this.canViewGraficas = true;
        break;

      case 'cliente informes':
        this.canViewGestorHojaVida = true;
        this.canViewGestionarAspirante = true;
        this.canViewCasosCerrados = true;
        this.canViewCasosAplazados = true;
        this.canViewGraficas = true;
        break;

      default:
        this.resetPermissions();
        break;
    }
  }

  /**
   * Resetea todos los permisos a false
   */
  private resetPermissions(): void {
    this.canViewGestorUsuarios = false;
    this.canViewAdminIps = false;
    this.canViewIpsGestion = false;
    this.canViewCasosAplazadosIps = false;
    this.canViewPsicologiaGestion = false;
    this.canViewFormularioNotificacion = false;
    this.canViewGestorHojaVida = false;
    this.canViewAplicaciones = false;
    this.canViewRegistroIndividual = false;
    this.canViewCargaMasiva = false;
    this.canViewConsultaHojas = false;
    this.canViewActualizarAspirante = false;
    this.canViewGestionarAspirante = false;
    this.canViewCasosCerrados = false;
    this.canViewCasosAplazados = false;
    this.canViewGraficas = false;
  }

  openDashboard(): void {
    this.selectPanel.emit('dashboard');
  }

  toggleAdminMenu(): void {
    if (this.canViewGestorUsuarios) {
      this.adminMenuExpanded = !this.adminMenuExpanded;
    }
  }

  openRegistroUsuarios(): void {
    if (this.canViewGestorUsuarios) {
      this.selectPanel.emit('registroUsuarios');
    }
  }

  openListadoUsuarios(): void {
    if (this.canViewGestorUsuarios) {
      this.selectPanel.emit('listadoUsuarios');
    }
  }

  openControlProcesos(): void {
    if (this.canViewAplicaciones) {
      this.selectPanel.emit('controlProcesos');
    }
  }

  toggleAdminIpsMenu(): void {
    if (this.canViewAdminIps) {
      this.adminIpsMenuExpanded = !this.adminIpsMenuExpanded;
    }
  }

  openRegistroIps(): void {
    if (this.canViewAdminIps) {
      this.selectPanel.emit('registroIps');
    }
  }

  openListadoIps(): void {
    if (this.canViewAdminIps) {
      this.selectPanel.emit('listadoIps');
    }
  }

  openGestorIps(): void {
    if (this.canViewAdminIps) {
      this.selectPanel.emit('gestorIps');
    }
  }

  toggleIpsGestionMenu(): void {
    if (this.canViewIpsGestion) {
      this.ipsGestionMenuExpanded = !this.ipsGestionMenuExpanded;
    }
  }

  openConsultarHojasVida(): void {
    if (this.canViewIpsGestion) {
      this.selectPanel.emit('consultarHojasVida');
    }
  }

  openMisCasosTomados(): void {
    if (this.canViewIpsGestion) {
      this.selectPanel.emit('misCasosTomados');
    }
  }

  openMisCasosGestionados(): void {
    if (this.canViewIpsGestion) {
      this.selectPanel.emit('misCasosGestionados');
    }
  }

  openCasosAplazadosIps(): void {
    if (this.canViewCasosAplazadosIps) {
      this.selectPanel.emit('casosAplazadosIps');
    }
  }

  openInforme(): void {
    if (this.canViewIpsGestion) {
      this.selectPanel.emit('informe');
    }
  }

  openIpsGestion(): void {
    if (this.canViewIpsGestion) {
      this.selectPanel.emit('ipsGestion');
    }
  }

  togglePsicologiaGestionMenu(): void {
    if (this.canViewPsicologiaGestion) {
      this.psicologiaGestionMenuExpanded = !this.psicologiaGestionMenuExpanded;
    }
  }

  openConsultarHojasVidaPs(): void {
    if (this.canViewPsicologiaGestion) {
      this.selectPanel.emit('consultarHojasVidaPs');
    }
  }

  openMisCasosTomadosPs(): void {
    if (this.canViewPsicologiaGestion) {
      this.selectPanel.emit('misCasosTomadosPs');
    }
  }

  openMisCasosGestionadosPs(): void {
    if (this.canViewPsicologiaGestion) {
      this.selectPanel.emit('misCasosGestionadosPs');
    }
  }

  openMisCasosFinalizadosPs(): void {
    if (this.canViewPsicologiaGestion) {
      this.selectPanel.emit('misCasosFinalizadosPs');
    }
  }

  openFormularioPs(): void {
    if (this.canViewPsicologiaGestion) {
      this.selectPanel.emit('formularioPs');
    }
  }

  openFormNotificacionPs(): void {
    if (this.canViewFormularioNotificacion) {
      this.selectPanel.emit('formNotificacionPs');
    }
  }

  openCreacionPreguntasPs(): void {
    if (this.canViewPsicologiaGestion) {
      this.selectPanel.emit('creacionPreguntasPs');
    }
  }

  openInformePs(): void {
    if (this.canViewPsicologiaGestion) {
      this.selectPanel.emit('informePs');
    }
  }

  openPsicologiaGestion(): void {
    if (this.canViewPsicologiaGestion) {
      this.selectPanel.emit('psicologiaGestion');
    }
  }

  openHojaVida(): void {
    if (this.canViewGestorHojaVida) {
      this.selectPanel.emit('hojaVida');
    }
  }

  openAplicaciones(): void {
    if (this.canViewAplicaciones) {
      this.selectPanel.emit('aplicaciones');
    }
  }

  toggleGestorHojaVidaMenu(): void {
    if (this.canViewGestorHojaVida) {
      this.gestorHojaVidaMenuExpanded = !this.gestorHojaVidaMenuExpanded;
    }
  }

  openRegistroIndividual(): void {
    if (this.canViewRegistroIndividual) {
      this.selectPanel.emit('registroIndividual');
    }
  }

  openCargaMasiva(): void {
    if (this.canViewCargaMasiva) {
      this.selectPanel.emit('cargaMasiva');
    }
  }

  openConsultaHojas(): void {
    if (this.canViewConsultaHojas) {
      this.selectPanel.emit('consultaHojas');
    }
  }

  openActualizarAspirante(): void {
    if (this.canViewActualizarAspirante) {
      this.selectPanel.emit('actualizarAspirante');
    }
  }

  openGestionarAspirante(): void {
    if (this.canViewGestionarAspirante) {
      this.selectPanel.emit('gestionarAspirante');
    }
  }

  openCasosCerrados(): void {
    if (this.canViewCasosCerrados) {
      this.selectPanel.emit('casosCerrados');
    }
  }

  openCasosAplazados(): void {
    if (this.canViewCasosAplazados) {
      this.selectPanel.emit('casosAplazados');
    }
  }

  openGraficasHojas(): void {
    if (this.canViewGraficas) {
      this.selectPanel.emit('graficasHojas');
    }
  }
}
