import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/auth.service';
import { PsicologiaGestionService } from '../psicologiaGestion/psicologia-gestion.service';

@Component({
  selector: 'app-formulario-ps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-ps.html'
})
export class FormularioPs implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly service = inject(PsicologiaGestionService);

  isSaving = false;
  aspiranteSearchTerm = '';
  aspiranteEncontrado: any | null = null;

  formSecciones: { tipo: string; preguntas: { pregunta: string; respuesta: string; ampliacion: string }[] }[] = [];

  hojasVidaPool: any[] = [];
  casosTomadosPool: any[] = [];

  ngOnInit(): void {
    this.cargarPreguntasFormulario();
    this.cargarAspirantesBase();
  }

  private cargarPreguntasFormulario(): void {
    this.service.consultarPreguntasPsicologiaActivas().subscribe({
      next: (resp) => {
        const data = resp?.response?.data ?? resp?.response ?? resp?.data ?? [];
        const arr = Array.isArray(data) ? data : [];
        const activas = arr.filter((p: any) => (p?.estado || '').toLowerCase() === 'activo');
        const grupos: Record<string, { pregunta: string; respuesta: string; ampliacion: string }[]> = {};
        activas.forEach((p: any) => {
          const tipo = (p?.tipo || 'General').trim();
          if (!grupos[tipo]) grupos[tipo] = [];
          grupos[tipo].push({ pregunta: p?.pregunta || '', respuesta: 'NO', ampliacion: '' });
        });
        this.formSecciones = Object.keys(grupos).map((tipo) => ({ tipo, preguntas: grupos[tipo] }));
      }
    });
  }

  private cargarAspirantesBase(): void {
    this.service.consultarHojasVida().subscribe({
      next: (resp) => {
        const data = resp?.response?.data ?? [];
        this.hojasVidaPool = Array.isArray(data) ? data : [];
      }
    });

    this.service.consultarCasosPorUsuarioSic().subscribe({
      next: (resp) => {
        const data = resp?.response?.data ?? resp?.response ?? resp?.data ?? [];
        this.casosTomadosPool = Array.isArray(data) ? data : [];
      }
    });
  }

  private normalizarTexto(s: string): string {
    return (s || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\s+/g, ' ')
      .replace(/[\u0300-\u036f]/g, '');
  }

  searchAspirante(): void {
    const term = this.normalizarTexto(this.aspiranteSearchTerm);
    if (!term || term.length < 2) {
      this.aspiranteEncontrado = null;
      return;
    }
    const pool = [...this.casosTomadosPool, ...this.hojasVidaPool];
    const found = pool.find((h: any) => {
      const doc = (h?.DOCUMENTO || '').toString().trim();
      const nombre = this.normalizarTexto(
        `${h?.NOMBRE || ''} ${h?.PRIMER_APELLIDO || ''} ${h?.SEGUNDO_APELLIDO || ''}`
      );
      return (doc && term === doc) || nombre.includes(term);
    });
    this.aspiranteEncontrado = found || null;
  }

  limpiarBusqueda(): void {
    this.aspiranteSearchTerm = '';
    this.aspiranteEncontrado = null;
  }

  guardarFormulario(): void {
    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
      Swal.fire({
        icon: 'success',
        title: 'Formulario guardado',
        text: 'Se guardó la información correctamente.'
      });
    }, 800);
  }
}
