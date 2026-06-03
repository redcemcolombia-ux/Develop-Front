# 00_Informe - Análisis Técnico Detallado
## Liberación de Casos y Gestión de Supervisor Psicología

---

## 1. PSICOLOGÍA GESTIÓN - Liberación de Casos

### 1.1 Módulo: Mis Casos Tomados
**Ubicación esperada:** `src/app/features/admin/psicologiaGestion/`

#### Cambios en el Frontend

**Archivo:** `psicologia-gestion.html`
- Agregar columna de acciones si no existe
- Implementar botón "Liberar Caso" con ícono de eliminación (Bootstrap icon: `bi-trash` o `bi-x-circle`)
- Añadir evento `(click)` que invoque método `liberarCaso(caso)`
- Implementar confirmación con SweetAlert2 antes de ejecutar la acción

**Archivo:** `psicologia-gestion.ts`
- Crear método `liberarCaso(caso: any): void`
- Implementar lógica de confirmación con SweetAlert2:
  ```typescript
  Swal.fire({
    title: '¿Liberar este caso?',
    text: 'El aspirante quedará disponible para reasignación',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, liberar',
    cancelButtonText: 'Cancelar'
  })
  ```
- Llamar al servicio `liberarCasoPsicologo(casoId)` tras confirmación
- Actualizar lista de casos tras liberación exitosa
- Mostrar notificación de éxito/error con SweetAlert2

**Archivo:** `psicologia-gestion.service.ts`
- Crear método `liberarCasoPsicologo(casoId: string): Observable<any>`
- Endpoint API: `DELETE /api/psicologia/casos/{casoId}/liberar`
- Headers: JWT token desde localStorage
- Manejo de errores con catchError de RxJS

#### Cambios en el Backend (FastAPI)

**Nuevo endpoint:** `/api/psicologia/casos/{caso_id}/liberar`
- Método: DELETE o PATCH
- Funcionalidad:
  - Validar que el caso existe
  - Validar que el usuario que libera es el asignado (o es supervisor)
  - Actualizar documento en MongoDB:
    - Remover campo `psicologo_asignado_id`
    - Actualizar campo `estado` a "Disponible" o "Sin asignar"
    - Registrar fecha/hora de liberación en `fecha_liberacion`
    - Guardar histórico de asignaciones en array `historial_asignaciones`
- Retornar: `{ success: true, message: "Caso liberado exitosamente" }`

**Modelo MongoDB:**
```python
{
  "_id": ObjectId,
  "aspirante_id": str,
  "psicologo_asignado_id": str | None,  # Null cuando se libera
  "fecha_asignacion": datetime,
  "fecha_liberacion": datetime | None,
  "estado": str,  # "Asignado", "Disponible", "Completado"
  "historial_asignaciones": [
    {
      "psicologo_id": str,
      "fecha_asignacion": datetime,
      "fecha_liberacion": datetime,
      "motivo": str
    }
  ]
}
```

---

## 2. NUEVO TIPO DE USUARIO: SUPERVISOR PSICOLOGÍA

### 2.1 Sistema de Autenticación y Permisos

**Archivo:** `src/app/core/auth.service.ts`
- Agregar rol `SUPERVISOR_PSICOLOGIA` a los roles existentes
- Método `hasRole(role: string): boolean` debe contemplar este nuevo rol
- El JWT debe incluir el rol en el payload

**Archivo:** `src/app/core/auth.guard.ts`
- Crear guard específico `SupervisorPsicologiaGuard` si se requiere
- O actualizar guard existente para validar rol `SUPERVISOR_PSICOLOGIA`

**Backend - Autenticación:**
- Tabla/Colección de usuarios debe incluir campo `rol` con valor `supervisor_psicologia`
- Endpoint `/api/auth/login` debe retornar rol en el token JWT
- Middleware de autorización debe validar permisos por endpoint

### 2.2 Actualización del Menú Lateral

**Archivo:** `src/app/shared/aside/aside.html` o `aside.ts`
- Agregar condicional para mostrar opciones según rol:
  ```html
  <div *ngIf="esSupervisorPsicologia()">
    <a routerLink="/admin/psicologia/gestion-grupo">Gestión Grupo</a>
    <a routerLink="/admin/psicologia/informe-global">Informe Global</a>
  </div>
  ```

**Archivo:** `src/app/shared/aside/aside.ts`
- Método `esSupervisorPsicologia(): boolean` que consulte al AuthService
- Inyectar AuthService en el constructor

---

## 3. MÓDULO: GESTIÓN GRUPO (Supervisor Psicología)

### 3.1 Creación del Módulo

**Ubicación:** `src/app/features/admin/psicologia/gestionGrupo/`

**Archivos a crear:**
- `gestion-grupo.ts` (componente standalone)
- `gestion-grupo.html` (template)
- `gestion-grupo.css` (estilos)
- `gestion-grupo.service.ts` (servicios HTTP)

#### Frontend - gestion-grupo.ts

**Imports necesarios:**
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GestionGrupoService } from './gestion-grupo.service';
import Swal from 'sweetalert2';
```

**Propiedades:**
```typescript
casosAsignados: any[] = [];
psicologosActivos: any[] = [];
loading: boolean = false;
```

**Métodos principales:**
- `ngOnInit()`: Cargar casos asignados y lista de psicólogos
- `cargarCasosAsignados()`: Consumir servicio GET casos
- `cargarPsicologosActivos()`: Consumir servicio GET psicólogos
- `eliminarAsignacion(caso)`: Desasignar psicólogo del caso
- `abrirModalReasignar(caso)`: Mostrar modal SweetAlert2 con formulario
- `reasignarCaso(casoId, psicologoId)`: Ejecutar reasignación

#### Frontend - gestion-grupo.html

**Estructura:**
```html
<div class="container-fluid">
  <h2>Gestión de Grupo - Casos Asignados</h2>

  <div class="table-responsive">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Aspirante</th>
          <th>Documento</th>
          <th>Psicólogo Asignado</th>
          <th>Fecha Asignación</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let caso of casosAsignados">
          <td>{{ caso.nombre_aspirante }}</td>
          <td>{{ caso.documento }}</td>
          <td>{{ caso.psicologo_nombre }}</td>
          <td>{{ caso.fecha_asignacion | date:'short' }}</td>
          <td>{{ caso.estado }}</td>
          <td>
            <button (click)="eliminarAsignacion(caso)"
                    class="btn btn-sm btn-danger me-2">
              <i class="bi bi-trash"></i> Eliminar
            </button>
            <button (click)="abrirModalReasignar(caso)"
                    class="btn btn-sm btn-warning">
              <i class="bi bi-arrow-repeat"></i> Reasignar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

#### Frontend - gestion-grupo.service.ts

**Métodos del servicio:**
```typescript
// GET - Obtener todos los casos asignados
getCasosAsignados(): Observable<any> {
  return this.http.get(`${API_URL}/psicologia/casos/asignados`, {
    headers: this.getHeaders()
  });
}

// GET - Obtener psicólogos activos
getPsicologosActivos(): Observable<any> {
  return this.http.get(`${API_URL}/psicologia/psicologos/activos`, {
    headers: this.getHeaders()
  });
}

// DELETE - Eliminar asignación de psicólogo
eliminarAsignacion(casoId: string): Observable<any> {
  return this.http.delete(`${API_URL}/psicologia/casos/${casoId}/asignacion`, {
    headers: this.getHeaders()
  });
}

// PATCH - Reasignar caso a otro psicólogo
reasignarCaso(casoId: string, psicologoId: string): Observable<any> {
  return this.http.patch(`${API_URL}/psicologia/casos/${casoId}/reasignar`,
    { nuevo_psicologo_id: psicologoId },
    { headers: this.getHeaders() }
  );
}
```

#### Backend - Endpoints necesarios

**1. GET `/api/psicologia/casos/asignados`**
- Requiere rol: SUPERVISOR_PSICOLOGIA
- Query MongoDB: Buscar todos los documentos donde `psicologo_asignado_id IS NOT NULL`
- Incluir población (lookup) de datos del aspirante y psicólogo
- Retornar array de casos con información completa

**2. GET `/api/psicologia/psicologos/activos`**
- Requiere rol: SUPERVISOR_PSICOLOGIA o PSICOLOGO
- Query: Buscar usuarios con rol `psicologo` y `estado: "activo"`
- Retornar: `[{ _id, nombre, email, casos_activos: count }]`

**3. DELETE `/api/psicologia/casos/{caso_id}/asignacion`**
- Requiere rol: SUPERVISOR_PSICOLOGIA
- Funcionalidad:
  - Validar que caso existe
  - Mover asignación actual a historial
  - Setear `psicologo_asignado_id` a null
  - Actualizar estado a "Disponible"
- Retornar confirmación

**4. PATCH `/api/psicologia/casos/{caso_id}/reasignar`**
- Requiere rol: SUPERVISOR_PSICOLOGIA
- Body: `{ nuevo_psicologo_id: string }`
- Validaciones:
  - Caso existe
  - Psicólogo existe y está activo
  - Psicólogo no está sobrecargado (opcional)
- Funcionalidad:
  - Mover asignación actual a historial
  - Actualizar `psicologo_asignado_id` con nuevo ID
  - Actualizar `fecha_asignacion` a now()
  - Registrar en historial
- Retornar confirmación

### 3.2 Modal de Reasignación con SweetAlert2

**Implementación en gestion-grupo.ts:**
```typescript
async abrirModalReasignar(caso: any) {
  const { value: psicologoId } = await Swal.fire({
    title: `Reasignar caso: ${caso.nombre_aspirante}`,
    html: `
      <select id="psicologo-select" class="swal2-input">
        <option value="">Seleccione un psicólogo</option>
        ${this.psicologosActivos.map(p =>
          `<option value="${p._id}">${p.nombre} (${p.casos_activos} casos)</option>`
        ).join('')}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Reasignar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const select = document.getElementById('psicologo-select') as HTMLSelectElement;
      if (!select.value) {
        Swal.showValidationMessage('Debe seleccionar un psicólogo');
      }
      return select.value;
    }
  });

  if (psicologoId) {
    this.ejecutarReasignacion(caso._id, psicologoId);
  }
}

ejecutarReasignacion(casoId: string, psicologoId: string) {
  this.service.reasignarCaso(casoId, psicologoId).subscribe({
    next: (res) => {
      Swal.fire('Éxito', 'Caso reasignado correctamente', 'success');
      this.cargarCasosAsignados();
    },
    error: (err) => {
      Swal.fire('Error', err.error.message || 'No se pudo reasignar', 'error');
    }
  });
}
```

---

## 4. CONSULTAR HOJAS DE VIDA - Asignación por Supervisor

### 4.1 Modificación del Módulo Hoja de Vida

**Ubicación esperada:** `src/app/features/admin/HojaVida/`

#### Frontend - hoja-vida.html

**Modificación en columna de acciones:**
```html
<td>
  <!-- Botones existentes -->
  <button *ngIf="esVisualizador()" ...>Ver</button>
  <button *ngIf="esEditor()" ...>Editar</button>

  <!-- NUEVO: Botón Asignar para Supervisor Psicología -->
  <button *ngIf="esSupervisorPsicologia()"
          (click)="abrirModalAsignar(aspirante)"
          class="btn btn-sm btn-success">
    <i class="bi bi-person-plus"></i> Asignar
  </button>
</td>
```

#### Frontend - hoja-vida.ts

**Métodos a agregar:**
```typescript
esSupervisorPsicologia(): boolean {
  return this.authService.hasRole('SUPERVISOR_PSICOLOGIA');
}

async abrirModalAsignar(aspirante: any) {
  // Cargar psicólogos activos si no están en memoria
  if (this.psicologosActivos.length === 0) {
    await this.cargarPsicologos();
  }

  const { value: psicologoId } = await Swal.fire({
    title: `Asignar: ${aspirante.nombre}`,
    html: `
      <select id="psicologo-select" class="swal2-input">
        <option value="">Seleccione un psicólogo</option>
        ${this.psicologosActivos.map(p =>
          `<option value="${p._id}">${p.nombre}</option>`
        ).join('')}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Asignar',
    preConfirm: () => {
      const select = document.getElementById('psicologo-select') as HTMLSelectElement;
      if (!select.value) {
        Swal.showValidationMessage('Debe seleccionar un psicólogo');
      }
      return select.value;
    }
  });

  if (psicologoId) {
    this.ejecutarAsignacion(aspirante._id, psicologoId);
  }
}

ejecutarAsignacion(aspiranteId: string, psicologoId: string) {
  this.hojaVidaService.asignarPsicologo(aspiranteId, psicologoId).subscribe({
    next: () => {
      Swal.fire('Éxito', 'Aspirante asignado correctamente', 'success');
    },
    error: (err) => {
      Swal.fire('Error', err.error.message, 'error');
    }
  });
}
```

#### Frontend - hoja-vida.service.ts

**Nuevo método:**
```typescript
asignarPsicologo(aspiranteId: string, psicologoId: string): Observable<any> {
  return this.http.post(`${API_URL}/psicologia/casos/asignar`,
    {
      aspirante_id: aspiranteId,
      psicologo_id: psicologoId
    },
    { headers: this.getHeaders() }
  );
}
```

#### Backend - Nuevo Endpoint

**POST `/api/psicologia/casos/asignar`**
- Requiere rol: SUPERVISOR_PSICOLOGIA
- Body: `{ aspirante_id: str, psicologo_id: str }`
- Validaciones:
  - Aspirante existe
  - Psicólogo existe y está activo
  - Aspirante no tiene asignación activa
- Funcionalidad:
  - Crear documento de caso o actualizar existente
  - Setear `psicologo_asignado_id`
  - Setear `fecha_asignacion`
  - Estado: "Asignado"
- Retornar confirmación

---

## 5. MÓDULO: INFORME GLOBAL

### 5.1 Creación del Módulo

**Ubicación:** `src/app/features/admin/psicologia/informeGlobal/`

**Archivos a crear:**
- `informe-global.ts`
- `informe-global.html`
- `informe-global.css`
- `informe-global.service.ts`

#### Dependencias adicionales

**Librería de gráficos:** Chart.js o ng2-charts
```bash
npm install chart.js ng2-charts
```

**Imports:**
```typescript
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
```

#### Frontend - informe-global.ts

**Propiedades:**
```typescript
psicologos: any[] = [];
hojaVidaCompleta: any[] = [];
psicologoSeleccionado: string = 'todos';
loading: boolean = false;

// Datos para gráficos
chartDataCasos: ChartData<'bar'>;
chartDataEstados: ChartData<'pie'>;
chartOptions: ChartConfiguration['options'];
```

**Métodos:**
```typescript
ngOnInit() {
  this.cargarDatosInforme();
  this.cargarPsicologos();
}

cargarDatosInforme() {
  this.loading = true;
  this.service.getInformeGlobal().subscribe({
    next: (data) => {
      this.hojaVidaCompleta = data;
      this.generarGraficos('todos');
      this.loading = false;
    },
    error: (err) => {
      Swal.fire('Error', 'No se pudo cargar el informe', 'error');
      this.loading = false;
    }
  });
}

filtrarPorPsicologo(psicologoId: string) {
  this.psicologoSeleccionado = psicologoId;
  this.generarGraficos(psicologoId);
}

generarGraficos(psicologoId: string) {
  const datos = psicologoId === 'todos'
    ? this.hojaVidaCompleta
    : this.hojaVidaCompleta.filter(h => h.psicologo_id === psicologoId);

  // Gráfico de barras: Casos por psicólogo
  this.chartDataCasos = {
    labels: this.psicologos.map(p => p.nombre),
    datasets: [{
      label: 'Casos Asignados',
      data: this.psicologos.map(p =>
        datos.filter(d => d.psicologo_id === p._id).length
      ),
      backgroundColor: 'rgba(54, 162, 235, 0.5)'
    }]
  };

  // Gráfico de torta: Estados de casos
  const estados = ['Asignado', 'En Proceso', 'Completado', 'Disponible'];
  this.chartDataEstados = {
    labels: estados,
    datasets: [{
      data: estados.map(e => datos.filter(d => d.estado === e).length),
      backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56']
    }]
  };
}

exportarExcel() {
  // Lógica para exportar datos a Excel
  // Puede usar librería como xlsx
}
```

#### Frontend - informe-global.html

```html
<div class="container-fluid">
  <h2>Informe Global - Psicología</h2>

  <div class="row mb-4">
    <div class="col-md-4">
      <label>Filtrar por Psicólogo:</label>
      <select class="form-select" [(ngModel)]="psicologoSeleccionado"
              (change)="filtrarPorPsicologo(psicologoSeleccionado)">
        <option value="todos">Todos</option>
        <option *ngFor="let p of psicologos" [value]="p._id">
          {{ p.nombre }}
        </option>
      </select>
    </div>
    <div class="col-md-8 text-end">
      <button class="btn btn-success" (click)="exportarExcel()">
        <i class="bi bi-file-excel"></i> Exportar a Excel
      </button>
    </div>
  </div>

  <!-- Tarjetas de resumen -->
  <div class="row mb-4">
    <div class="col-md-3">
      <div class="card text-white bg-primary">
        <div class="card-body">
          <h5>Total Casos</h5>
          <h2>{{ hojaVidaCompleta.length }}</h2>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-white bg-success">
        <div class="card-body">
          <h5>Completados</h5>
          <h2>{{ obtenerPorEstado('Completado') }}</h2>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-white bg-warning">
        <div class="card-body">
          <h5>En Proceso</h5>
          <h2>{{ obtenerPorEstado('En Proceso') }}</h2>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-white bg-info">
        <div class="card-body">
          <h5>Disponibles</h5>
          <h2>{{ obtenerPorEstado('Disponible') }}</h2>
        </div>
      </div>
    </div>
  </div>

  <!-- Gráficos -->
  <div class="row">
    <div class="col-md-6">
      <div class="card">
        <div class="card-header">Casos por Psicólogo</div>
        <div class="card-body">
          <canvas baseChart
                  [data]="chartDataCasos"
                  [type]="'bar'"
                  [options]="chartOptions">
          </canvas>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="card">
        <div class="card-header">Distribución por Estado</div>
        <div class="card-body">
          <canvas baseChart
                  [data]="chartDataEstados"
                  [type]="'pie'"
                  [options]="chartOptions">
          </canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- Tabla detallada -->
  <div class="card mt-4">
    <div class="card-header">Detalle de Hojas de Vida</div>
    <div class="card-body">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Aspirante</th>
            <th>Documento</th>
            <th>Psicólogo</th>
            <th>Fecha Asignación</th>
            <th>Estado</th>
            <th>Tiempo Transcurrido</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of hojaVidaFiltrada">
            <td>{{ item.nombre }}</td>
            <td>{{ item.documento }}</td>
            <td>{{ item.psicologo_nombre }}</td>
            <td>{{ item.fecha_asignacion | date:'short' }}</td>
            <td>
              <span class="badge" [ngClass]="getBadgeClass(item.estado)">
                {{ item.estado }}
              </span>
            </td>
            <td>{{ calcularTiempo(item.fecha_asignacion) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

#### Frontend - informe-global.service.ts

```typescript
getInformeGlobal(): Observable<any> {
  return this.http.get(`${API_URL}/psicologia/informe/global`, {
    headers: this.getHeaders()
  });
}

getPsicologos(): Observable<any> {
  return this.http.get(`${API_URL}/psicologia/psicologos/activos`, {
    headers: this.getHeaders()
  });
}
```

#### Backend - Endpoint

**GET `/api/psicologia/informe/global`**
- Requiere rol: SUPERVISOR_PSICOLOGIA
- Query MongoDB: Agregación pipeline
  - Lookup con colección de aspirantes
  - Lookup con colección de usuarios (psicólogos)
  - Proyectar campos necesarios
  - Calcular métricas:
    - Total casos por psicólogo
    - Casos por estado
    - Tiempo promedio de asignación
    - Casos completados vs pendientes
- Retornar objeto con:
  - Array de hojas de vida completas
  - Estadísticas agregadas
  - Métricas por psicólogo

**Ejemplo de agregación MongoDB:**
```python
pipeline = [
    {
        "$lookup": {
            "from": "aspirantes",
            "localField": "aspirante_id",
            "foreignField": "_id",
            "as": "aspirante"
        }
    },
    {
        "$lookup": {
            "from": "usuarios",
            "localField": "psicologo_asignado_id",
            "foreignField": "_id",
            "as": "psicologo"
        }
    },
    {
        "$unwind": "$aspirante"
    },
    {
        "$unwind": "$psicologo"
    },
    {
        "$project": {
            "nombre": "$aspirante.nombre",
            "documento": "$aspirante.documento",
            "psicologo_id": "$psicologo._id",
            "psicologo_nombre": "$psicologo.nombre",
            "fecha_asignacion": 1,
            "estado": 1,
            "tiempo_transcurrido": {
                "$subtract": ["$$NOW", "$fecha_asignacion"]
            }
        }
    }
]
```

---

## 6. IPS GESTIÓN - Liberación de Casos

### 6.1 Módulo: Mis Casos Tomados (IPS)

**Ubicación esperada:** `src/app/features/admin/ipsGestion/`

#### Frontend - ips-gestion.html

**Modificación en tabla de casos:**
```html
<td>
  <!-- Botones existentes -->

  <!-- NUEVO: Botón Liberar Caso -->
  <button (click)="liberarCasoIps(caso)"
          class="btn btn-sm btn-danger">
    <i class="bi bi-trash"></i> Liberar
  </button>
</td>
```

#### Frontend - ips-gestion.ts

```typescript
liberarCasoIps(caso: any) {
  Swal.fire({
    title: '¿Liberar este caso?',
    text: 'El caso quedará disponible para otra IPS',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, liberar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      this.service.liberarCasoIps(caso._id).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Caso liberado correctamente', 'success');
          this.cargarMisCasos();
        },
        error: (err) => {
          Swal.fire('Error', err.error.message, 'error');
        }
      });
    }
  });
}
```

#### Frontend - ips-gestion.service.ts

```typescript
liberarCasoIps(casoId: string): Observable<any> {
  return this.http.delete(`${API_URL}/ips/casos/${casoId}/liberar`, {
    headers: this.getHeaders()
  });
}
```

#### Backend - Endpoint

**DELETE `/api/ips/casos/{caso_id}/liberar`**
- Requiere rol: USUARIO_IPS o ADMIN
- Validaciones:
  - Caso existe
  - Usuario que libera es el asignado (o es admin)
- Funcionalidad:
  - Actualizar documento:
    - `ips_asignada_id`: null
    - `estado`: "Disponible"
    - `fecha_liberacion`: now()
  - Guardar en historial
- Retornar confirmación

---

## 7. RUTAS Y NAVEGACIÓN

### 7.1 Archivo app.routes.ts

**Rutas a agregar:**
```typescript
{
  path: 'admin/psicologia/gestion-grupo',
  loadComponent: () => import('./features/admin/psicologia/gestionGrupo/gestion-grupo')
    .then(m => m.GestionGrupo),
  canActivate: [AuthGuard],
  data: { roles: ['SUPERVISOR_PSICOLOGIA'] }
},
{
  path: 'admin/psicologia/informe-global',
  loadComponent: () => import('./features/admin/psicologia/informeGlobal/informe-global')
    .then(m => m.InformeGlobal),
  canActivate: [AuthGuard],
  data: { roles: ['SUPERVISOR_PSICOLOGIA'] }
}
```

---

## 8. MODELOS Y TIPOS

### 8.1 Interfaces TypeScript

**Crear archivo:** `src/app/models/psicologia.interface.ts`

```typescript
export interface CasoPsicologia {
  _id: string;
  aspirante_id: string;
  aspirante_nombre: string;
  aspirante_documento: string;
  psicologo_asignado_id: string | null;
  psicologo_nombre?: string;
  fecha_asignacion: Date;
  fecha_liberacion?: Date;
  estado: 'Disponible' | 'Asignado' | 'En Proceso' | 'Completado';
  historial_asignaciones: HistorialAsignacion[];
}

export interface HistorialAsignacion {
  psicologo_id: string;
  psicologo_nombre: string;
  fecha_asignacion: Date;
  fecha_liberacion?: Date;
  motivo?: string;
}

export interface PsicologoActivo {
  _id: string;
  nombre: string;
  email: string;
  casos_activos: number;
  casos_completados: number;
  estado: 'activo' | 'inactivo';
}

export interface InformeGlobal {
  total_casos: number;
  casos_por_estado: {
    disponibles: number;
    asignados: number;
    en_proceso: number;
    completados: number;
  };
  casos_por_psicologo: {
    psicologo_id: string;
    nombre: string;
    total: number;
    completados: number;
    promedio_tiempo: number;
  }[];
  hojas_vida: CasoPsicologia[];
}
```

---

## 9. BASE DE DATOS - MODELO MONGODB

### 9.1 Colección: casos_psicologia

```javascript
{
  _id: ObjectId,
  aspirante_id: ObjectId,
  psicologo_asignado_id: ObjectId | null,
  fecha_asignacion: ISODate,
  fecha_liberacion: ISODate | null,
  estado: String, // enum: ['Disponible', 'Asignado', 'En Proceso', 'Completado']
  notas: String,
  resultados: Object,
  created_at: ISODate,
  updated_at: ISODate,
  historial_asignaciones: [
    {
      psicologo_id: ObjectId,
      fecha_asignacion: ISODate,
      fecha_liberacion: ISODate,
      motivo: String,
      accion: String // 'asignacion', 'liberacion', 'reasignacion'
    }
  ]
}
```

### 9.2 Índices recomendados

```javascript
db.casos_psicologia.createIndex({ aspirante_id: 1 });
db.casos_psicologia.createIndex({ psicologo_asignado_id: 1 });
db.casos_psicologia.createIndex({ estado: 1 });
db.casos_psicologia.createIndex({ fecha_asignacion: -1 });
```

### 9.3 Colección: casos_ips

```javascript
{
  _id: ObjectId,
  aspirante_id: ObjectId,
  ips_asignada_id: ObjectId | null,
  fecha_asignacion: ISODate,
  fecha_liberacion: ISODate | null,
  estado: String,
  created_at: ISODate,
  updated_at: ISODate,
  historial_asignaciones: [
    {
      ips_id: ObjectId,
      fecha_asignacion: ISODate,
      fecha_liberacion: ISODate,
      motivo: String
    }
  ]
}
```

### 9.4 Actualización Colección: usuarios

```javascript
{
  _id: ObjectId,
  nombre: String,
  email: String,
  password: String, // hash
  rol: String, // enum: ['admin', 'psicologo', 'supervisor_psicologia', 'ips', ...]
  estado: String, // 'activo' | 'inactivo'
  especialidad: String, // para psicólogos
  casos_max: Number, // límite de casos concurrentes
  created_at: ISODate,
  updated_at: ISODate
}
```

---

## 10. SEGURIDAD Y VALIDACIONES

### 10.1 Validaciones Backend

**En todos los endpoints:**
- Validar JWT token válido
- Validar rol del usuario
- Validar ObjectId válidos
- Validar existencia de documentos referenciados
- Rate limiting para prevenir abuso
- Sanitizar inputs para prevenir inyección NoSQL

### 10.2 Permisos por Rol

| Endpoint | Admin | Supervisor Psicología | Psicólogo | IPS |
|----------|-------|----------------------|-----------|-----|
| Liberar caso propio (Psicología) | ✓ | ✓ | ✓ | ✗ |
| Ver casos asignados (todos) | ✓ | ✓ | ✗ | ✗ |
| Eliminar asignación | ✓ | ✓ | ✗ | ✗ |
| Reasignar caso | ✓ | ✓ | ✗ | ✗ |
| Asignar desde hoja de vida | ✓ | ✓ | ✗ | ✗ |
| Ver informe global | ✓ | ✓ | ✗ | ✗ |
| Liberar caso IPS | ✓ | ✗ | ✗ | ✓ |

---

## 11. TESTING

### 11.1 Tests Unitarios (Frontend)

**Para cada componente:**
- Test de creación del componente
- Test de carga de datos (mocking servicios)
- Test de eventos de botones
- Test de validaciones de formularios
- Test de renderizado condicional según rol

**Ejemplo para gestion-grupo.spec.ts:**
```typescript
describe('GestionGrupo', () => {
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load casos on init', () => {
    spyOn(service, 'getCasosAsignados').and.returnValue(of([]));
    component.ngOnInit();
    expect(service.getCasosAsignados).toHaveBeenCalled();
  });

  it('should call eliminarAsignacion', () => {
    spyOn(service, 'eliminarAsignacion').and.returnValue(of({}));
    component.eliminarAsignacion({ _id: '123' });
    expect(service.eliminarAsignacion).toHaveBeenCalledWith('123');
  });
});
```

### 11.2 Tests de Integración (Backend)

**Para cada endpoint:**
- Test con autenticación válida
- Test con autenticación inválida
- Test con rol autorizado
- Test con rol no autorizado
- Test con datos válidos
- Test con datos inválidos
- Test de manejo de errores

---

## 12. RESUMEN DE CAMBIOS

### Archivos Nuevos (Frontend)
1. `src/app/features/admin/psicologia/gestionGrupo/gestion-grupo.ts`
2. `src/app/features/admin/psicologia/gestionGrupo/gestion-grupo.html`
3. `src/app/features/admin/psicologia/gestionGrupo/gestion-grupo.css`
4. `src/app/features/admin/psicologia/gestionGrupo/gestion-grupo.service.ts`
5. `src/app/features/admin/psicologia/informeGlobal/informe-global.ts`
6. `src/app/features/admin/psicologia/informeGlobal/informe-global.html`
7. `src/app/features/admin/psicologia/informeGlobal/informe-global.css`
8. `src/app/features/admin/psicologia/informeGlobal/informe-global.service.ts`
9. `src/app/models/psicologia.interface.ts`

### Archivos a Modificar (Frontend)
1. `src/app/features/admin/psicologiaGestion/psicologia-gestion.html`
2. `src/app/features/admin/psicologiaGestion/psicologia-gestion.ts`
3. `src/app/features/admin/psicologiaGestion/psicologia-gestion.service.ts`
4. `src/app/features/admin/HojaVida/hoja-vida.html`
5. `src/app/features/admin/HojaVida/hoja-vida.ts`
6. `src/app/features/admin/HojaVida/hoja.service.ts`
7. `src/app/features/admin/ipsGestion/ips-gestion.html`
8. `src/app/features/admin/ipsGestion/ips-gestion.ts`
9. `src/app/features/admin/ipsGestion/ips-gestion.service.ts`
10. `src/app/shared/aside/aside.html`
11. `src/app/shared/aside/aside.ts`
12. `src/app/core/auth.service.ts`
13. `src/app/core/auth.guard.ts`
14. `src/app/app.routes.ts`
15. `package.json` (agregar chart.js y ng2-charts)

### Endpoints Nuevos (Backend)
1. `DELETE /api/psicologia/casos/{caso_id}/liberar`
2. `GET /api/psicologia/casos/asignados`
3. `GET /api/psicologia/psicologos/activos`
4. `DELETE /api/psicologia/casos/{caso_id}/asignacion`
5. `PATCH /api/psicologia/casos/{caso_id}/reasignar`
6. `POST /api/psicologia/casos/asignar`
7. `GET /api/psicologia/informe/global`
8. `DELETE /api/ips/casos/{caso_id}/liberar`

### Base de Datos
1. Colección nueva: `casos_psicologia`
2. Colección nueva o modificada: `casos_ips`
3. Actualizar colección: `usuarios` (agregar rol `supervisor_psicologia`)
4. Crear índices en colecciones nuevas

---

## 13. DEPENDENCIAS NPM

```json
{
  "chart.js": "^4.4.0",
  "ng2-charts": "^5.0.0",
  "sweetalert2": "^11.10.0" // ya existe
}
```

**Instalación:**
```bash
npm install chart.js ng2-charts
```

---

## 14. CONFIGURACIÓN ADICIONAL

### 14.1 Configuración de Chart.js en app.config.ts

```typescript
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
    provideCharts(withDefaultRegisterables())
  ]
};
```

---

## 15. MIGRACIÓN Y DEPLOYMENT

### 15.1 Scripts de Migración

**Script para crear roles iniciales:**
```python
# scripts/create_supervisor_role.py
from pymongo import MongoClient

client = MongoClient(MONGO_URI)
db = client['redcem_db']

# Actualizar usuarios que serán supervisores
db.usuarios.update_many(
    { 'email': { '$in': ['supervisor1@example.com', 'supervisor2@example.com'] } },
    { '$set': { 'rol': 'supervisor_psicologia' } }
)
```

**Script para migrar casos existentes:**
```python
# scripts/migrate_casos_psicologia.py
from datetime import datetime

# Crear documentos en casos_psicologia para asignaciones existentes
# basándose en datos históricos
```

### 15.2 Orden de Deployment

1. **Backend:**
   - Actualizar modelos de datos
   - Ejecutar scripts de migración
   - Desplegar nuevos endpoints
   - Verificar con Postman/Insomnia

2. **Frontend:**
   - Instalar dependencias npm
   - Build de producción
   - Desplegar en servidor
   - Probar flujos completos

---

## 16. MONITOREO Y LOGS

### 16.1 Logs Backend

**Registrar en todos los endpoints:**
- Usuario que ejecuta la acción
- Timestamp
- Acción realizada (asignar, liberar, reasignar)
- IDs involucrados (caso, aspirante, psicólogo)
- Resultado (éxito/error)

**Ejemplo:**
```python
logger.info(f"Usuario {user_id} liberó caso {caso_id} - Psicólogo anterior: {psicologo_id}")
```

### 16.2 Métricas a Monitorear

- Número de asignaciones por día
- Número de liberaciones por día
- Número de reasignaciones por día
- Tiempo promedio de asignación
- Casos activos por psicólogo
- Tasa de completitud de casos

---

**FIN DEL INFORME TÉCNICO**
