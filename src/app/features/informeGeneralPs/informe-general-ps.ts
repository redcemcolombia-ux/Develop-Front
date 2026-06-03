import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, ElementRef, OnInit, ViewChild, effect, inject } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../shared/theme/theme.service';
import { PsicologiaGestionService, Usuario, CasoConUsuarioSic } from '../psicologiaGestion/psicologia-gestion.service';
import { ReasignacionCasosPsService } from '../reasignacionCasosPs/reasignacion-casos-ps.service';

Chart.register(...registerables);

interface EstadisticasPs {
  casosSinGestion: number;
  totalCasos: number;
  casosFinalizados: number;
  casosPendientes: number;
}

@Component({
  selector: 'app-informe-general-ps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informe-general-ps.html',
  styles: [`
    .informe-ps__header {
      background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
    }

    .chart-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
    }

    .chart-icon {
      color: #b3945b;
      opacity: 0.6;
      margin-bottom: 1rem;
    }

    .chart-placeholder-text {
      font-size: 1rem;
      font-weight: 600;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .chart-placeholder-subtext {
      font-size: 0.8rem;
      color: #adb5bd;
      margin-bottom: 0;
    }
  `]
})
export class InformeGeneralPs implements OnInit, AfterViewInit {
  private readonly service = inject(PsicologiaGestionService);
  private readonly reasignacionService = inject(ReasignacionCasosPsService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('chartEstados') chartEstadosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartResultados') chartResultadosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartComparativo') chartComparativoRef?: ElementRef<HTMLCanvasElement>;

  casos: CasoConUsuarioSic[] = [];
  casosFiltrados: CasoConUsuarioSic[] = [];
  casosSinGestion: any[] = [];
  psicologos: Usuario[] = [];
  psicologoSeleccionado: string = 'todos'; // 'todos' o ID del psicólogo
  estadisticas: EstadisticasPs = {
    casosSinGestion: 0,
    totalCasos: 0,
    casosFinalizados: 0,
    casosPendientes: 0
  };
  isLoading = false;

  private chartEstados?: Chart;
  private chartResultados?: Chart;
  private chartComparativo?: Chart;

  constructor() {
    const themeEffect = effect(() => {
      this.themeService.isDarkMode();
      if (this.isLoading) return;
      if (!this.chartEstadosRef || !this.chartResultadosRef || !this.chartComparativoRef) return;
      const totalCasos = this.estadisticas.totalCasos + this.estadisticas.casosSinGestion;
      if (totalCasos === 0) return;
      setTimeout(() => this.crearGraficos(), 0);
    });
    this.destroyRef.onDestroy(() => themeEffect.destroy());
  }

  ngOnInit(): void {
    this.cargarPsicologos();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  /**
   * Carga lista de psicólogos y luego los casos
   */
  cargarPsicologos(): void {
    this.service.listarUsuarios().subscribe({
      next: (resp) => {
        if (resp.error === 0 && resp.response?.usuarios) {
          this.psicologos = resp.response.usuarios.filter(
            (usuario) => usuario.Cr_Perfil === 'Psicólogo' || usuario.Cr_Perfil === 'Psicologo' || usuario.Cr_Perfil === 'psicologo' || usuario.Cr_Perfil === 'psicólogo'
          );

          // Cargar casos después de tener los psicólogos
          this.cargarDatos();
        }
      },
      error: (error) => {
        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: 'No se pudo cargar la lista de psicólogos. Los filtros pueden estar incompletos.',
          confirmButtonText: 'Entendido'
        });
        // Aunque falle, intentar cargar los casos
        this.cargarDatos();
      }
    });
  }

  /**
   * Carga casos con usuario SIC asignado y casos sin gestión
   */
  cargarDatos(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    // Cargar casos con psicólogo asignado
    this.reasignacionService.getCasosConUsuarioSic().subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          this.casos = resp.response.data;
        } else {
          this.casos = [];
        }

        // Cargar casos sin gestión (sin psicólogo asignado)
        this.cargarCasosSinGestion();
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Sesión Expirada',
            text: 'Por favor, inicie sesión nuevamente',
            confirmButtonText: 'Entendido'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudo conectar con el servidor',
            confirmButtonText: 'Entendido'
          });
        }
      }
    });
  }

  /**
   * Carga casos sin gestión (sin psicólogo asignado)
   */
  cargarCasosSinGestion(): void {
    this.service.consultarHojasVida().subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.error === 0) {
          const todosCasos = response.response?.data || [];

          // Filtrar casos que NO tienen USUARIO_SIC
          this.casosSinGestion = todosCasos.filter((caso: any) => !caso.USUARIO_SIC);

          this.aplicarFiltroPsicologo();
          this.cdr.detectChanges();

          // Crear gráficos solo si hay datos
          if (this.estadisticas.totalCasos > 0 || this.estadisticas.casosSinGestion > 0) {
            setTimeout(() => {
              this.crearGraficos();
            }, 100);
          }
        } else {
          this.casosSinGestion = [];
          this.aplicarFiltroPsicologo();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.casosSinGestion = [];
        this.aplicarFiltroPsicologo();
        this.cdr.detectChanges();

        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: 'No se pudieron cargar algunos casos. Los datos mostrados pueden estar incompletos.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Obtiene el nombre del psicólogo asignado a un caso
   */
  getNombrePsicologo(caso: CasoConUsuarioSic): string {
    if (!caso.USUARIO_SIC) {
      return 'Sin asignación';
    }

    const psicologo = this.psicologos.find(p => p._id === caso.USUARIO_SIC);

    if (!psicologo) {
      return 'Sin asignación';
    }

    return psicologo.Cr_Nombre_Usuario || 'Sin nombre';
  }

  /**
   * Obtiene el nombre del psicólogo seleccionado actualmente
   */
  getNombrePsicologoSeleccionado(): string {
    if (this.psicologoSeleccionado === 'todos') {
      return 'Todos';
    }

    const psicologo = this.psicologos.find(p => p._id === this.psicologoSeleccionado);
    return psicologo?.Cr_Nombre_Usuario || 'Psicólogo';
  }

  /**
   * Aplica filtro por psicólogo seleccionado
   */
  aplicarFiltroPsicologo(): void {
    if (this.psicologoSeleccionado === 'todos') {
      // Mostrar todos los casos
      this.casosFiltrados = [...this.casos];
    } else {
      // Filtrar por psicólogo seleccionado
      this.casosFiltrados = this.casos.filter(
        (caso) => caso.USUARIO_SIC === this.psicologoSeleccionado
      );
    }

    // Recalcular estadísticas y recrear gráficos
    this.calcularEstadisticas();
    const totalCasos = this.estadisticas.totalCasos + this.estadisticas.casosSinGestion;
    if (totalCasos > 0) {
      setTimeout(() => {
        this.crearGraficos();
      }, 100);
    }
  }

  /**
   * Maneja el cambio de psicólogo seleccionado
   */
  onPsicologoChange(): void {
    this.aplicarFiltroPsicologo();
  }

  calcularEstadisticas(): void {
    // Casos sin gestión (sin psicólogo asignado)
    this.estadisticas.casosSinGestion = this.casosSinGestion.length;

    // Total de casos tomados/asignados (con USUARIO_SIC)
    this.estadisticas.totalCasos = this.casosFiltrados.length;

    // Casos Finalizados = Asignados con PDF de psicología (RUTA_PSICOLOGIA)
    this.estadisticas.casosFinalizados = this.casosFiltrados.filter((c: any) => {
      const rutaPsi = c.RUTA_PSICOLOGIA;
      if (!rutaPsi) return false;

      // Verificar si es string con contenido o objeto con ruta
      if (typeof rutaPsi === 'string') {
        return rutaPsi.trim() !== '';
      } else if (typeof rutaPsi === 'object') {
        return rutaPsi.ruta !== null && rutaPsi.ruta !== undefined;
      }
      return false;
    }).length;

    // Casos Pendientes = Total - Finalizados
    this.estadisticas.casosPendientes = this.estadisticas.totalCasos - this.estadisticas.casosFinalizados;
  }

  crearGraficos(): void {
    this.crearGraficoEstados();
    this.crearGraficoResultados();
    this.crearGraficoComparativo();
  }

  crearGraficoEstados(): void {
    const totalCasos = this.estadisticas.totalCasos + this.estadisticas.casosSinGestion;
    if (!this.chartEstadosRef || totalCasos === 0) return;

    if (this.chartEstados) {
      this.chartEstados.destroy();
    }

    const theme = this.getChartTheme();
    const tituloGrafico = this.psicologoSeleccionado === 'todos'
      ? 'Estado de Casos (Global)'
      : `Estado de Casos (${this.getNombrePsicologoSeleccionado()})`;

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Casos Sin Gestión', 'Casos Finalizados', 'Casos Pendientes'],
        datasets: [
          {
            data: [this.estadisticas.casosSinGestion, this.estadisticas.casosFinalizados, this.estadisticas.casosPendientes],
            backgroundColor: ['#6c757d', '#198754', '#fd7e14'],
            borderWidth: 2,
            borderColor: theme.segmentBorder
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme.text,
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: tituloGrafico,
            color: theme.text,
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.text,
            bodyColor: theme.text,
            borderColor: theme.tooltipBorder,
            borderWidth: 1
          }
        }
      }
    };

    this.chartEstados = new Chart(this.chartEstadosRef.nativeElement, config);
  }

  crearGraficoResultados(): void {
    const totalCasos = this.estadisticas.totalCasos + this.estadisticas.casosSinGestion;
    if (!this.chartResultadosRef || totalCasos === 0) return;

    if (this.chartResultados) {
      this.chartResultados.destroy();
    }

    const theme = this.getChartTheme();
    const tituloGrafico = this.psicologoSeleccionado === 'todos'
      ? 'Distribución de Casos (Global)'
      : `Distribución de Casos (${this.getNombrePsicologoSeleccionado()})`;

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: ['Sin Gestión', 'Finalizados', 'Pendientes'],
        datasets: [
          {
            label: 'Cantidad de Casos',
            data: [
              this.estadisticas.casosSinGestion,
              this.estadisticas.casosFinalizados,
              this.estadisticas.casosPendientes
            ],
            backgroundColor: ['#6c757d', '#198754', '#fd7e14'],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: tituloGrafico,
            color: theme.text,
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.text,
            bodyColor: theme.text,
            borderColor: theme.tooltipBorder,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: {
              color: theme.text,
              font: {
                size: 10
              }
            },
            grid: {
              color: theme.grid
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: theme.text,
              font: {
                size: 10
              }
            },
            grid: {
              color: theme.grid
            }
          }
        }
      }
    };

    this.chartResultados = new Chart(this.chartResultadosRef.nativeElement, config);
  }

  crearGraficoComparativo(): void {
    const totalCasos = this.estadisticas.totalCasos + this.estadisticas.casosSinGestion;
    if (!this.chartComparativoRef || totalCasos === 0) return;

    if (this.chartComparativo) {
      this.chartComparativo.destroy();
    }

    const theme = this.getChartTheme();
    const tituloGrafico = this.psicologoSeleccionado === 'todos'
      ? 'Comparativo General'
      : `Comparativo (${this.getNombrePsicologoSeleccionado()})`;

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: ['Sin Gestión', 'Total Tomados/Asignados', 'Finalizados', 'Pendientes'],
        datasets: [
          {
            label: 'Casos',
            data: [
              this.estadisticas.casosSinGestion,
              this.estadisticas.totalCasos,
              this.estadisticas.casosFinalizados,
              this.estadisticas.casosPendientes
            ],
            backgroundColor: ['#6c757d', '#dc3545', '#198754', '#fd7e14'],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: tituloGrafico,
            color: theme.text,
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.text,
            bodyColor: theme.text,
            borderColor: theme.tooltipBorder,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: {
              color: theme.text,
              font: {
                size: 10
              }
            },
            grid: {
              color: theme.grid
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: theme.text,
              font: {
                size: 10
              }
            },
            grid: {
              color: theme.grid
            }
          }
        }
      }
    };

    this.chartComparativo = new Chart(this.chartComparativoRef.nativeElement, config);
  }

  exportarExcel(): void {
    if (this.casosFiltrados.length === 0) {
      Swal.fire({
        title: 'Sin Datos',
        text: 'No hay casos para exportar',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Obtener nombre del psicólogo seleccionado
    let nombreFiltro = 'Todos los Psicólogos';
    if (this.psicologoSeleccionado !== 'todos') {
      const psi = this.psicologos.find(p => p._id === this.psicologoSeleccionado);
      nombreFiltro = psi?.Cr_Nombre_Usuario || 'Psicólogo Seleccionado';
    }

    // Hoja 1: Estadísticas generales
    const estadisticasData = [
      { Indicador: 'Filtro Aplicado', Cantidad: nombreFiltro },
      { Indicador: 'Casos Sin Gestión', Cantidad: this.estadisticas.casosSinGestion },
      { Indicador: 'Total de Casos Tomados/Asignados', Cantidad: this.estadisticas.totalCasos },
      { Indicador: 'Casos Finalizados (Con PDF)', Cantidad: this.estadisticas.casosFinalizados },
      { Indicador: 'Casos Pendientes', Cantidad: this.estadisticas.casosPendientes },
      { Indicador: '% Sin Gestión', Cantidad: `${this.porcentajeSinGestion.toFixed(2)}%` },
      { Indicador: '% Casos Finalizados', Cantidad: `${this.porcentajeFinalizados.toFixed(2)}%` },
      { Indicador: '% Casos Pendientes', Cantidad: `${this.porcentajePendientes.toFixed(2)}%` }
    ];

    // Hoja 2: Detalle completo de casos
    const casosDetalle = this.casosFiltrados.map((caso) => {
      const rutaPsi = (caso as any).RUTA_PSICOLOGIA;
      const tieneResultado = rutaPsi &&
        ((typeof rutaPsi === 'string' && rutaPsi.trim() !== '') ||
         (typeof rutaPsi === 'object' && rutaPsi.ruta !== null && rutaPsi.ruta !== undefined));

      const tieneAgenda = (caso as any).TIPO_REUNION ? true : false;
      const tieneConsentimiento = (caso as any).RUTA_NOTIFICACION_RECIBIDA && (caso as any).RUTA_NOTIFICACION_RECIBIDA.trim() !== '';

      let estadoFlujo = 'PENDIENTE';
      if (tieneResultado) {
        estadoFlujo = 'FINALIZADO';
      } else if (tieneAgenda) {
        estadoFlujo = 'GESTIONADO';
      }

      return {
        'Psicólogo Asignado': this.getNombrePsicologo(caso),
        'Numero Curso': (caso as any).NUMERO_CURSO || (caso as any).PKEYHOJAVIDA || '',
        'Tipo Curso': (caso as any).TIPO_CURSO || (caso as any).PKEYASPIRANT || '',
        'Documento': caso.DOCUMENTO,
        'Nombre Completo': `${caso.NOMBRE || ''} ${caso.PRIMER_APELLIDO || ''} ${caso.SEGUNDO_APELLIDO || ''}`.trim(),
        'Edad': (caso as any).EDAD,
        'Género': (caso as any).GENERO,
        'Departamento Nacimiento': (caso as any).DEPARTAMENTO_NACIMIENTO || '',
        'Ciudad Nacimiento': (caso as any).CIUDAD_NACIMIENTO || '',
        'Correo': (caso as any).CORREO,
        'Teléfono': (caso as any).TELEFONO,
        'Celular': (caso as any).CELULAR,
        'Ciudad donde reside': (caso as any).CIUDAD,
        'Departamento donde reside': (caso as any).DEPARTAMENTO,
        'Regional': (caso as any).REGIONAL,
        'Estado': (caso as any).ESTADO,
        'Estado Notificación': (caso as any).ESTADO_NOTIFICACION || 'N/A',
        'Estado en Flujo Psicología': estadoFlujo,
        'Consentimiento Recibido': tieneConsentimiento ? 'SÍ' : 'NO',
        'Tipo Reunión': (caso as any).TIPO_REUNION || 'N/A',
        'Fecha Cita': (caso as any).FECHA_HORA_CITA_PSICOLOGIA || 'N/A',
        'Detalle Reunión': (caso as any).DETALLE_REUNION || 'N/A',
        'Tiene Agenda': tieneAgenda ? 'SÍ' : 'NO',
        'Tiene PDF Psicología': tieneResultado ? 'SÍ' : 'NO'
      };
    });

    // Hoja 3: Casos finalizados
    const casosFinalizados = casosDetalle.filter((c) => c['Estado en Flujo Psicología'] === 'FINALIZADO');

    // Hoja 4: Casos pendientes (Tomados + Gestionados)
    const casosPendientes = casosDetalle.filter((c) => c['Estado en Flujo Psicología'] !== 'FINALIZADO');

    // Crear el libro de Excel
    const wb = XLSX.utils.book_new();

    // Agregar hojas
    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticasData);
    const wsDetalle = XLSX.utils.json_to_sheet(casosDetalle);
    const wsFinalizados = XLSX.utils.json_to_sheet(casosFinalizados);
    const wsPendientes = XLSX.utils.json_to_sheet(casosPendientes);

    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Completo');
    XLSX.utils.book_append_sheet(wb, wsFinalizados, 'Casos Finalizados');
    XLSX.utils.book_append_sheet(wb, wsPendientes, 'Casos Pendientes');

    // Descargar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `informe_general_psicologia_${fecha}.xlsx`);

    Swal.fire({
      title: '¡Exportación Exitosa!',
      html: `
        <div class="text-start">
          <p><strong>Archivo exportado:</strong> informe_general_psicologia_${fecha}.xlsx</p>
          <p><strong>Hojas incluidas:</strong></p>
          <ul>
            <li>Estadísticas (${estadisticasData.length} indicadores)</li>
            <li>Detalle Completo (${casosDetalle.length} casos)</li>
            <li>Casos Finalizados (${casosFinalizados.length} casos)</li>
            <li>Casos Pendientes (${casosPendientes.length} casos)</li>
          </ul>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Entendido'
    });
  }

  get porcentajeFinalizados(): number {
    if (this.estadisticas.totalCasos === 0) return 0;
    return (this.estadisticas.casosFinalizados / this.estadisticas.totalCasos) * 100;
  }

  get porcentajePendientes(): number {
    if (this.estadisticas.totalCasos === 0) return 0;
    return (this.estadisticas.casosPendientes / this.estadisticas.totalCasos) * 100;
  }

  get porcentajeSinGestion(): number {
    const total = this.estadisticas.totalCasos + this.estadisticas.casosSinGestion;
    if (total === 0) return 0;
    return (this.estadisticas.casosSinGestion / total) * 100;
  }

  private getChartTheme(): {
    text: string;
    grid: string;
    tooltipBg: string;
    tooltipBorder: string;
    segmentBorder: string;
  } {
    const isDark = this.themeService.isDarkMode();
    if (isDark) {
      return {
        text: 'rgba(255, 255, 255, 0.92)',
        grid: 'rgba(255, 255, 255, 0.14)',
        tooltipBg: 'rgba(15, 23, 42, 0.95)',
        tooltipBorder: 'rgba(255, 255, 255, 0.14)',
        segmentBorder: 'rgba(15, 23, 42, 1)'
      };
    }

    return {
      text: '#000000',
      grid: 'rgba(0, 0, 0, 0.12)',
      tooltipBg: 'rgba(255, 255, 255, 0.96)',
      tooltipBorder: 'rgba(0, 0, 0, 0.14)',
      segmentBorder: '#ffffff'
    };
  }
}
