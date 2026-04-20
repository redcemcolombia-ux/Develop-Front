import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { HojaVidaService } from '../hoja-vida.service';

@Component({
  selector: 'app-graficas-hojas-vida',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      color: var(--bs-secondary);
      opacity: 0.5;
      margin-bottom: 1rem;
    }

    .chart-placeholder-text {
      font-size: 1rem;
      font-weight: 600;
      color: var(--bs-secondary);
      margin-bottom: 0.5rem;
    }

    .chart-placeholder-subtext {
      font-size: 0.875rem;
      color: var(--bs-secondary);
      opacity: 0.7;
      margin-bottom: 0;
    }
  `]
})
export class GraficasHojasVida implements AfterViewInit, OnDestroy {
  private readonly hojaVidaService = inject(HojaVidaService);

  @ViewChild('dynamicChart', { static: false }) dynamicChartRef!: ElementRef<HTMLCanvasElement>;

  dynamicChart: Chart | null = null;

  estadisticasEstado: any = {};
  totalHojasVida = 0;
  totalProcesadas = 0;
  totalEnProceso = 0;
  totalSinGestion = 0;
  totalCerrados = 0;
  totalAplazados = 0;
  totalParaGestionar = 0;
  ultimaActualizacion = new Date();
  isLoadingGraficas = false;

  hojasVidaExistentes: any[] = [];

  // Configuración de gráficas dinámicas
  camposDisponibles = [
    { campo: 'CIUDAD', label: 'Ciudad', seleccionado: false },
    { campo: 'DEPARTAMENTO', label: 'Departamento', seleccionado: false },
    { campo: 'REGIONAL', label: 'Regional', seleccionado: false },
    { campo: 'GENERO', label: 'Género', seleccionado: false },
    { campo: 'EDAD', label: 'Edad', seleccionado: false },
    { campo: 'ESTRATO', label: 'Estrato', seleccionado: false },
    { campo: 'ESTADO', label: 'Estado', seleccionado: false },
    { campo: 'EXAMENES', label: 'Exámenes', seleccionado: false },
    { campo: 'ESTADO_CIERRE', label: 'Estado de Cierre', seleccionado: false },
    { campo: 'TIPO_CIERRE', label: 'Tipo de Cierre', seleccionado: false },
    { campo: 'CATEGORIA_CASO', label: 'Categoría de Caso', seleccionado: false }
  ];

  tiposGrafica: { tipo: 'bar' | 'pie' | 'doughnut' | 'line'; label: string; icono: string }[] = [
    { tipo: 'bar', label: 'Barras', icono: '📊' },
    { tipo: 'pie', label: 'Pastel', icono: '🥧' },
    { tipo: 'doughnut', label: 'Dona', icono: '🍩' },
    { tipo: 'line', label: 'Líneas', icono: '📈' }
  ];

  tipoGraficaSeleccionado: 'bar' | 'pie' | 'doughnut' | 'line' = 'bar';
  mostrarTop10 = true;
  hasDynamicChart = false;

  constructor() {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    // Cargar datos automáticamente al iniciar
    setTimeout(() => {
      this.cargarDatosGraficas();
    }, 0);
  }

  ngOnDestroy(): void {
    this.destruirGraficaDinamica();
  }

  cargarDatosGraficas(): void {
    this.isLoadingGraficas = true;

    this.hojaVidaService.consultarHojasVida().subscribe({
      next: (response) => {
        if (response.error === 0 && response.response?.data) {
          const datos = response.response.data;
          this.hojasVidaExistentes = datos;
          this.procesarDatosParaGraficas(datos);
          this.ultimaActualizacion = new Date();
          this.isLoadingGraficas = false;
        } else {
          this.isLoadingGraficas = false;
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

    // Resetear contadores
    this.totalProcesadas = 0;
    this.totalEnProceso = 0;
    this.totalSinGestion = 0;
    this.totalCerrados = 0;
    this.totalAplazados = 0;
    this.totalParaGestionar = 0;

    // Calcular hojas de vida según la cantidad de PDFs y estado de cierre
    datos.forEach(item => {
      let pdfsCount = 0;

      // Verificar PDF de exámenes
      if (item.PDF_URL && item.PDF_URL !== null && item.PDF_URL.trim() !== '') {
        pdfsCount++;
      }

      // Verificar PDF de biometría
      if (item.RUTA_BIOMETRIA &&
          item.RUTA_BIOMETRIA.ruta !== null &&
          item.RUTA_BIOMETRIA.ruta !== undefined) {
        pdfsCount++;
      }

      // Verificar PDF de psicología
      if (item.RUTA_PSICOLOGIA && typeof item.RUTA_PSICOLOGIA === 'string' && item.RUTA_PSICOLOGIA.trim() !== '') {
        pdfsCount++;
      } else if (item.RUTA_PSICOLOGIA && typeof item.RUTA_PSICOLOGIA === 'object' &&
                 item.RUTA_PSICOLOGIA.ruta !== null && item.RUTA_PSICOLOGIA.ruta !== undefined) {
        pdfsCount++;
      }

      // Clasificar según la cantidad de PDFs
      if (pdfsCount === 3) {
        this.totalProcesadas++;

        // Subclasificar casos procesados
        if (item.ESTADO_CIERRE === 'Apto' || item.ESTADO_CIERRE === 'No Apto') {
          this.totalCerrados++;
        } else if (item.ESTADO_CIERRE === 'Aplazado') {
          this.totalAplazados++;
        } else {
          this.totalParaGestionar++;
        }
      } else if (pdfsCount > 0) {
        this.totalEnProceso++;
      } else {
        this.totalSinGestion++;
      }
    });

    // Procesar estadísticas por estado
    this.estadisticasEstado = {};
    datos.forEach(item => {
      const estado = item.ESTADO || 'Sin Estado';
      this.estadisticasEstado[estado] = (this.estadisticasEstado[estado] || 0) + 1;
    });
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

  destruirGraficaDinamica(): void {
    if (this.dynamicChart) {
      this.dynamicChart.destroy();
      this.dynamicChart = null;
    }
    this.hasDynamicChart = false;
  }

  generarGraficaDinamica(): void {
    const camposSeleccionados = this.camposDisponibles.filter(c => c.seleccionado);

    if (camposSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona campos',
        text: 'Por favor selecciona al menos un campo para graficar'
      });
      return;
    }

    if (this.hojasVidaExistentes.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay datos disponibles. Actualiza las gráficas primero.'
      });
      return;
    }

    // Procesar datos para los campos seleccionados
    const datosGrafica: any = {};

    camposSeleccionados.forEach(campoConfig => {
      const campo = campoConfig.campo;
      const conteo: any = {};

      this.hojasVidaExistentes.forEach(item => {
        let valorRaw;

        // Campo especial: CATEGORIA_CASO se calcula dinámicamente
        if (campo === 'CATEGORIA_CASO') {
          valorRaw = this.calcularCategoriaCaso(item);
        } else {
          valorRaw = item[campo];
        }

        // Normalizar el valor: convertir a string, trimear, y poner en mayúsculas
        const valorNormalizado = this.normalizarValor(valorRaw);
        conteo[valorNormalizado] = (conteo[valorNormalizado] || 0) + 1;
      });

      datosGrafica[campoConfig.label] = conteo;
    });

    // Si solo hay un campo, crear gráfica simple
    if (camposSeleccionados.length === 1) {
      this.crearGraficaSimple(camposSeleccionados[0].label, datosGrafica[camposSeleccionados[0].label]);
    } else {
      // Si hay múltiples campos, crear gráfica comparativa
      this.crearGraficaMultiple(datosGrafica);
    }
  }

  calcularCategoriaCaso(item: any): string {
    // Contar PDFs
    let pdfsCount = 0;

    if (item.PDF_URL && item.PDF_URL !== null && item.PDF_URL.trim() !== '') {
      pdfsCount++;
    }

    if (item.RUTA_BIOMETRIA && item.RUTA_BIOMETRIA.ruta !== null && item.RUTA_BIOMETRIA.ruta !== undefined) {
      pdfsCount++;
    }

    if (item.RUTA_PSICOLOGIA && typeof item.RUTA_PSICOLOGIA === 'string' && item.RUTA_PSICOLOGIA.trim() !== '') {
      pdfsCount++;
    } else if (item.RUTA_PSICOLOGIA && typeof item.RUTA_PSICOLOGIA === 'object' && item.RUTA_PSICOLOGIA.ruta !== null && item.RUTA_PSICOLOGIA.ruta !== undefined) {
      pdfsCount++;
    }

    // Si tiene los 3 PDFs, verificar estado de cierre
    if (pdfsCount === 3) {
      if (item.ESTADO_CIERRE === 'Apto' || item.ESTADO_CIERRE === 'No Apto') {
        return 'Cerrados';
      } else if (item.ESTADO_CIERRE === 'Aplazado') {
        return 'Aplazados';
      } else {
        return 'Para Gestionar';
      }
    } else if (pdfsCount > 0) {
      return 'En Proceso';
    } else {
      return 'Sin Gestión';
    }
  }

  normalizarValor(valor: any): string {
    // Si es null, undefined, o string vacío
    if (valor === null || valor === undefined || valor === '') {
      return 'Sin Dato';
    }

    // Convertir a string y normalizar
    let valorNormalizado = String(valor).trim();

    // Si después de trimear queda vacío
    if (valorNormalizado === '') {
      return 'Sin Dato';
    }

    // Convertir a mayúsculas para unificar
    valorNormalizado = valorNormalizado.toUpperCase();

    // Eliminar tildes y acentos
    valorNormalizado = valorNormalizado
      .normalize('NFD') // Descomponer caracteres con tildes
      .replace(/[\u0300-\u036f]/g, ''); // Eliminar marcas diacríticas

    // Normalizar espacios múltiples a uno solo
    valorNormalizado = valorNormalizado.replace(/\s+/g, ' ');

    // Eliminar puntos, comas y caracteres especiales comunes en nombres de ciudades
    valorNormalizado = valorNormalizado.replace(/[.,;:\-_]/g, ' ');

    // Volver a normalizar espacios después de eliminar caracteres especiales
    valorNormalizado = valorNormalizado.replace(/\s+/g, ' ').trim();

    // Normalización semántica para valores comunes
    valorNormalizado = this.normalizarSemantica(valorNormalizado);

    return valorNormalizado;
  }

  normalizarSemantica(valor: string): string {
    // Normalizar género/sexo
    if (valor === 'F' || valor === 'MUJER' || valor === 'FEM' || valor === 'FEMENINA') {
      return 'FEMENINO';
    }
    if (valor === 'M' || valor === 'HOMBRE' || valor === 'MASC' || valor === 'MASCULINA') {
      return 'MASCULINO';
    }

    // Normalizar estados de cierre
    const estadosCierreNormalizados: { [key: string]: string } = {
      'APTO': 'APTO',
      'NO APTO': 'NO APTO',
      'NOAPTO': 'NO APTO',
      'APLAZADO': 'APLAZADO',
      'APLAZAR': 'APLAZADO'
    };

    if (estadosCierreNormalizados[valor]) {
      return estadosCierreNormalizados[valor];
    }

    // Normalizar categorías de caso
    const categoriasCasoNormalizadas: { [key: string]: string } = {
      'PARA GESTIONAR': 'PARA GESTIONAR',
      'CERRADOS': 'CERRADOS',
      'CERRADO': 'CERRADOS',
      'APLAZADOS': 'APLAZADOS',
      'APLAZADO': 'APLAZADOS',
      'EN PROCESO': 'EN PROCESO',
      'PROCESO': 'EN PROCESO',
      'SIN GESTION': 'SIN GESTION',
      'SIN GESTIONAR': 'SIN GESTION'
    };

    if (categoriasCasoNormalizadas[valor]) {
      return categoriasCasoNormalizadas[valor];
    }

    // Normalizar estados comunes
    const estadosNormalizados: { [key: string]: string } = {
      'EN ESPERA': 'EN ESPERA',
      'ESPERA': 'EN ESPERA',
      'EN GESTION': 'EN GESTION',
      'GESTION': 'EN GESTION',
      'ACTIVO': 'ACTIVO',
      'INACTIVO': 'INACTIVO',
      'GESTIONADO': 'GESTIONADO',
      'PROCESADO': 'PROCESADO',
      'PENDIENTE': 'PENDIENTE'
    };

    if (estadosNormalizados[valor]) {
      return estadosNormalizados[valor];
    }

    // Normalizar departamentos de Colombia
    const departamentosNormalizados: { [key: string]: string } = {
      'AMAZONAS': 'AMAZONAS',
      'ANTIOQUIA': 'ANTIOQUIA', 'ANTIOQUA': 'ANTIOQUIA', 'ANTIQUIA': 'ANTIOQUIA',
      'ARAUCA': 'ARAUCA',
      'ATLANTICO': 'ATLANTICO', 'ATCO': 'ATLANTICO',
      'BOLIVAR': 'BOLIVAR', 'BOLIV': 'BOLIVAR',
      'BOYACA': 'BOYACA', 'BOYA': 'BOYACA',
      'CALDAS': 'CALDAS',
      'CAQUETA': 'CAQUETA', 'CAQTA': 'CAQUETA',
      'CASANARE': 'CASANARE', 'CASA': 'CASANARE',
      'CAUCA': 'CAUCA',
      'CESAR': 'CESAR',
      'CHOCO': 'CHOCO',
      'CORDOBA': 'CORDOBA', 'CORD': 'CORDOBA',
      'CUNDINAMARCA': 'CUNDINAMARCA', 'CUND': 'CUNDINAMARCA', 'CUNDINMCA': 'CUNDINAMARCA',
      'GUAINIA': 'GUAINIA',
      'GUAVIARE': 'GUAVIARE', 'GUAV': 'GUAVIARE',
      'HUILA': 'HUILA',
      'LA GUAJIRA': 'LA GUAJIRA', 'GUAJIRA': 'LA GUAJIRA', 'GUAR': 'LA GUAJIRA',
      'MAGDALENA': 'MAGDALENA', 'MAGD': 'MAGDALENA', 'MAGDA': 'MAGDALENA',
      'META': 'META',
      'NARINO': 'NARINO', 'NARI': 'NARINO',
      'NORTE DE SANTANDER': 'NORTE DE SANTANDER', 'NTE SANTANDER': 'NORTE DE SANTANDER',
      'N DE SANTANDER': 'NORTE DE SANTANDER', 'N SANTANDER': 'NORTE DE SANTANDER',
      'NTE DE SANTANDER': 'NORTE DE SANTANDER',
      'PUTUMAYO': 'PUTUMAYO', 'PUTU': 'PUTUMAYO',
      'QUINDIO': 'QUINDIO', 'QUIN': 'QUINDIO',
      'RISARALDA': 'RISARALDA', 'RISA': 'RISARALDA',
      'SAN ANDRES Y PROVIDENCIA': 'SAN ANDRES Y PROVIDENCIA', 'SAN ANDRES': 'SAN ANDRES Y PROVIDENCIA',
      'S ANDRES Y PROVIDENCIA': 'SAN ANDRES Y PROVIDENCIA', 'SAI': 'SAN ANDRES Y PROVIDENCIA',
      'SANTANDER': 'SANTANDER', 'SANT': 'SANTANDER', 'SDER': 'SANTANDER',
      'SUCRE': 'SUCRE',
      'TOLIMA': 'TOLIMA', 'TOLI': 'TOLIMA',
      'VALLE DEL CAUCA': 'VALLE DEL CAUCA', 'VALLE': 'VALLE DEL CAUCA',
      'VLE DEL CAUCA': 'VALLE DEL CAUCA', 'V DEL CAUCA': 'VALLE DEL CAUCA',
      'VALLE CAUCA': 'VALLE DEL CAUCA',
      'VAUPES': 'VAUPES',
      'VICHADA': 'VICHADA', 'VICH': 'VICHADA',
      'BOGOTA D C': 'BOGOTA', 'BOGOTA DC': 'BOGOTA', 'BOGOTA D.C.': 'BOGOTA', 'BOGOTA D.C': 'BOGOTA'
    };

    if (departamentosNormalizados[valor]) {
      return departamentosNormalizados[valor];
    }

    // Normalizar ciudades de Colombia con abreviaciones y variaciones
    const ciudadesNormalizadas: { [key: string]: string } = {
      // Bogotá
      'BOGOTA': 'BOGOTA', 'BOG': 'BOGOTA', 'BGTA': 'BOGOTA', 'BGT': 'BOGOTA', 'BOGO': 'BOGOTA',
      'SANTAFE DE BOGOTA': 'BOGOTA', 'STA FE DE BOGOTA': 'BOGOTA',
      // Medellín
      'MEDELLIN': 'MEDELLIN', 'MDE': 'MEDELLIN', 'MED': 'MEDELLIN', 'MEDE': 'MEDELLIN', 'MEDELIN': 'MEDELLIN',
      // Cali
      'CALI': 'CALI', 'CLO': 'CALI', 'CLI': 'CALI', 'SANTIAGO DE CALI': 'CALI',
      // Barranquilla
      'BARRANQUILLA': 'BARRANQUILLA', 'BAQ': 'BARRANQUILLA', 'BQLLA': 'BARRANQUILLA',
      'BQUILLA': 'BARRANQUILLA', 'BQTO': 'BARRANQUILLA', 'BARRA': 'BARRANQUILLA', 'BARRQUILLA': 'BARRANQUILLA',
      // Cartagena
      'CARTAGENA': 'CARTAGENA', 'CTG': 'CARTAGENA', 'CARTGNA': 'CARTAGENA', 'CARTA': 'CARTAGENA',
      'CARTAGENA DE INDIAS': 'CARTAGENA',
      // Cúcuta
      'CUCUTA': 'CUCUTA', 'CUC': 'CUCUTA', 'CUCU': 'CUCUTA',
      // Bucaramanga
      'BUCARAMANGA': 'BUCARAMANGA', 'BGA': 'BUCARAMANGA', 'BUCGA': 'BUCARAMANGA',
      'BUCA': 'BUCARAMANGA', 'BUCARANGA': 'BUCARAMANGA',
      // Pereira
      'PEREIRA': 'PEREIRA', 'PEI': 'PEREIRA', 'PREI': 'PEREIRA', 'PRA': 'PEREIRA', 'PER': 'PEREIRA',
      // Santa Marta
      'SANTA MARTA': 'SANTA MARTA', 'SMR': 'SANTA MARTA', 'STA MARTA': 'SANTA MARTA',
      'S MARTA': 'SANTA MARTA', 'SAMTA': 'SANTA MARTA',
      // Ibagué
      'IBAGUE': 'IBAGUE', 'IBA': 'IBAGUE', 'IBG': 'IBAGUE',
      // Pasto
      'PASTO': 'PASTO', 'PST': 'PASTO', 'PAS': 'PASTO', 'SAN JUAN DE PASTO': 'PASTO',
      // Manizales
      'MANIZALES': 'MANIZALES', 'MZL': 'MANIZALES', 'MNZ': 'MANIZALES', 'MANI': 'MANIZALES',
      // Neiva
      'NEIVA': 'NEIVA', 'NVA': 'NEIVA', 'NEI': 'NEIVA',
      // Villavicencio
      'VILLAVICENCIO': 'VILLAVICENCIO', 'VVC': 'VILLAVICENCIO', 'VVICIO': 'VILLAVICENCIO',
      'VILLAVO': 'VILLAVICENCIO', 'VILLA': 'VILLAVICENCIO', 'VLLAVICENCIO': 'VILLAVICENCIO',
      // Armenia
      'ARMENIA': 'ARMENIA', 'ARM': 'ARMENIA', 'ARN': 'ARMENIA',
      // Valledupar
      'VALLEDUPAR': 'VALLEDUPAR', 'VUP': 'VALLEDUPAR', 'VDP': 'VALLEDUPAR',
      'VLLEDUPAR': 'VALLEDUPAR', 'VALLE DUPAR': 'VALLEDUPAR',
      // Montería
      'MONTERIA': 'MONTERIA', 'MTR': 'MONTERIA', 'MONTE': 'MONTERIA', 'MONT': 'MONTERIA',
      // Sincelejo
      'SINCELEJO': 'SINCELEJO', 'SIN': 'SINCELEJO', 'SINCEJO': 'SINCELEJO', 'SINCE': 'SINCELEJO',
      // Popayán
      'POPAYAN': 'POPAYAN', 'PPN': 'POPAYAN', 'POP': 'POPAYAN', 'POPA': 'POPAYAN',
      // Tunja
      'TUNJA': 'TUNJA', 'TUN': 'TUNJA', 'TNJ': 'TUNJA',
      // Florencia
      'FLORENCIA': 'FLORENCIA', 'FLO': 'FLORENCIA', 'FLOR': 'FLORENCIA',
      // Riohacha
      'RIOHACHA': 'RIOHACHA', 'RHA': 'RIOHACHA', 'RIO': 'RIOHACHA', 'RIO HACHA': 'RIOHACHA',
      // Yopal
      'YOPAL': 'YOPAL', 'YOP': 'YOPAL',
      // Quibdó
      'QUIBDO': 'QUIBDO', 'QUI': 'QUIBDO', 'QBD': 'QUIBDO',
      // Leticia
      'LETICIA': 'LETICIA', 'LET': 'LETICIA',
      // Mitú
      'MITU': 'MITU', 'MIT': 'MITU',
      // Puerto Carreño
      'PUERTO CARRENO': 'PUERTO CARRENO', 'PTO CARRENO': 'PUERTO CARRENO', 'P CARRENO': 'PUERTO CARRENO',
      // San José del Guaviare
      'SAN JOSE DEL GUAVIARE': 'SAN JOSE DEL GUAVIARE', 'SAN JOSE GUAVIARE': 'SAN JOSE DEL GUAVIARE',
      'S JOSE DEL GUAVIARE': 'SAN JOSE DEL GUAVIARE',
      // Mocoa
      'MOCOA': 'MOCOA', 'MOC': 'MOCOA',
      // Otras ciudades importantes
      'SOLEDAD': 'SOLEDAD', 'SOACHA': 'SOACHA', 'PALMIRA': 'PALMIRA',
      'BUENAVENTURA': 'BUENAVENTURA', 'BVENTURA': 'BUENAVENTURA',
      'FLORIDABLANCA': 'FLORIDABLANCA', 'FLORIDA': 'FLORIDABLANCA',
      'GIRARDOT': 'GIRARDOT', 'BELLO': 'BELLO', 'ENVIGADO': 'ENVIGADO', 'ITAGUI': 'ITAGUI',
      'DOSQUEBRADAS': 'DOSQUEBRADAS', 'DOS QUEBRADAS': 'DOSQUEBRADAS',
      'TULUA': 'TULUA', 'CARTAGO': 'CARTAGO',
      'BARRANCABERMEJA': 'BARRANCABERMEJA', 'BARRANCA': 'BARRANCABERMEJA',
      'SOGAMOSO': 'SOGAMOSO', 'DUITAMA': 'DUITAMA', 'FACATATIVA': 'FACATATIVA',
      'ZIPAQUIRA': 'ZIPAQUIRA', 'CHIA': 'CHIA', 'FUNZA': 'FUNZA', 'MOSQUERA': 'MOSQUERA', 'MADRID': 'MADRID'
    };

    if (ciudadesNormalizadas[valor]) {
      return ciudadesNormalizadas[valor];
    }

    return valor;
  }

  crearGraficaSimple(label: string, datos: any): void {
    // Destruir gráfica anterior si existe
    if (this.dynamicChart) {
      this.dynamicChart.destroy();
      this.dynamicChart = null;
    }

    if (!this.dynamicChartRef?.nativeElement) {
      setTimeout(() => this.crearGraficaSimple(label, datos), 200);
      return;
    }

    const ctx = this.dynamicChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    let entries = Object.entries(datos);

    // Aplicar top 10 si está activado
    if (this.mostrarTop10 && entries.length > 10) {
      entries = entries
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10);
    }

    const labels = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value as number);
    const colors = this.generarColores(labels.length);

    const config: any = {
      type: this.tipoGraficaSeleccionado,
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.9', '1')),
          borderWidth: this.tipoGraficaSeleccionado === 'line' ? 2 : 1,
          hoverOffset: 15,
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        onClick: (event: any, activeElements: any[]) => {
          if (activeElements.length > 0) {
            const index = activeElements[0].index;
            const value = values[index];
            const labelClicked = labels[index];
            Swal.fire({
              title: labelClicked,
              html: `
                <div style="text-align: center;">
                  <h2 style="color: ${colors[index]}; margin: 20px 0;">${value}</h2>
                  <p style="font-size: 1.1em;">Casos registrados</p>
                </div>
              `,
              confirmButtonText: 'Cerrar',
              width: '400px'
            });
          }
        },
        plugins: {
          title: {
            display: true,
            text: label,
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          legend: {
            display: this.tipoGraficaSeleccionado === 'pie' || this.tipoGraficaSeleccionado === 'doughnut',
            position: 'bottom',
            labels: {
              padding: 10,
              font: { size: 11 },
              usePointStyle: true
            },
            onClick: (e: any, legendItem: any, legend: any) => {
              const index = legendItem.index;
              const chart = legend.chart;
              const meta = chart.getDatasetMeta(0);
              meta.data[index].hidden = !meta.data[index].hidden;
              chart.update();
            },
            onHover: (event: any) => {
              event.native.target.style.cursor = 'pointer';
            },
            onLeave: (event: any) => {
              event.native.target.style.cursor = 'default';
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context: any) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed.y || context.parsed / total) * 100).toFixed(1);
                return ` ${context.formattedValue} (${percentage}%)`;
              }
            }
          }
        },
        scales: this.tipoGraficaSeleccionado === 'bar' || this.tipoGraficaSeleccionado === 'line' ? {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          },
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false }
          }
        } : undefined,
        onHover: (event: any, activeElements: any[]) => {
          event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }
      }
    };

    this.dynamicChart = new Chart(ctx, config);
    this.hasDynamicChart = true;
  }

  crearGraficaMultiple(datosGrafica: any): void {
    // Destruir gráfica anterior si existe
    if (this.dynamicChart) {
      this.dynamicChart.destroy();
      this.dynamicChart = null;
    }

    if (!this.dynamicChartRef?.nativeElement) {
      setTimeout(() => this.crearGraficaMultiple(datosGrafica), 200);
      return;
    }

    const ctx = this.dynamicChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Obtener todas las etiquetas únicas
    const todasLasEtiquetas = new Set<string>();
    Object.values(datosGrafica).forEach((datos: any) => {
      Object.keys(datos).forEach(key => todasLasEtiquetas.add(key));
    });

    const labels = Array.from(todasLasEtiquetas);
    const datasets = Object.entries(datosGrafica).map(([campo, datos], index) => {
      const values = labels.map(label => (datos as any)[label] || 0);
      const color = this.generarColores(Object.keys(datosGrafica).length)[index];

      return {
        label: campo,
        data: values,
        backgroundColor: color,
        borderColor: color.replace('0.9', '1'),
        borderWidth: 2
      };
    });

    const config: any = {
      type: this.tipoGraficaSeleccionado === 'pie' || this.tipoGraficaSeleccionado === 'doughnut' ? 'bar' : this.tipoGraficaSeleccionado,
      data: {
        labels: labels.slice(0, this.mostrarTop10 ? 10 : labels.length),
        datasets: datasets.map((ds: any) => ({
          ...ds,
          hoverBorderWidth: 3,
          hoverOffset: this.tipoGraficaSeleccionado === 'line' ? 0 : 10
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        onClick: (event: any, activeElements: any[]) => {
          if (activeElements.length > 0) {
            const element = activeElements[0];
            const datasetIndex = element.datasetIndex;
            const index = element.index;
            const dataset = datasets[datasetIndex];
            const value = dataset.data[index];
            const labelClicked = labels[index];
            const campo = dataset.label;

            Swal.fire({
              title: `${campo}`,
              html: `
                <div style="text-align: center;">
                  <h3 style="color: ${dataset.backgroundColor}; margin: 15px 0;">${labelClicked}</h3>
                  <h2 style="color: ${dataset.backgroundColor}; margin: 20px 0;">${value}</h2>
                  <p style="font-size: 1.1em;">Casos registrados</p>
                </div>
              `,
              confirmButtonText: 'Cerrar',
              width: '450px'
            });
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Comparación de Campos',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              padding: 10,
              font: { size: 11 },
              usePointStyle: true
            },
            onClick: (e: any, legendItem: any, legend: any) => {
              const index = legendItem.datasetIndex;
              const chart = legend.chart;
              const meta = chart.getDatasetMeta(index);
              meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
              chart.update();
            },
            onHover: (event: any) => {
              event.native.target.style.cursor = 'pointer';
            },
            onLeave: (event: any) => {
              event.native.target.style.cursor = 'default';
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context: any) => {
                return ` ${context.dataset.label}: ${context.formattedValue}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          },
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false }
          }
        },
        onHover: (event: any, activeElements: any[]) => {
          event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }
      }
    };

    this.dynamicChart = new Chart(ctx, config);
    this.hasDynamicChart = true;
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
        return {
          // Identificadores y Códigos
          'Numero Curso': item.NUMERO_CURSO || item.PKEYHOJAVIDA || '',
          'Tipo Curso': item.TIPO_CURSO || item.PKEYASPIRANT || '',
          'Programa Académico': item.CODIPROGACAD || '',
          'Año Período': item.ANNOPERIACAD || '',
          'Número Período': item.NUMEPERIACAD || '',
          'Código Inscripción': item.CODIGO_INSCRIPCION || '',

          // Datos Personales
          'Documento': item.DOCUMENTO || '',
          'Nombre': item.NOMBRE || '',
          'Primer Apellido': item.PRIMER_APELLIDO || '',
          'Segundo Apellido': item.SEGUNDO_APELLIDO || '',
          'Edad': item.EDAD || '',
          'Género': item.GENERO || '',
          'Fecha Nacimiento': item.FECH_NACIMIENTO || '',
          'Departamento Nacimiento': item.DEPARTAMENTO_NACIMIENTO || '',
          'Ciudad Nacimiento': item.CIUDAD_NACIMIENTO || '',

          // Contacto
          'Correo': item.CORREO || '',
          'Teléfono': item.TELEFONO || '',
          'Celular': item.CELULAR || '',
          'Dirección': item.DIRECCION || '',

          // Ubicación Residencia
          'Ciudad donde reside': item.CIUDAD || '',
          'Departamento donde reside': item.DEPARTAMENTO || '',
          'Regional': item.REGIONAL || '',
          'Estado': item.ESTADO || '',

          // Académico
          'Colegio': item.COLEGIO || '',

          // Información Adicional
          'Complementaria 1': item.COMPLEMENTARIA_1 || '',
          'Complementaria 2': item.COMPLEMENTARIA_2 || '',
          'Fecha Inscripción': item.FECHA_INSCRIPCION || '',
          'Grupo Minoritario': item.GRUP_MINO || '',
          'Estrato': item.ESTRATO || '',
          'Tipo Medio': item.TIPO_MEDIO || '',

          // Sistema
          'Fecha Creación': item.createdAt || '',
          'Última Actualización': item.updatedAt || ''
        };
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
