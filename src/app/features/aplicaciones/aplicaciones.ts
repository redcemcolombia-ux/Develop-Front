import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { API_BASE_URL } from '../../core/api.config';

@Component({
  selector: 'app-aplicaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aplicaciones.html',
  styles: [`
    .stats-section {
      border-bottom: 1px solid #dee2e6;
    }

    .chart-container {
      position: relative;
      height: 200px;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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

    .stats-info {
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #198754;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-text {
      color: #198754;
      font-weight: 600;
    }

    .iframe-container-full {
      position: relative;
      width: 100%;
      height: calc(100vh - 380px);
      min-height: 600px;
    }

    .iframe-wrapper {
      width: 100%;
      height: calc(100% - 65px);
      overflow: hidden;
      padding: 0;
    }

    .whatsapp-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }

    .iframe-header {
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      padding: 1.25rem 1.5rem;
      color: white;
    }
  `]
})
export class Aplicaciones implements OnInit, AfterViewInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);

  @ViewChild('statsChart', { static: false }) statsChartRef!: ElementRef<HTMLCanvasElement>;

  activeTab: string = 'whatsapp-bot';
  whatsappUrl: SafeResourceUrl;
  mensajesEnviados: number = 0;
  private apiUrl = '${API_BASE_URL}/api/hojas-vida/bot/procesados';
  private chart: Chart | null = null;

  constructor() {
    this.whatsappUrl = this.sanitizer.bypassSecurityTrustResourceUrl('${API_BASE_URL}/bot/');
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.actualizarEstadisticas();
  }

  ngAfterViewInit(): void {
    // La gráfica se creará solo cuando haya datos
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  updateWhatsappUrl(url: string): void {
    this.whatsappUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  actualizarEstadisticas(): void {
    this.http.get<any>(this.apiUrl).subscribe({
      next: (response) => {
        if (response.error === 0 && response.response) {
          this.mensajesEnviados = response.response.data || 0;

          if (this.mensajesEnviados > 0) {
            setTimeout(() => {
              if (!this.chart) {
                this.crearGrafica();
              } else {
                this.actualizarGrafica();
              }
            }, 100);
          }
        }
      },
      error: () => {
        this.mensajesEnviados = 0;
      }
    });
  }

  crearGrafica(): void {
    if (!this.statsChartRef?.nativeElement) return;

    const ctx = this.statsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: ['Mensajes Enviados', 'Mensajes Pendientes', 'Tasa de Éxito'],
        datasets: [{
          label: 'Estadísticas WhatsApp Bot',
          data: [this.mensajesEnviados, 0, this.mensajesEnviados > 0 ? 98 : 0],
          backgroundColor: [
            'rgba(25, 211, 102, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(0, 123, 255, 0.8)'
          ],
          borderColor: [
            'rgba(25, 211, 102, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(0, 123, 255, 1)'
          ],
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
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 12
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 12
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  actualizarGrafica(): void {
    if (!this.chart) return;

    this.chart.data.datasets[0].data = [
      this.mensajesEnviados,
      0,
      this.mensajesEnviados > 0 ? 98 : 0
    ];
    this.chart.update();
  }
}
