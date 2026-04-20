import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, ElementRef, OnInit, ViewChild, effect, inject } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../shared/theme/theme.service';
import { PsicologiaGestionService } from '../psicologiaGestion/psicologia-gestion.service';

Chart.register(...registerables);

interface EstadisticasPs {
  totalCasos: number;
  casosConAgenda: number;
  casosSinAgenda: number;
  casosConResultado: number;
  casosSinResultado: number;
  casosFinalizados: number;
  casosPendientes: number;
  casosConConsentimiento: number;
  casosSinConsentimiento: number;
}

@Component({
  selector: 'app-informe-ps',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informe-ps.html',
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
export class InformePs implements OnInit, AfterViewInit {
  private readonly service = inject(PsicologiaGestionService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('chartEstados') chartEstadosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartResultados') chartResultadosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartComparativo') chartComparativoRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartConsentimiento') chartConsentimientoRef?: ElementRef<HTMLCanvasElement>;

  casos: any[] = [];
  estadisticas: EstadisticasPs = {
    totalCasos: 0,
    casosConAgenda: 0,
    casosSinAgenda: 0,
    casosConResultado: 0,
    casosSinResultado: 0,
    casosFinalizados: 0,
    casosPendientes: 0,
    casosConConsentimiento: 0,
    casosSinConsentimiento: 0
  };
  isLoading = false;

  private chartEstados?: Chart;
  private chartResultados?: Chart;
  private chartComparativo?: Chart;
  private chartConsentimiento?: Chart;

  constructor() {
    const themeEffect = effect(() => {
      this.themeService.isDarkMode();
      if (this.isLoading) return;
      if (!this.chartEstadosRef || !this.chartResultadosRef || !this.chartComparativoRef || !this.chartConsentimientoRef) return;
      if (this.estadisticas.totalCasos === 0) return;
      setTimeout(() => this.crearGraficos(), 0);
    });
    this.destroyRef.onDestroy(() => themeEffect.destroy());
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.service.consultarCasosPorUsuarioSic().subscribe({
      next: (resp) => {
        if (resp?.error === 0) {
          const data = resp.response?.data ?? resp.response ?? resp.data ?? [];
          this.casos = Array.isArray(data) ? data : [];
          this.calcularEstadisticas();
          this.isLoading = false;
          this.cdr.detectChanges();

          // Crear gráficos solo si hay datos
          if (this.estadisticas.totalCasos > 0) {
            setTimeout(() => {
              this.crearGraficos();
            }, 100);
          }
        } else {
          this.casos = [];
          this.isLoading = false;
          this.cdr.detectChanges();

          Swal.fire({
            title: 'Información',
            text: resp.response?.mensaje || 'No se encontraron casos',
            icon: 'info',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudo conectar con el servidor.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  calcularEstadisticas(): void {
    this.estadisticas.totalCasos = this.casos.length;
    this.estadisticas.casosConAgenda = this.casos.filter((c) => c.TIPO_REUNION).length;
    this.estadisticas.casosSinAgenda = this.estadisticas.totalCasos - this.estadisticas.casosConAgenda;
    this.estadisticas.casosConResultado = this.casos.filter((c) => c.RUTA_PSICOLOGIA).length;
    this.estadisticas.casosSinResultado = this.estadisticas.totalCasos - this.estadisticas.casosConResultado;

    // Calcular casos con y sin consentimiento
    this.estadisticas.casosConConsentimiento = this.casos.filter((c) => {
      return c.RUTA_NOTIFICACION_RECIBIDA && c.RUTA_NOTIFICACION_RECIBIDA.trim() !== '';
    }).length;
    this.estadisticas.casosSinConsentimiento = this.estadisticas.totalCasos - this.estadisticas.casosConConsentimiento;

    // Casos finalizados = tienen agenda Y resultado de psicología
    this.estadisticas.casosFinalizados = this.casos.filter((c) => {
      return c.TIPO_REUNION && c.RUTA_PSICOLOGIA;
    }).length;
    this.estadisticas.casosPendientes = this.estadisticas.totalCasos - this.estadisticas.casosFinalizados;
  }

  crearGraficos(): void {
    this.crearGraficoEstados();
    this.crearGraficoResultados();
    this.crearGraficoComparativo();
    this.crearGraficoConsentimiento();
  }

  crearGraficoEstados(): void {
    if (!this.chartEstadosRef || this.estadisticas.totalCasos === 0) return;

    if (this.chartEstados) {
      this.chartEstados.destroy();
    }

    const theme = this.getChartTheme();

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Casos Finalizados', 'Casos Pendientes'],
        datasets: [
          {
            data: [this.estadisticas.casosFinalizados, this.estadisticas.casosPendientes],
            backgroundColor: ['#198754', '#ffc107'],
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
            text: 'Estado de Casos',
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
    if (!this.chartResultadosRef || this.estadisticas.totalCasos === 0) return;

    if (this.chartResultados) {
      this.chartResultados.destroy();
    }

    const theme = this.getChartTheme();

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: ['Agenda Programada', 'Sin Agenda', 'Resultado Cargado', 'Resultado Pendiente'],
        datasets: [
          {
            label: 'Cantidad de Casos',
            data: [
              this.estadisticas.casosConAgenda,
              this.estadisticas.casosSinAgenda,
              this.estadisticas.casosConResultado,
              this.estadisticas.casosSinResultado
            ],
            backgroundColor: ['#0d6efd', '#dc3545', '#198754', '#ffc107'],
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
            text: 'Gestión por Etapas',
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
    if (!this.chartComparativoRef || this.estadisticas.totalCasos === 0) return;

    if (this.chartComparativo) {
      this.chartComparativo.destroy();
    }

    const theme = this.getChartTheme();

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: ['Total', 'Con Agenda', 'Con Resultado', 'Finalizados'],
        datasets: [
          {
            label: 'Casos',
            data: [
              this.estadisticas.totalCasos,
              this.estadisticas.casosConAgenda,
              this.estadisticas.casosConResultado,
              this.estadisticas.casosFinalizados
            ],
            backgroundColor: ['#6c757d', '#0d6efd', '#198754', '#28a745'],
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
            text: 'Comparativo General',
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

  crearGraficoConsentimiento(): void {
    if (!this.chartConsentimientoRef || this.estadisticas.totalCasos === 0) return;

    if (this.chartConsentimiento) {
      this.chartConsentimiento.destroy();
    }

    const theme = this.getChartTheme();

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Con Consentimiento', 'Sin Consentimiento'],
        datasets: [
          {
            data: [this.estadisticas.casosConConsentimiento, this.estadisticas.casosSinConsentimiento],
            backgroundColor: ['#dc3545', '#fd7e14'],
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
            text: 'Estado de Consentimientos',
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

    this.chartConsentimiento = new Chart(this.chartConsentimientoRef.nativeElement, config);
  }

  exportarExcel(): void {
    if (this.casos.length === 0) {
      Swal.fire({
        title: 'Sin Datos',
        text: 'No hay casos para exportar',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Hoja 1: Estadísticas generales
    const estadisticasData = [
      { Indicador: 'Total de Casos Asignados', Cantidad: this.estadisticas.totalCasos },
      { Indicador: 'Casos con Agenda Programada', Cantidad: this.estadisticas.casosConAgenda },
      { Indicador: 'Casos sin Agenda', Cantidad: this.estadisticas.casosSinAgenda },
      { Indicador: 'Casos con Resultado de Psicología', Cantidad: this.estadisticas.casosConResultado },
      { Indicador: 'Casos sin Resultado', Cantidad: this.estadisticas.casosSinResultado },
      { Indicador: 'Casos con Consentimiento Recibido', Cantidad: this.estadisticas.casosConConsentimiento },
      { Indicador: 'Casos sin Consentimiento', Cantidad: this.estadisticas.casosSinConsentimiento },
      { Indicador: 'Casos Finalizados', Cantidad: this.estadisticas.casosFinalizados },
      { Indicador: 'Casos Pendientes', Cantidad: this.estadisticas.casosPendientes },
      { Indicador: '% Casos Finalizados', Cantidad: `${((this.estadisticas.casosFinalizados / this.estadisticas.totalCasos) * 100).toFixed(2)}%` },
      { Indicador: '% Con Agenda', Cantidad: `${((this.estadisticas.casosConAgenda / this.estadisticas.totalCasos) * 100).toFixed(2)}%` },
      { Indicador: '% Con Resultado', Cantidad: `${((this.estadisticas.casosConResultado / this.estadisticas.totalCasos) * 100).toFixed(2)}%` },
      { Indicador: '% Con Consentimiento', Cantidad: `${((this.estadisticas.casosConConsentimiento / this.estadisticas.totalCasos) * 100).toFixed(2)}%` }
    ];

    // Hoja 2: Detalle completo de casos
    const casosDetalle = this.casos.map((caso) => {
      const tieneAgenda = caso.TIPO_REUNION ? true : false;
      const tieneResultado = caso.RUTA_PSICOLOGIA ? true : false;
      const tieneConsentimiento = caso.RUTA_NOTIFICACION_RECIBIDA && caso.RUTA_NOTIFICACION_RECIBIDA.trim() !== '';
      const estaFinalizado = tieneAgenda && tieneResultado;

      return {
        'Numero Curso': caso.NUMERO_CURSO || caso.PKEYHOJAVIDA || '',
        'Tipo Curso': caso.TIPO_CURSO || caso.PKEYASPIRANT || '',
        'Documento': caso.DOCUMENTO,
        'Nombre Completo': `${caso.NOMBRE || ''} ${caso.PRIMER_APELLIDO || ''} ${caso.SEGUNDO_APELLIDO || ''}`.trim(),
        'Edad': caso.EDAD,
        'Género': caso.GENERO,
        'Departamento Nacimiento': caso.DEPARTAMENTO_NACIMIENTO || '',
        'Ciudad Nacimiento': caso.CIUDAD_NACIMIENTO || '',
        'Correo': caso.CORREO,
        'Teléfono': caso.TELEFONO,
        'Celular': caso.CELULAR,
        'Ciudad donde reside': caso.CIUDAD,
        'Departamento donde reside': caso.DEPARTAMENTO,
        'Regional': caso.REGIONAL,
        'Estado': caso.ESTADO,
        'Estado Notificación': caso.ESTADO_NOTIFICACION || 'N/A',
        'Consentimiento Recibido': tieneConsentimiento ? 'SÍ' : 'NO',
        'Tipo Reunión': caso.TIPO_REUNION || 'N/A',
        'Fecha Cita': caso.FECHA_HORA_CITA_PSICOLOGIA || 'N/A',
        'Detalle Reunión': caso.DETALLE_REUNION || 'N/A',
        'Agenda Programada': tieneAgenda ? 'SÍ' : 'NO',
        'Resultado Cargado': tieneResultado ? 'SÍ' : 'NO',
        'Estado Gestión': estaFinalizado ? 'FINALIZADO' : 'PENDIENTE'
      };
    });

    // Hoja 3: Casos finalizados
    const casosFinalizados = casosDetalle.filter((c) => c['Estado Gestión'] === 'FINALIZADO');

    // Hoja 4: Casos pendientes
    const casosPendientes = casosDetalle.filter((c) => c['Estado Gestión'] === 'PENDIENTE');

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
    XLSX.writeFile(wb, `informe_psicologia_${fecha}.xlsx`);

    Swal.fire({
      title: '¡Exportación Exitosa!',
      html: `
        <div class="text-start">
          <p><strong>Archivo exportado:</strong> informe_psicologia_${fecha}.xlsx</p>
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

  get porcentajeAgenda(): number {
    if (this.estadisticas.totalCasos === 0) return 0;
    return (this.estadisticas.casosConAgenda / this.estadisticas.totalCasos) * 100;
  }

  get porcentajeResultado(): number {
    if (this.estadisticas.totalCasos === 0) return 0;
    return (this.estadisticas.casosConResultado / this.estadisticas.totalCasos) * 100;
  }

  get porcentajeConsentimiento(): number {
    if (this.estadisticas.totalCasos === 0) return 0;
    return (this.estadisticas.casosConConsentimiento / this.estadisticas.totalCasos) * 100;
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
