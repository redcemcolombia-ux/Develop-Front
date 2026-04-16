import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { HojaVidaService } from '../hoja-vida.service';

@Component({
  selector: 'app-graficas-hojas-vida',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graficas-hojas-vida.html',
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
      font-size: 1.125rem;
      font-weight: 600;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .chart-placeholder-subtext {
      font-size: 0.875rem;
      color: #adb5bd;
      margin-bottom: 0;
    }
  `]
})
export class GraficasHojasVida implements AfterViewInit, OnDestroy {
  private readonly hojaVidaService = inject(HojaVidaService);

  @ViewChild('pieChart', { static: false }) pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cityChart', { static: false }) cityChartRef!: ElementRef<HTMLCanvasElement>;

  pieChart: Chart<'pie'> | null = null;
  barChart: Chart<'bar'> | null = null;
  cityChart: Chart<'bar'> | null = null;

  estadisticasEstado: any = {};
  estadisticasCiudad: any = {};
  totalHojasVida = 0;
  ultimaActualizacion = new Date();
  isLoadingGraficas = false;

  hojasVidaExistentes: any[] = [];

  constructor() {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    this.iniciarGraficas();
  }

  ngOnDestroy(): void {
    this.destruirGraficas();
  }

  iniciarGraficas(): void {
    this.cargarDatosGraficas();
  }

  cargarDatosGraficas(): void {
    this.isLoadingGraficas = true;

    this.hojaVidaService.consultarHojasVida().subscribe({
      next: (response) => {
        this.isLoadingGraficas = false;

        if (response.error === 0 && response.response?.data) {
          const datos = response.response.data;
          this.hojasVidaExistentes = datos;
          this.procesarDatosParaGraficas(datos);
          this.ultimaActualizacion = new Date();

          // Solo crear gráficas si hay datos
          if (this.totalHojasVida > 0) {
            setTimeout(() => {
              this.crearGraficas();
            }, 100);
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los datos para las gráficas'
          });
        }
      },
      error: () => {
        this.isLoadingGraficas = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al conectar con el servidor'
        });
      }
    });
  }

  procesarDatosParaGraficas(datos: any[]): void {
    this.totalHojasVida = datos.length;

    // Procesar estadísticas por estado
    this.estadisticasEstado = {};
    datos.forEach(item => {
      const estado = item.ESTADO || 'Sin Estado';
      this.estadisticasEstado[estado] = (this.estadisticasEstado[estado] || 0) + 1;
    });

    // Procesar estadísticas por ciudad (top 10)
    const ciudadCount: any = {};
    datos.forEach(item => {
      const ciudad = item.CIUDAD || 'Sin Ciudad';
      ciudadCount[ciudad] = (ciudadCount[ciudad] || 0) + 1;
    });

    // Obtener top 10 ciudades
    this.estadisticasCiudad = Object.entries(ciudadCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as any);
  }

  crearGraficas(): void {
    this.destruirGraficas();
    this.crearGraficaTorta();
    this.crearGraficaBarras();
    this.crearGraficaCiudades();
  }

  crearGraficaTorta(): void {
    if (!this.pieChartRef?.nativeElement || this.totalHojasVida === 0) return;

    const ctx = this.pieChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(this.estadisticasEstado);
    const data = Object.values(this.estadisticasEstado);
    const colors = this.generarColores(labels.length);

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data as number[],
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 13
              },
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: (context) => {
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.pieChart = new Chart(ctx, config);
  }

  crearGraficaBarras(): void {
    if (!this.barChartRef?.nativeElement || this.totalHojasVida === 0) return;

    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(this.estadisticasEstado);
    const data = Object.values(this.estadisticasEstado);
    const colors = this.generarColores(labels.length);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad',
          data: data as number[],
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.9', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 12
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              font: {
                size: 12
              }
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.barChart = new Chart(ctx, config);
  }

  crearGraficaCiudades(): void {
    if (!this.cityChartRef?.nativeElement || this.totalHojasVida === 0) return;

    const ctx = this.cityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(this.estadisticasCiudad);
    const data = Object.values(this.estadisticasCiudad);
    const colors = this.generarColores(labels.length);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad',
          data: data as number[],
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.9', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 12
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            ticks: {
              font: {
                size: 12
              }
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.cityChart = new Chart(ctx, config);
  }

  generarColores(cantidad: number): string[] {
    const colores = [
      'rgba(102, 126, 234, 0.9)',
      'rgba(237, 100, 166, 0.9)',
      'rgba(255, 195, 113, 0.9)',
      'rgba(46, 213, 115, 0.9)',
      'rgba(75, 123, 236, 0.9)',
      'rgba(255, 107, 129, 0.9)',
      'rgba(72, 219, 251, 0.9)',
      'rgba(181, 52, 113, 0.9)',
      'rgba(253, 167, 223, 0.9)',
      'rgba(162, 155, 254, 0.9)'
    ];

    const resultado = [];
    for (let i = 0; i < cantidad; i++) {
      resultado.push(colores[i % colores.length]);
    }
    return resultado;
  }

  destruirGraficas(): void {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }
    if (this.cityChart) {
      this.cityChart.destroy();
      this.cityChart = null;
    }
  }

  descargarExcel(): void {
    if (this.hojasVidaExistentes.length === 0) {
      this.hojaVidaService.consultarHojasVida().subscribe({
        next: (response) => {
          if (response.error === 0 && response.response?.data) {
            this.generarExcel(response.response.data);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron cargar los datos para exportar'
            });
          }
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al conectar con el servidor'
          });
        }
      });
    } else {
      this.generarExcel(this.hojasVidaExistentes);
    }
  }

  generarExcel(datos: any[]): void {
    try {
      const datosLimpios = datos.map(item => {
        const { PDF_URL, USUARIO_ID, ...resto } = item;
        return resto;
      });

      const ws = XLSX.utils.json_to_sheet(datosLimpios);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hojas de Vida');

      const colWidths = Object.keys(datosLimpios[0] || {}).map(() => ({ wch: 20 }));
      ws['!cols'] = colWidths;

      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `hojas_de_vida_${fecha}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      Swal.fire({
        icon: 'success',
        title: 'Descarga Exitosa',
        text: `El archivo ${nombreArchivo} se ha descargado correctamente`,
        timer: 3000,
        showConfirmButton: false
      });

    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al generar el archivo Excel'
      });
    }
  }
}
