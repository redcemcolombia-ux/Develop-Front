import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, ElementRef, OnInit, ViewChild, effect, inject } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../shared/theme/theme.service';
import { HojaVida, MisCasosService } from '../misCasos/mis-casos.service';

Chart.register(...registerables);

interface Estadisticas {
  totalCasos: number;
  casosConPDF: number;
  casosSinPDF: number;
  casosConBiometria: number;
  casosSinBiometria: number;
  casosCompletos: number;
  casosIncompletos: number;
  casosAplazadosSinReGestionar: number;
  casosAplazadosReGestionados: number;
  totalCasosAplazados: number;
}

@Component({
  selector: 'app-informe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informe.html',
  styles: [`
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
export class Informe implements OnInit, AfterViewInit {
  private readonly service = inject(MisCasosService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('chartDocumentos') chartDocumentosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEstados') chartEstadosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartComparativo') chartComparativoRef?: ElementRef<HTMLCanvasElement>;

  casos: HojaVida[] = [];
  casosAplazados: HojaVida[] = [];
  estadisticas: Estadisticas = {
    totalCasos: 0,
    casosConPDF: 0,
    casosSinPDF: 0,
    casosConBiometria: 0,
    casosSinBiometria: 0,
    casosCompletos: 0,
    casosIncompletos: 0,
    casosAplazadosSinReGestionar: 0,
    casosAplazadosReGestionados: 0,
    totalCasosAplazados: 0
  };
  isLoading = false;

  private chartDocumentos?: Chart;
  private chartEstados?: Chart;
  private chartComparativo?: Chart;

  constructor() {
    const themeEffect = effect(() => {
      this.themeService.isDarkMode();
      if (this.isLoading) return;
      if (!this.chartDocumentosRef || !this.chartEstadosRef || !this.chartComparativoRef) return;
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

    const ipsId = this.getLoggedIpsId();

    if (!ipsId) {
      this.isLoading = false;
      this.cdr.detectChanges();
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener el ID de la IPS. Por favor, inicie sesión nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Cargar ambos servicios en paralelo
    forkJoin({
      casosTomados: this.service.consultarCasosTomados(ipsId),
      casosAplazados: this.service.consultarCasosRetornoIps(ipsId)
    }).subscribe({
      next: (resp) => {
        // Procesar casos tomados
        if (resp.casosTomados.error === 0) {
          this.casos = resp.casosTomados.response?.data ?? [];
        } else {
          this.casos = [];
        }

        // Procesar casos aplazados
        if (resp.casosAplazados.error === 0) {
          this.casosAplazados = resp.casosAplazados.response?.casos ?? [];
        } else {
          this.casosAplazados = [];
        }

        this.calcularEstadisticas();
        this.isLoading = false;
        this.cdr.detectChanges();

        // Crear gráficos solo si hay datos
        if (this.estadisticas.totalCasos > 0 || this.estadisticas.totalCasosAplazados > 0) {
          setTimeout(() => {
            this.crearGraficos();
          }, 100);
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
    this.estadisticas.casosConPDF = this.casos.filter((c) => c.PDF_URL && c.PDF_URL.trim() !== '').length;
    this.estadisticas.casosSinPDF = this.estadisticas.totalCasos - this.estadisticas.casosConPDF;
    this.estadisticas.casosConBiometria = this.casos.filter(
      (c) => c.RUTA_BIOMETRIA && c.RUTA_BIOMETRIA.ruta && c.RUTA_BIOMETRIA.ruta.trim() !== ''
    ).length;
    this.estadisticas.casosSinBiometria = this.estadisticas.totalCasos - this.estadisticas.casosConBiometria;
    this.estadisticas.casosCompletos = this.casos.filter((c) => {
      const tienePDF = c.PDF_URL && c.PDF_URL.trim() !== '';
      const tieneBio = c.RUTA_BIOMETRIA && c.RUTA_BIOMETRIA.ruta && c.RUTA_BIOMETRIA.ruta.trim() !== '';
      return tienePDF && tieneBio;
    }).length;
    this.estadisticas.casosIncompletos = this.estadisticas.totalCasos - this.estadisticas.casosCompletos;

    // Calcular estadísticas de casos aplazados
    this.estadisticas.totalCasosAplazados = this.casosAplazados.length;
    this.estadisticas.casosAplazadosSinReGestionar = this.casosAplazados.filter(
      (c) => !c.SEGUNDA_GESTION_IPS
    ).length;
    this.estadisticas.casosAplazadosReGestionados = this.casosAplazados.filter(
      (c) => c.SEGUNDA_GESTION_IPS === true
    ).length;
  }

  crearGraficos(): void {
    this.crearGraficoDocumentos();
    this.crearGraficoEstados();
    this.crearGraficoComparativo();
  }

  crearGraficoDocumentos(): void {
    if (!this.chartDocumentosRef || this.estadisticas.totalCasos === 0) return;

    if (this.chartDocumentos) {
      this.chartDocumentos.destroy();
    }

    const theme = this.getChartTheme();

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Casos Completos', 'Casos Incompletos'],
        datasets: [
          {
            data: [this.estadisticas.casosCompletos, this.estadisticas.casosIncompletos],
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
            text: 'Estado de Documentación',
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

    this.chartDocumentos = new Chart(this.chartDocumentosRef.nativeElement, config);
  }

  crearGraficoEstados(): void {
    if (!this.chartEstadosRef || this.estadisticas.totalCasos === 0) return;

    if (this.chartEstados) {
      this.chartEstados.destroy();
    }

    const theme = this.getChartTheme();

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: ['PDF Cargado', 'PDF Pendiente', 'Biometría Cargada', 'Biometría Pendiente'],
        datasets: [
          {
            label: 'Cantidad de Casos',
            data: [
              this.estadisticas.casosConPDF,
              this.estadisticas.casosSinPDF,
              this.estadisticas.casosConBiometria,
              this.estadisticas.casosSinBiometria
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
            text: 'Estado de Documentos por Tipo',
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

    this.chartEstados = new Chart(this.chartEstadosRef.nativeElement, config);
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
        labels: ['Total', 'Con PDF', 'Con Biometría', 'Completos'],
        datasets: [
          {
            label: 'Casos',
            data: [
              this.estadisticas.totalCasos,
              this.estadisticas.casosConPDF,
              this.estadisticas.casosConBiometria,
              this.estadisticas.casosCompletos
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
      { Indicador: 'Total de Casos Tomados', Cantidad: this.estadisticas.totalCasos },
      { Indicador: 'Casos con PDF Cargado', Cantidad: this.estadisticas.casosConPDF },
      { Indicador: 'Casos sin PDF', Cantidad: this.estadisticas.casosSinPDF },
      { Indicador: 'Casos con Biometría Cargada', Cantidad: this.estadisticas.casosConBiometria },
      { Indicador: 'Casos sin Biometría', Cantidad: this.estadisticas.casosSinBiometria },
      { Indicador: 'Casos Totalmente Gestionados', Cantidad: this.estadisticas.casosCompletos },
      { Indicador: 'Casos Pendientes', Cantidad: this.estadisticas.casosIncompletos },
      { Indicador: '% Casos Completos', Cantidad: `${((this.estadisticas.casosCompletos / this.estadisticas.totalCasos) * 100).toFixed(2)}%` },
      { Indicador: '% PDF Cargado', Cantidad: `${((this.estadisticas.casosConPDF / this.estadisticas.totalCasos) * 100).toFixed(2)}%` },
      { Indicador: '% Biometría Cargada', Cantidad: `${((this.estadisticas.casosConBiometria / this.estadisticas.totalCasos) * 100).toFixed(2)}%` },
      { Indicador: '', Cantidad: '' },
      { Indicador: '--- CASOS APLAZADOS ---', Cantidad: '' },
      { Indicador: 'Total Casos Aplazados', Cantidad: this.estadisticas.totalCasosAplazados },
      { Indicador: 'Casos Aplazados Re-Gestionados', Cantidad: this.estadisticas.casosAplazadosReGestionados },
      { Indicador: 'Casos Aplazados Sin Re-Gestionar', Cantidad: this.estadisticas.casosAplazadosSinReGestionar },
      { Indicador: '% Re-Gestionados', Cantidad: `${this.porcentajeAplazadosReGestionados.toFixed(2)}%` },
      { Indicador: '% Sin Re-Gestionar', Cantidad: `${this.porcentajeAplazadosSinReGestionar.toFixed(2)}%` }
    ];

    // Hoja 2: Detalle completo de casos
    const casosDetalle = this.casos.map((caso) => {
      const tienePDF = caso.PDF_URL && caso.PDF_URL.trim() !== '';
      const tieneBio = caso.RUTA_BIOMETRIA && caso.RUTA_BIOMETRIA.ruta && caso.RUTA_BIOMETRIA.ruta.trim() !== '';
      const estaCompleto = tienePDF && tieneBio;

      return {
        'Numero Curso': caso.NUMERO_CURSO || caso.PKEYHOJAVIDA || '',
        'Tipo Curso': caso.TIPO_CURSO || caso.PKEYASPIRANT || '',
        'Documento': caso.DOCUMENTO,
        'Nombre Completo': `${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO}`,
        'Edad': caso.EDAD,
        'Género': caso.GENERO,
        'Departamento Nacimiento': caso.DEPARTAMENTO_NACIMIENTO || '',
        'Ciudad Nacimiento': caso.CIUDAD_NACIMIENTO || '',
        'Correo': caso.CORREO,
        'Teléfono': caso.TELEFONO,
        'Celular': caso.CELULAR,
        'Ciudad Examenes': caso.CIUDAD,
        'Departamento Examenes': caso.DEPARTAMENTO,
        'Regional': caso.REGIONAL,
        'Estado': caso.ESTADO,
        'Exámenes': caso.EXAMENES || 'N/A',
        'Fecha Cita': caso.FECHA_HORA ? new Date(caso.FECHA_HORA).toLocaleString('es-CO') : 'N/A',
        'IPS': caso.NOMBREIPS || 'N/A',
        'Recomendaciones': caso.RECOMENDACIONES || 'N/A',
        'PDF Cargado': tienePDF ? 'SÍ' : 'NO',
        'Biometría Cargada': tieneBio ? 'SÍ' : 'NO',
        'Estado Gestión': estaCompleto ? 'COMPLETO' : 'PENDIENTE'
      };
    });

    // Hoja 3: Casos completos
    const casosCompletos = casosDetalle.filter((c) => c['Estado Gestión'] === 'COMPLETO');

    // Hoja 4: Casos pendientes
    const casosPendientes = casosDetalle.filter((c) => c['Estado Gestión'] === 'PENDIENTE');

    // Hoja 5: Casos Aplazados
    const casosAplazadosDetalle = this.casosAplazados.map((caso) => ({
      'Documento': caso.DOCUMENTO,
      'Nombre Completo': `${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO}`,
      'Edad': caso.EDAD,
      'Género': caso.GENERO,
      'Ciudad': caso.CIUDAD,
      'Estado de Cierre': caso.ESTADO_CIERRE,
      'Tipo de Cierre': caso.TIPO_CIERRE,
      'Fecha de Cierre': caso.FECHA_CIERRE ? new Date(caso.FECHA_CIERRE).toLocaleString('es-CO') : 'N/A',
      'Notas de Cierre': caso.NOTAS_CIERRE || 'N/A',
      'Re-Gestionado': caso.SEGUNDA_GESTION_IPS ? 'SÍ' : 'NO',
      'Exámenes': caso.EXAMENES || 'N/A',
      'IPS': caso.IPS_ID?.NOMBRE_IPS || 'N/A'
    }));

    // Hoja 6: Casos Aplazados Re-Gestionados
    const casosAplazadosReGestionados = casosAplazadosDetalle.filter((c) => c['Re-Gestionado'] === 'SÍ');

    // Hoja 7: Casos Aplazados Sin Re-Gestionar
    const casosAplazadosSinReGestionar = casosAplazadosDetalle.filter((c) => c['Re-Gestionado'] === 'NO');

    // Crear el libro de Excel
    const wb = XLSX.utils.book_new();

    // Agregar hojas
    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticasData);
    const wsDetalle = XLSX.utils.json_to_sheet(casosDetalle);
    const wsCompletos = XLSX.utils.json_to_sheet(casosCompletos);
    const wsPendientes = XLSX.utils.json_to_sheet(casosPendientes);
    const wsAplazados = XLSX.utils.json_to_sheet(casosAplazadosDetalle);
    const wsAplazadosReGest = XLSX.utils.json_to_sheet(casosAplazadosReGestionados);
    const wsAplazadosSinReGest = XLSX.utils.json_to_sheet(casosAplazadosSinReGestionar);

    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Completo');
    XLSX.utils.book_append_sheet(wb, wsCompletos, 'Casos Completos');
    XLSX.utils.book_append_sheet(wb, wsPendientes, 'Casos Pendientes');
    XLSX.utils.book_append_sheet(wb, wsAplazados, 'Casos Aplazados');
    XLSX.utils.book_append_sheet(wb, wsAplazadosReGest, 'Aplazados Re-Gestionados');
    XLSX.utils.book_append_sheet(wb, wsAplazadosSinReGest, 'Aplazados Sin Re-Gestión');

    // Descargar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `informe_gestion_${fecha}.xlsx`);

    Swal.fire({
      title: '¡Exportación Exitosa!',
      html: `
        <div class="text-start">
          <p><strong>Archivo exportado:</strong> informe_gestion_${fecha}.xlsx</p>
          <p><strong>Hojas incluidas:</strong></p>
          <ul>
            <li>Estadísticas (${estadisticasData.length} indicadores)</li>
            <li>Detalle Completo (${casosDetalle.length} casos)</li>
            <li>Casos Completos (${casosCompletos.length} casos)</li>
            <li>Casos Pendientes (${casosPendientes.length} casos)</li>
            <li>Casos Aplazados (${casosAplazadosDetalle.length} casos)</li>
            <li>Aplazados Re-Gestionados (${casosAplazadosReGestionados.length} casos)</li>
            <li>Aplazados Sin Re-Gestión (${casosAplazadosSinReGestionar.length} casos)</li>
          </ul>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Entendido'
    });
  }

  get porcentajeCompletos(): number {
    if (this.estadisticas.totalCasos === 0) return 0;
    return (this.estadisticas.casosCompletos / this.estadisticas.totalCasos) * 100;
  }

  get porcentajePDF(): number {
    if (this.estadisticas.totalCasos === 0) return 0;
    return (this.estadisticas.casosConPDF / this.estadisticas.totalCasos) * 100;
  }

  get porcentajeBiometria(): number {
    if (this.estadisticas.totalCasos === 0) return 0;
    return (this.estadisticas.casosConBiometria / this.estadisticas.totalCasos) * 100;
  }

  get porcentajeAplazadosReGestionados(): number {
    if (this.estadisticas.totalCasosAplazados === 0) return 0;
    return (this.estadisticas.casosAplazadosReGestionados / this.estadisticas.totalCasosAplazados) * 100;
  }

  get porcentajeAplazadosSinReGestionar(): number {
    if (this.estadisticas.totalCasosAplazados === 0) return 0;
    return (this.estadisticas.casosAplazadosSinReGestionar / this.estadisticas.totalCasosAplazados) * 100;
  }

  private getLoggedIpsId(): string | null {
    const user = this.authService.getUser() as unknown;
    const value =
      this.pickStringish(user, 'ips_id') ??
      this.pickStringish(user, 'ipsId') ??
      this.pickStringish(user, 'IPS_ID') ??
      this.pickStringish(user, 'idIps') ??
      this.pickStringish(user, 'id_ips');
    return value;
  }

  private pickStringish(source: unknown, key: string): string | null {
    if (!source || typeof source !== 'object') return null;
    const record = source as Record<string, unknown>;
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return null;
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
