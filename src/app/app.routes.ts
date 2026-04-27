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
  { path: '**', redirectTo: 'login' }
];
