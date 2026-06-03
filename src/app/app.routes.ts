import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.LoginComponent)
  },
  {
    path: 'aspirante',
    loadComponent: () => import('./features/aspirante/aspirante').then((m) => m.Aspirante)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'gestor-hoja-vida/registro-individual',
    loadComponent: () => import('./features/gestorHojaVida/registroIndividual/registro-individual').then((m) => m.RegistroIndividual),
    canActivate: [authGuard]
  },
  {
    path: 'gestor-hoja-vida/carga-masiva',
    loadComponent: () => import('./features/gestorHojaVida/cargaMasiva/carga-masiva').then((m) => m.CargaMasiva),
    canActivate: [authGuard]
  },
  {
    path: 'gestor-hoja-vida/consulta-hojas',
    loadComponent: () => import('./features/gestorHojaVida/consultaHojasVida/consulta-hojas-vida').then((m) => m.ConsultaHojasVida),
    canActivate: [authGuard]
  },
  {
    path: 'gestor-hoja-vida/actualizar-aspirante',
    loadComponent: () => import('./features/gestorHojaVida/actualizarAspirante/actualizar-aspirante').then((m) => m.ActualizarAspirante),
    canActivate: [authGuard]
  },
  {
    path: 'gestor-hoja-vida/graficas',
    loadComponent: () => import('./features/gestorHojaVida/graficasHojasVida/graficas-hojas-vida').then((m) => m.GraficasHojasVida),
    canActivate: [authGuard]
  },
  {
    path: 'informe-general-ps',
    loadComponent: () => import('./features/informeGeneralPs/informe-general-ps').then((m) => m.InformeGeneralPs),
    canActivate: [authGuard]
  },
  {
    path: 'reasignacion-casos-ps',
    loadComponent: () => import('./features/reasignacionCasosPs/reasignacion-casos-ps').then((m) => m.ReasignacionCasosPs),
    canActivate: [authGuard]
  },
  {
    path: 'mesa-ayuda/escalar',
    loadComponent: () => import('./features/escalarCaso/escalar-caso').then((m) => m.EscalarCaso),
    canActivate: [authGuard]
  },
  {
    path: 'mesa-ayuda/seguimientos',
    loadComponent: () => import('./features/seguimientosCasos/seguimientos-casos').then((m) => m.SeguimientosCasos),
    canActivate: [authGuard]
  },
  {
    path: 'mesa-ayuda/gestor-escalamientos',
    loadComponent: () => import('./features/gestorEscalamientos/gestor-escalamientos').then((m) => m.GestorEscalamientos),
    canActivate: [authGuard]
  },
  {
    path: 'mesa-ayuda/gestionar-escalamiento',
    loadComponent: () => import('./features/gestionarEscalamiento/gestionar-escalamiento').then((m) => m.GestionarEscalamiento),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'login' }
];
