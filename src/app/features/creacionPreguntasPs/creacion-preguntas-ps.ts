import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/auth.service';
import { PsicologiaGestionService } from '../psicologiaGestion/psicologia-gestion.service';

@Component({
  selector: 'app-creacion-preguntas-ps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './creacion-preguntas-ps.html'
})
export class CreacionPreguntasPs implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly service = inject(PsicologiaGestionService);

  secciones: {
    nombre: string;
    preguntas: { texto: string; tipo: 'SI_NO' | 'APLICA_NO_APLICA' | 'ABIERTA'; respuesta?: string }[];
  }[] = [{ nombre: 'Sección 1', preguntas: [{ texto: '', tipo: 'SI_NO', respuesta: 'NO' }] }];

  guardando = false;

  preguntasActivasExistentes: any[] = [];
  preguntasActivasFiltradas: any[] = [];
  searchTermPreguntas = '';
  currentPagePreguntas = 1;
  itemsPerPagePreguntas = 10;

  ngOnInit(): void {}

  addSeccion(): void {
    const idx = this.secciones.length + 1;
    this.secciones.push({ nombre: `Sección ${idx}`, preguntas: [{ texto: '', tipo: 'SI_NO', respuesta: 'NO' }] });
  }

  removeSeccion(i: number): void {
    if (i < 0 || i >= this.secciones.length) return;
    this.secciones.splice(i, 1);
  }

  addPregunta(si: number): void {
    const sec = this.secciones[si];
    if (!sec) return;
    sec.preguntas.push({ texto: '', tipo: 'SI_NO', respuesta: 'NO' });
  }

  removePregunta(si: number, pi: number): void {
    const sec = this.secciones[si];
    if (!sec) return;
    if (pi < 0 || pi >= sec.preguntas.length) return;
    sec.preguntas.splice(pi, 1);
  }

  guardarPreguntas(): void {
    const errores: string[] = [];
    const preguntas: { tipo: string; pregunta: string; estado: string }[] = [];

    if (!this.secciones || this.secciones.length === 0) {
      errores.push('Debes crear al menos una sección y una pregunta');
    }

    this.secciones.forEach((sec, si) => {
      const nombreSec = (sec?.nombre || '').trim();
      if (!nombreSec) errores.push(`Nombre de sección #${si + 1} es obligatorio`);

      (sec?.preguntas || []).forEach((p, pi) => {
        const texto = (p?.texto || '').trim();
        const tipo = (p?.tipo || '').toString().trim();
        if (!texto) errores.push(`Texto de pregunta #${pi + 1} en sección #${si + 1} es obligatorio`);
        if (!tipo) errores.push(`Tipo de respuesta de pregunta #${pi + 1} en sección #${si + 1} es obligatorio`);
        if (nombreSec && texto && tipo) {
          preguntas.push({ tipo: nombreSec, pregunta: texto, estado: 'activo' });
        }
      });
    });

    if (errores.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        html: `<ul style="text-align:left;">${errores.map((e) => `<li>${e}</li>`).join('')}</ul>`
      });
      return;
    }

    if (preguntas.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin preguntas', text: 'Agrega al menos una pregunta válida.' });
      return;
    }

    this.guardando = true;
    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.service.crearPreguntasPsicologia(preguntas).subscribe({
      next: (resp) => {
        this.guardando = false;
        Swal.close();
        const ok = resp?.error === 0 || resp?.success === true || !!resp?.response;
        const mensaje = resp?.response?.mensaje || resp?.mensaje || 'Preguntas creadas correctamente.';
        if (ok) {
          Swal.fire({ icon: 'success', title: 'Éxito', text: mensaje });
          this.limpiarPreguntas();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
        }
      },
      error: (error) => {
        this.guardando = false;
        Swal.close();
        if (error?.status === 401) {
          Swal.fire({ icon: 'warning', title: 'Sesión expirada' });
          return;
        }
        const msg = error?.error?.response?.mensaje || error?.error?.mensaje || error?.message || 'Error al crear las preguntas.';
        Swal.fire({ icon: 'error', title: 'Error', text: msg });
      }
    });
  }

  limpiarPreguntas(): void {
    this.secciones = [{ nombre: 'Sección 1', preguntas: [{ texto: '', tipo: 'SI_NO', respuesta: 'NO' }] }];
  }

  verPreguntasActivasModal(): void {
    Swal.fire({ title: 'Consultando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    this.service.consultarPreguntasPsicologiaActivas().subscribe({
      next: (resp) => {
        Swal.close();
        const ok = resp?.error === 0;
        if (!ok) {
          const mensaje = resp?.response?.mensaje || resp?.mensaje || 'Error al consultar preguntas activas.';
          Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
          return;
        }
        const data = resp?.response?.data ?? [];
        const rows = Array.isArray(data) ? data : [];
        this.preguntasActivasExistentes = rows;
        this.filtrarPreguntasActivas();

        let html = '';
        html += '<div class="row mb-4">';
        html += '<div class="col-md-6 d-flex align-items-center">';
        html += '<div>';
        html += '<h6 class="mb-1 text-secondary">Registros Encontrados</h6>';
        html += `<div class="d-flex align-items-center mt-2"><span class="badge bg-secondary fs-6 me-2">${this.preguntasActivasFiltradas.length}</span><span class="text-muted">preguntas activas</span></div>`;
        html += '</div></div>';
        html += '<div class="col-md-6">';
        html += '<label class="form-label text-muted mb-2">Buscar registros</label>';
        html += '<div class="input-group">';
        html += '<span class="input-group-text bg-light">🔍</span>';
        html += '<input id="searchPregAct" type="text" class="form-control" placeholder="Tipo o texto de la pregunta..." />';
        html += '</div></div></div>';

        html += '<div class="platform-table__wrap">';
        html += '<div class="table-responsive">';
        html += '<table class="table table-hover platform-table">';
        html += '<thead class="table-dark"><tr><th>Tipo</th><th>Pregunta</th><th>Estado</th><th class="text-center">Acciones</th></tr></thead>';
        html += '<tbody id="pregActBody">';
        html += this.renderPreguntasActivasRows();
        html += '</tbody></table></div>';
        html += '<nav aria-label="Paginación" id="pregActPagination">';
        html += this.renderPreguntasActivasPagination();
        html += '</nav></div>';

        const cardHtml = `
          <div class="card platform-card">
            <div class="card-header platform-card__header platform-card__header--primary">
              <h5 class="mb-0">Preguntas Activas</h5>
            </div>
            <div class="card-body">${html}</div>
          </div>
        `;
        Swal.fire({
          title: '',
          html: cardHtml,
          width: '1100px',
          showCloseButton: true,
          confirmButtonText: 'Cerrar',
          didOpen: () => {
            const input = document.getElementById('searchPregAct') as HTMLInputElement | null;
            if (input) {
              input.value = this.searchTermPreguntas;
              input.oninput = () => {
                this.searchTermPreguntas = input.value;
                this.filtrarPreguntasActivas();
                this.updatePreguntasActivasModalViews();
              };
            }
            const nav = document.getElementById('pregActPagination');
            if (nav) {
              nav.onclick = (e) => {
                const t = e.target as HTMLElement;
                const btn = t.closest('button[data-page]') as HTMLButtonElement | null;
                if (btn) {
                  const page = parseInt(btn.getAttribute('data-page') || '1', 10);
                  this.cambiarPaginaPreguntas(page);
                  this.updatePreguntasActivasModalViews();
                }
              };
            }
            const body = document.getElementById('pregActBody');
            if (body) {
              body.onclick = (e) => {
                const t = e.target as HTMLElement;
                const btn = t.closest('button[data-action]') as HTMLButtonElement | null;
                if (btn) {
                  const id = btn.getAttribute('data-id') || '';
                  const action = btn.getAttribute('data-action') || '';
                  if (action !== 'desactivar') return;
                  const nuevoEstado: 'activo' | 'inactivo' = 'inactivo';
                  const item = this.preguntasActivasExistentes.find((p) => String(p?._id) === id);
                  if (!id || !item) return;

                  btn.disabled = true;
                  Swal.showLoading();
                  this.service.actualizarEstadoPregunta(id, nuevoEstado).subscribe({
                    next: (resp) => {
                      Swal.close();
                      const ok = resp?.error === 0 || resp?.success === true || !!resp?.response;
                      const mensaje = resp?.response?.mensaje || resp?.mensaje || 'Estado actualizado correctamente.';
                      if (ok) {
                        item.estado = nuevoEstado;
                        this.filtrarPreguntasActivas();
                        this.updatePreguntasActivasModalViews();
                        Swal.fire({ icon: 'success', title: 'Éxito', text: mensaje, timer: 1200, showConfirmButton: false });
                      } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
                      }
                      btn.disabled = false;
                    },
                    error: (error) => {
                      Swal.close();
                      btn.disabled = false;
                      if (error?.status === 401) {
                        Swal.fire({ icon: 'warning', title: 'Sesión expirada' });
                        return;
                      }
                      const msg = error?.error?.response?.mensaje || error?.error?.mensaje || error?.message || 'Error al actualizar el estado.';
                      Swal.fire({ icon: 'error', title: 'Error', text: msg });
                    }
                  });
                }
              };
            }
          }
        });
      },
      error: (error) => {
        Swal.close();
        if (error?.status === 401) {
          Swal.fire({ icon: 'warning', title: 'Sesión expirada' });
          return;
        }
        const msg = error?.error?.response?.mensaje || error?.error?.mensaje || error?.message || 'Error al consultar preguntas activas.';
        Swal.fire({ icon: 'error', title: 'Error', text: msg });
      }
    });
  }

  filtrarPreguntasActivas(): void {
    const term = (this.searchTermPreguntas || '').trim().toLowerCase();
    if (!term) {
      this.preguntasActivasFiltradas = [...this.preguntasActivasExistentes];
    } else {
      this.preguntasActivasFiltradas = this.preguntasActivasExistentes.filter(
        (p) =>
          p.tipo?.toLowerCase().includes(term) ||
          p.pregunta?.toLowerCase().includes(term) ||
          p.estado?.toLowerCase().includes(term)
      );
    }
    this.currentPagePreguntas = 1;
  }

  get preguntasActivasPaginadas(): any[] {
    const startIndex = (this.currentPagePreguntas - 1) * this.itemsPerPagePreguntas;
    const endIndex = startIndex + this.itemsPerPagePreguntas;
    return this.preguntasActivasFiltradas.slice(startIndex, endIndex);
  }

  get totalPagesPreguntas(): number {
    return Math.ceil(this.preguntasActivasFiltradas.length / this.itemsPerPagePreguntas);
  }

  get paginasArrayPreguntas(): number[] {
    return Array.from({ length: this.totalPagesPreguntas }, (_, i) => i + 1);
  }

  cambiarPaginaPreguntas(page: number): void {
    if (page < 1 || page > this.totalPagesPreguntas) return;
    this.currentPagePreguntas = page;
  }

  private renderPreguntasActivasRows(): string {
    return this.preguntasActivasPaginadas
      .map((p) => {
        const estadoClass = p?.estado === 'activo' ? 'bg-success' : 'bg-secondary';
        return `<tr>
          <td>${p?.tipo ?? ''}</td>
          <td>${p?.pregunta ?? ''}</td>
          <td><span class="badge ${estadoClass}">${p?.estado ?? ''}</span></td>
          <td class="text-center">
            <button type="button" class="btn btn-outline-danger btn-sm" data-action="desactivar" data-id="${p?._id ?? ''}">Desactivar</button>
          </td>
        </tr>`;
      })
      .join('');
  }

  private renderPreguntasActivasPagination(): string {
    if (this.totalPagesPreguntas <= 1) return '';
    let html = '<ul class="pagination mb-0">';
    const prevDisabled = this.currentPagePreguntas === 1 ? 'disabled' : '';
    html += `<li class="page-item ${prevDisabled}"><button class="page-link" data-page="${this.currentPagePreguntas - 1}">Anterior</button></li>`;
    this.paginasArrayPreguntas.forEach((page) => {
      const active = this.currentPagePreguntas === page ? 'active' : '';
      html += `<li class="page-item ${active}"><button class="page-link" data-page="${page}">${page}</button></li>`;
    });
    const nextDisabled = this.currentPagePreguntas === this.totalPagesPreguntas ? 'disabled' : '';
    html += `<li class="page-item ${nextDisabled}"><button class="page-link" data-page="${this.currentPagePreguntas + 1}">Siguiente</button></li>`;
    html += '</ul>';
    return html;
  }

  private updatePreguntasActivasModalViews(): void {
    const body = document.getElementById('pregActBody');
    const pag = document.getElementById('pregActPagination');
    if (body) body.innerHTML = this.renderPreguntasActivasRows();
    if (pag) pag.innerHTML = this.renderPreguntasActivasPagination();
    const countBadge = document.querySelector('.badge.fs-6');
    if (countBadge) countBadge.textContent = String(this.preguntasActivasFiltradas.length);
  }
}
