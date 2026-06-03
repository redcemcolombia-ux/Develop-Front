# Plan de Arquitectura Técnica - Rol Supervisor Psicología y Gestión de Asignaciones

## Información General
- **Fecha:** 2026-05-29
- **Módulo:** Psicología Gestión
- **Tipo de Aplicación:** Web (Angular 21 Standalone)
- **Stack:** Angular 21.2.7 | Angular CLI 21.2.6 | Node.js 22.20.0
- **Prioridad:** Alta
- **Complejidad:** Alta

---

## 1. RESUMEN EJECUTIVO

### Objetivo
Implementar un nuevo rol "Sup-Psicologia" (Supervisor de Psicología) con funcionalidades avanzadas de gestión, incluyendo:
- Acceso completo a todas las secciones del módulo Psicología Gestión
- Nueva sección "Informe General" (clon de "Informe")
- Capacidad de asignar casos a psicólogos desde "Consultar Hojas de Vida"
- Nueva sección "Reasignación de Casos" para gestionar casos previamente asignados

### Alcance
1. **Nuevo Rol:** Crear rol "Sup-Psicologia" con permisos completos en Psicología Gestión
2. **Informe General:** Clonar módulo "Informe" existente (exclusivo para Sup-Psicologia)
3. **Asignación de Casos:** Botón "Asignar" en Consultar Hojas de Vida con modal de selección de psicólogos
4. **Reasignación de Casos:** Nueva sección para gestionar casos ya asignados

### Restricciones Técnicas
- **Framework:** Angular 21 Standalone
- **Node.js:** 22.20.0
- **Estilos:** Bootstrap 5
- **Notificaciones:** SweetAlert2
- **Formularios:** Reactive Forms
- **API Base:** https://redcemed.com/api/*

---

## 2. STACK TECNOLÓGICO RECOMENDADO

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Angular | 21.2.7 | Framework principal |
| Angular CLI | 21.2.6 | Herramienta de desarrollo |
| Node.js | 22.20.0 | Runtime JavaScript |
| TypeScript | 5.7+ | Lenguaje |
| Bootstrap | 5.x | UI Framework |
| SweetAlert2 | 11.x | Notificaciones y modales |
| RxJS | 7.8+ | Programación reactiva |
| HttpClient | Angular | Consumo de API |

### Backend (Existente)
| Componente | Tecnología | Observaciones |
|------------|------------|---------------|
| API REST | FastAPI / Express | Base URL: https://redcemed.com/api/ |
| Base de Datos | MongoDB Atlas | Almacenamiento principal |
| Autenticación | JWT | Token en localStorage |

### Nuevos Endpoints Requeridos

#### 1. Listar Psicólogos
```
GET /api/users/consultar
Authorization: Bearer {token}

Filtrado en Frontend: Cr_Perfil === "Psicólogo"

Response:
{
  "error": 0,
  "response": {
    "data": [
      {
        "_id": "507f191e810c19729de860ea",
        "Cr_Nombre_Usuario": "Dr. Juan Pérez",
        "Cr_Perfil": "Psicólogo",
        "Cr_Documento": "1098765432"
      }
    ]
  }
}
```

#### 2. Asignar Caso a Psicólogo
```
POST /api/psicologia-gestion/asignar-caso
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "caso_id": "string",           // ID del caso (hoja de vida)
  "psicologo_id": "string",      // ID del psicólogo seleccionado
  "supervisor_id": "string"      // ID del supervisor que asigna
}

Response (Éxito):
{
  "error": 0,
  "response": {
    "mensaje": "Caso asignado exitosamente al psicólogo",
    "data": {
      "caso_id": "string",
      "psicologo_asignado": "string",
      "fecha_asignacion": "2026-05-29T10:30:00Z"
    }
  }
}

Response (Error):
{
  "error": 1,
  "response": {
    "mensaje": "Error al asignar caso: [detalle]"
  }
}
```

#### 3. Consultar Casos con Usuario SIC
```
GET /api/hojas-vida/con_usuario_sic
Authorization: Bearer {token}

Comportamiento:
- Trae TODOS los casos donde USUARIO_SIC esté diligenciado (no nulo, no vacío)
- Hace populate de IPS_ID y USUARIO_ID
- Requiere autenticación JWT

Response:
{
  "error": 0,
  "response": {
    "mensaje": "Consulta exitosa - Hojas de vida con USUARIO_SIC asignado",
    "data": [
      {
        "_id": "675abc123def456789012345",
        "DOCUMENTO": "1098765432",
        "NOMBRE": "María",
        "PRIMER_APELLIDO": "Rodríguez",
        "SEGUNDO_APELLIDO": "López",
        "USUARIO_SIC": "507f191e810c19729de860ea",
        "IPS_ID": {
          "_id": "60a1b2c3d4e5f6g7h8i9j0k1",
          "NOMBRE_IPS": "IPS Salud Total"
        },
        "USUARIO_ID": {
          "_id": "60a1b2c3d4e5f6g7h8i9j0k2",
          "Cr_Nombre_Usuario": "Dr. Pérez"
        }
      }
    ],
    "total": 15
  }
}
```

#### 4. Reasignar Caso
```
POST /api/psicologia-gestion/reasignar-caso
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "caso_id": "string",
  "psicologo_id": "string",      // Nuevo psicólogo
  "supervisor_id": "string"
}

Response (Éxito):
{
  "error": 0,
  "response": {
    "mensaje": "Caso reasignado exitosamente",
    "data": {
      "caso_id": "string",
      "psicologo_anterior": "string",
      "psicologo_nuevo": "string",
      "fecha_reasignacion": "2026-05-29T10:30:00Z"
    }
  }
}
```

---

## 3. MODELO DE DATOS

### 3.1 Nuevo Rol de Usuario

**Colección:** `usuarios` o `users`

**Nuevo perfil:**
```javascript
{
  "_id": ObjectId,
  "Cr_Nombre_Usuario": String,
  "Cr_Perfil": "Sup-Psicologia",     // NUEVO ROL
  "Cr_Documento": String,
  "Cr_Email": String,
  "Cr_Password": String,              // Hasheado
  "activo": Boolean,
  "fecha_creacion": ISODate,
  // ... otros campos
}
```

### 3.2 Actualización en Hoja de Vida (Caso)

**Colección:** `hojas_vida`

**Campos a agregar/actualizar:**
```javascript
{
  // ... campos existentes

  // Campo existente a utilizar
  "USUARIO_SIC": ObjectId,            // Psicólogo asignado

  // NUEVOS campos de auditoría
  "historial_asignaciones": [
    {
      "fecha": ISODate,
      "psicologo_id": ObjectId,
      "supervisor_id": ObjectId,
      "accion": String,               // "asignacion" | "reasignacion"
      "psicologo_anterior": ObjectId  // Solo en reasignación
    }
  ],

  // Campos de control
  "asignado_por": ObjectId,           // Supervisor que asignó
  "fecha_ultima_asignacion": ISODate
}
```

### 3.3 Nuevas Interfaces TypeScript

**Ubicación:** `src/app/features/psicologiaGestion/psicologia-gestion.service.ts`

```typescript
// Interface para listar psicólogos
export interface Usuario {
  _id: string;
  Cr_Nombre_Usuario: string;
  Cr_Perfil: string;
  Cr_Documento: string;
  Cr_Email?: string;
}

export interface ListarUsuariosResponse {
  error: number;
  response: {
    data: Usuario[];
    total?: number;
  }
}

// Interface para asignar caso
export interface AsignarCasoRequest {
  caso_id: string;
  psicologo_id: string;
  supervisor_id: string;
}

export interface AsignarCasoResponse {
  error: number;
  response: {
    mensaje: string;
    data?: {
      caso_id: string;
      psicologo_asignado: string;
      fecha_asignacion: string;
    }
  }
}

// Interface para reasignar caso
export interface ReasignarCasoRequest {
  caso_id: string;
  psicologo_id: string;
  supervisor_id: string;
}

export interface ReasignarCasoResponse {
  error: number;
  response: {
    mensaje: string;
    data?: {
      caso_id: string;
      psicologo_anterior: string;
      psicologo_nuevo: string;
      fecha_reasignacion: string;
    }
  }
}

// Interface para casos con usuario SIC
export interface CasoConUsuarioSic {
  _id: string;
  DOCUMENTO: string;
  NOMBRE: string;
  PRIMER_APELLIDO: string;
  SEGUNDO_APELLIDO?: string;
  USUARIO_SIC: string;
  IPS_ID?: {
    _id: string;
    NOMBRE_IPS: string;
  };
  USUARIO_ID?: {
    _id: string;
    Cr_Nombre_Usuario: string;
  };
}

export interface CasosConUsuarioSicResponse {
  error: number;
  response: {
    mensaje: string;
    data: CasoConUsuarioSic[];
    total: number;
  }
}
```

---

## 4. DIAGRAMA DE FLUJO PRINCIPAL

### 4.1 Flujo de Asignación de Caso (desde Consultar Hojas de Vida)

```
PASO 1: Supervisor (Sup-Psicologia) inicia sesión
   ↓
PASO 2: Navega a "Psicología Gestión" → "Consultar Hojas de Vida"
   ↓
PASO 3: Sistema valida rol del usuario
   • Si es "Sup-Psicologia" → muestra botón "Asignar" (rojo)
   • Si es otro rol → no muestra botón "Asignar"
   ↓
PASO 4: Supervisor identifica caso a asignar
   ↓
PASO 5: Supervisor hace clic en botón "Asignar"
   ↓
PASO 6: Sistema abre modal de SweetAlert2
   • Título: "Asignar Caso a Psicólogo"
   • Información del caso (nombre, documento)
   • Lista desplegable con buscador de psicólogos
   • Botones: "Cancelar" y "Asignar Caso"
   ↓
PASO 7: Frontend consume GET /api/users/consultar
   ↓
PASO 8: Frontend filtra usuarios con Cr_Perfil === "Psicólogo"
   ↓
PASO 9: Sistema puebla lista desplegable con psicólogos
   • Muestra: Nombre + Documento
   • Permite búsqueda por documento
   ↓
PASO 10: Supervisor selecciona psicólogo de la lista
   ↓
PASO 11: Supervisor hace clic en "Asignar Caso"
   ↓
PASO 12: Frontend valida:
   • Psicólogo seleccionado no está vacío
   ↓
PASO 13: [SI VALIDACIÓN FALLA]
   → Mostrar error: "Debe seleccionar un psicólogo"
   → Volver a PASO 10
   ↓
PASO 14: [SI VALIDACIÓN PASA]
   → Frontend prepara payload:
     {
       caso_id: caso._id,
       psicologo_id: psicologo seleccionado,
       supervisor_id: usuario logueado
     }
   ↓
PASO 15: Frontend envía POST /api/psicologia-gestion/asignar-caso
   • Loading: modal con spinner
   ↓
PASO 16: Backend procesa solicitud
   • Valida token JWT
   • Verifica que caso existe
   • Verifica que psicólogo existe y tiene perfil correcto
   • Actualiza campo USUARIO_SIC del caso
   • Registra auditoría en historial_asignaciones
   ↓
PASO 17: Backend responde
   ↓
PASO 18: [SI RESPUESTA ES EXITOSA (error: 0)]
   → Frontend cierra modal
   → Muestra SweetAlert2 de éxito:
     • Título: "¡Caso Asignado!"
     • Texto: "El caso ha sido asignado exitosamente al psicólogo [nombre]"
     • Icono: success
     • Timer: 2 segundos
   → Actualiza listado (opcional)
   ↓
PASO 19: [SI RESPUESTA ES ERROR (error: 1)]
   → Frontend muestra SweetAlert2 de error:
     • Título: "Error al Asignar"
     • Texto: mensaje del backend
     • Icono: error
   → Usuario puede reintentar desde PASO 5
   ↓
PASO 20: Fin del flujo
```

### 4.2 Flujo de Reasignación de Caso

```
PASO 1: Supervisor navega a "Psicología Gestión" → "Reasignación de Casos"
   ↓
PASO 2: Frontend consume GET /api/hojas-vida/con_usuario_sic
   ↓
PASO 3: Sistema muestra tabla con casos ya asignados
   • Columnas: Documento, Nombre, Psicólogo Asignado, IPS, Acciones
   ↓
PASO 4: Supervisor identifica caso a reasignar
   ↓
PASO 5: Supervisor hace clic en botón "Reasignar" (en columna Acciones)
   ↓
PASO 6: Sistema abre modal de SweetAlert2
   • Título: "Reasignar Caso"
   • Información del caso
   • Información del psicólogo actual
   • Lista desplegable con buscador de psicólogos (nuevo psicólogo)
   ↓
PASO 7: Frontend consume GET /api/users/consultar y filtra psicólogos
   ↓
PASO 8: Supervisor selecciona nuevo psicólogo
   ↓
PASO 9: Supervisor confirma reasignación
   ↓
PASO 10: Frontend envía POST /api/psicologia-gestion/reasignar-caso
   ↓
PASO 11: Backend procesa:
   • Valida caso y nuevo psicólogo
   • Registra psicólogo anterior en historial
   • Actualiza USUARIO_SIC con nuevo psicólogo
   • Registra auditoría de reasignación
   ↓
PASO 12: Backend responde
   ↓
PASO 13: Frontend muestra resultado (éxito o error)
   → Actualiza tabla de casos
   ↓
PASO 14: Fin del flujo
```

### 4.3 Diagrama Visual - Asignación de Caso

```
┌──────────────────────────────────────────────────────────┐
│  Supervisor en "Consultar Hojas de Vida"                 │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────┐
    │  Clic en botón "Asignar" (rojo)       │
    │  (Solo visible para Sup-Psicologia)   │
    └───────────────┬───────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────────────────┐
    │  Modal: Asignar Caso a Psicólogo                  │
    │  ┌─────────────────────────────────────────────┐  │
    │  │ Caso: María Rodríguez López                 │  │
    │  │ Documento: 1098765432                       │  │
    │  │ ─────────────────────────────────────────── │  │
    │  │ Seleccione Psicólogo:                       │  │
    │  │ ┌─────────────────────────────────────────┐ │  │
    │  │ │ 🔍 [Buscar por documento...]            │ │  │
    │  │ ├─────────────────────────────────────────┤ │  │
    │  │ │ Dr. Juan Pérez - 1098765432             │ │  │
    │  │ │ Dra. Ana García - 1098765433            │ │  │
    │  │ │ Dr. Carlos Martínez - 1098765434        │ │  │
    │  │ └─────────────────────────────────────────┘ │  │
    │  │                                             │  │
    │  │ [Cancelar]  [Asignar Caso]                 │  │
    │  └─────────────────────────────────────────────┘  │
    └───────────────┬─────────────────┬─────────────────┘
                    │                 │
         ┌──────────┴─────────┐      │
         │                     │      │
         ▼                     ▼      │
    [Cancelar]           [Asignar]   │
         │                     │      │
         │                     ▼      │
         │          ┌──────────────────┐
         │          │  Validar input   │
         │          │  (psicólogo != '') │
         │          └────┬─────────┬───┘
         │               │         │
         │          [FAIL]       [OK]
         │               │         │
         │               ▼         ▼
         │          ┌────────┐  ┌──────────────────┐
         │          │ Error  │  │ POST API         │
         │          └────────┘  │ /asignar-caso    │
         │                      └────┬────────┬────┘
         │                           │        │
         │                      [Success]  [Error]
         │                           │        │
         │                           ▼        ▼
         │                      ┌─────────┐ ┌──────┐
         │                      │ Success │ │ Error│
         │                      │ Alert   │ │ Alert│
         │                      └────┬────┘ └──────┘
         │                           │
         └───────────────────────────┴───────────────►  FIN
```

---

## 5. ESPECIFICACIÓN TÉCNICA DETALLADA

### 5.1 PARTE 1: Nuevo Rol "Sup-Psicologia"

#### 5.1.1 Actualización en AuthService

**Archivo:** `src/app/core/auth.service.ts`

**Agregar método para verificar rol Sup-Psicologia:**
```typescript
/**
 * Verifica si el usuario tiene rol de Supervisor de Psicología
 */
isSupPsicologia(): boolean {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.perfil === 'Sup-Psicologia' || payload.Cr_Perfil === 'Sup-Psicologia';
  } catch (error) {
    console.error('Error al verificar rol Sup-Psicologia:', error);
    return false;
  }
}
```

#### 5.1.2 Actualización en Aside (Menú Lateral)

**Archivo:** `src/app/shared/aside/aside.ts`

**Agregar variable:**
```typescript
export class Aside {
  // ... variables existentes
  canViewInformeGeneral: boolean = false;

  ngOnInit(): void {
    // ... código existente

    // Verificar si puede ver Informe General (solo Sup-Psicologia)
    this.canViewInformeGeneral = this.authService.isSupPsicologia();
  }
}
```

**Archivo:** `src/app/shared/aside/aside.html`

**Agregar opción en menú Psicología Gestión (después de línea 239):**
```html
<a
  *ngIf="canViewInformeGeneral"
  class="submenu-item"
  title="Informe General"
  [class.active]="activePanel === 'informeGeneralPs'"
  (click)="openInformeGeneralPs()"
>
  <span class="icon">📈</span>
  <span class="text">Informe General</span>
</a>
```

**Agregar método en aside.ts:**
```typescript
openInformeGeneralPs(): void {
  this.activePanel = 'informeGeneralPs';
  this.router.navigate(['/home'], {
    queryParams: { panel: 'informeGeneralPs' }
  });
}
```

---

### 5.2 PARTE 2: Módulo Informe General

#### 5.2.1 Crear Componente (Clon de Informe)

**Comandos:**
```bash
# Crear carpeta manualmente
mkdir src/app/features/informeGeneralPs

# Copiar archivos existentes de informePs
cp src/app/features/informePs/* src/app/features/informeGeneralPs/
```

**Archivos a crear:**
- `src/app/features/informeGeneralPs/informe-general-ps.ts`
- `src/app/features/informeGeneralPs/informe-general-ps.html`
- `src/app/features/informeGeneralPs/informe-general-ps.service.ts`

**Modificaciones:**
1. Renombrar clase: `InformePs` → `InformeGeneralPs`
2. Renombrar servicio: `InformePsService` → `InformeGeneralPsService`
3. Actualizar selector (si aplica): `app-informe-ps` → `app-informe-general-ps`
4. Mantener TODA la lógica existente de informePs

#### 5.2.2 Actualizar Rutas

**Archivo:** `src/app/app.routes.ts`

**Agregar ruta:**
```typescript
{
  path: 'informe-general-ps',
  loadComponent: () =>
    import('./features/informeGeneralPs/informe-general-ps').then(
      (m) => m.InformeGeneralPs
    ),
  canActivate: [AuthGuard]
}
```

#### 5.2.3 Actualizar Home para Cargar Componente

**Archivo:** `src/app/features/home/home.ts`

**Agregar importación:**
```typescript
import { InformeGeneralPs } from '../informeGeneralPs/informe-general-ps';
```

**Agregar en imports del componente:**
```typescript
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    // ... existentes
    InformeGeneralPs
  ]
})
```

**Actualizar HTML:**
```html
<!-- Agregar después del componente informePs -->
<app-informe-general-ps
  *ngIf="activePanel === 'informeGeneralPs' && canViewInformeGeneral"
></app-informe-general-ps>
```

**Agregar variable en home.ts:**
```typescript
export class Home {
  // ... variables existentes
  canViewInformeGeneral: boolean = false;

  ngOnInit(): void {
    // ... código existente
    this.canViewInformeGeneral = this.authService.isSupPsicologia();
  }
}
```

---

### 5.3 PARTE 3: Asignación de Casos en Consultar Hojas de Vida

#### 5.3.1 Actualizar Servicio de Psicología Gestión

**Archivo:** `src/app/features/psicologiaGestion/psicologia-gestion.service.ts`

**Agregar interfaces (ver sección 3.3)**

**Agregar métodos:**
```typescript
/**
 * Obtiene lista de usuarios del sistema
 */
listarUsuarios(): Observable<ListarUsuariosResponse> {
  const url = `${this.apiUrl}/users/consultar`;

  return this.http.get<ListarUsuariosResponse>(url, {
    headers: {
      'Authorization': `Bearer ${this.getToken()}`
    }
  }).pipe(
    catchError(this.handleError)
  );
}

/**
 * Asigna un caso a un psicólogo
 */
asignarCaso(request: AsignarCasoRequest): Observable<AsignarCasoResponse> {
  const url = `${this.apiUrl}/psicologia-gestion/asignar-caso`;

  return this.http.post<AsignarCasoResponse>(url, request, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    }
  }).pipe(
    catchError(this.handleError)
  );
}

/**
 * Obtiene el token JWT del localStorage
 */
private getToken(): string {
  return localStorage.getItem('token') || '';
}

/**
 * Manejo de errores HTTP
 */
private handleError(error: HttpErrorResponse): Observable<never> {
  console.error('Error en servicio PsicologiaGestion:', error);
  return throwError(() => error);
}
```

#### 5.3.2 Actualizar Componente Consultar Hojas de Vida Ps

**Archivo:** `src/app/features/consultarHojasVidaPs/consultar-hojas-vida-ps.ts`

**Agregar variables:**
```typescript
export class ConsultarHojasVidaPs {
  // ... variables existentes

  isSupPsicologia: boolean = false;
  psicologos: Usuario[] = [];

  constructor(
    private service: PsicologiaGestionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // ... código existente

    // Verificar si es Sup-Psicologia
    this.isSupPsicologia = this.authService.isSupPsicologia();

    // Cargar lista de psicólogos si es supervisor
    if (this.isSupPsicologia) {
      this.cargarPsicologos();
    }
  }

  /**
   * Carga lista de psicólogos del sistema
   */
  cargarPsicologos(): void {
    this.service.listarUsuarios().subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          // Filtrar solo psicólogos
          this.psicologos = resp.response.data.filter(
            (usuario) => usuario.Cr_Perfil === 'Psicólogo'
          );
        }
      },
      error: (error) => {
        console.error('Error al cargar psicólogos:', error);
      }
    });
  }

  /**
   * Asigna un caso a un psicólogo
   */
  asignarCaso(caso: HojaVida): void {
    if (!caso._id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede asignar el caso. ID no válido.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Crear opciones para el select
    const psicologosOptions: { [key: string]: string } = {};
    this.psicologos.forEach((psicologo) => {
      psicologosOptions[psicologo._id] = `${psicologo.Cr_Nombre_Usuario} - ${psicologo.Cr_Documento}`;
    });

    // Mostrar modal con select de psicólogos
    Swal.fire({
      title: 'Asignar Caso a Psicólogo',
      html: `
        <div class="text-start">
          <p class="mb-2">
            <strong>Aspirante:</strong> ${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO || ''}
          </p>
          <p class="mb-2">
            <strong>Documento:</strong> ${caso.DOCUMENTO}
          </p>
          <hr>
          <label for="psicologo-select" class="form-label">
            <strong>Seleccione Psicólogo:</strong> <span class="text-danger">*</span>
          </label>
        </div>
      `,
      input: 'select',
      inputOptions: psicologosOptions,
      inputPlaceholder: 'Seleccione un psicólogo...',
      showCancelButton: true,
      confirmButtonText: 'Asignar Caso',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Debe seleccionar un psicólogo';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const psicologoId = result.value as string;
        this.confirmarAsignacion(caso._id!, psicologoId);
      }
    });
  }

  /**
   * Confirma la asignación del caso
   */
  private confirmarAsignacion(casoId: string, psicologoId: string): void {
    const supervisorId = this.authService.getUserId();

    if (!supervisorId) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Autenticación',
        text: 'No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Asignando caso...',
      html: 'Por favor espere',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar request
    const request: AsignarCasoRequest = {
      caso_id: casoId,
      psicologo_id: psicologoId,
      supervisor_id: supervisorId
    };

    // Llamar al servicio
    this.service.asignarCaso(request).subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          // Buscar nombre del psicólogo asignado
          const psicologo = this.psicologos.find((p) => p._id === psicologoId);
          const nombrePsicologo = psicologo?.Cr_Nombre_Usuario || 'el psicólogo';

          Swal.fire({
            icon: 'success',
            title: '¡Caso Asignado!',
            text: `El caso ha sido asignado exitosamente a ${nombrePsicologo}`,
            timer: 2500,
            showConfirmButton: true,
            confirmButtonText: 'OK'
          });

          // Opcional: Actualizar listado
          // this.consultar();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al Asignar',
            text: resp.response?.mensaje || 'No se pudo asignar el caso',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: (error) => {
        console.error('Error al asignar caso:', error);

        let errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.';

        if (error.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
        } else if (error.status === 403) {
          errorMessage = 'No tiene permisos para asignar casos.';
        } else if (error.status === 404) {
          errorMessage = 'El caso o el psicólogo no fue encontrado.';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error de Conexión',
          text: errorMessage,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}
```

#### 5.3.3 Actualizar HTML de Consultar Hojas de Vida Ps

**Archivo:** `src/app/features/consultarHojasVidaPs/consultar-hojas-vida-ps.html`

**Modificar columna de Acciones (agregar botón Asignar):**
```html
<td class="text-center">
  <button
    type="button"
    class="btn btn-outline-primary btn-sm my-1"
    (click)="verDetalle(caso)"
  >
    Ver
  </button>

  <!-- Botón existente de Tomar Caso -->
  <button
    type="button"
    class="btn btn-success btn-sm ms-1 my-1"
    (click)="tomarCaso(caso)"
  >
    Tomar Caso
  </button>

  <!-- NUEVO BOTÓN: Asignar (solo para Sup-Psicologia) -->
  <button
    *ngIf="isSupPsicologia"
    type="button"
    class="btn btn-danger btn-sm ms-1 my-1"
    (click)="asignarCaso(caso)"
    title="Asignar caso a psicólogo"
  >
    Asignar
  </button>
</td>
```

---

### 5.4 PARTE 4: Nueva Sección "Reasignación de Casos"

#### 5.4.1 Crear Componente Reasignación de Casos

**Archivos a crear:**
- `src/app/features/reasignacionCasosPs/reasignacion-casos-ps.ts`
- `src/app/features/reasignacionCasosPs/reasignacion-casos-ps.html`
- `src/app/features/reasignacionCasosPs/reasignacion-casos-ps.service.ts`

**Contenido de reasignacion-casos-ps.service.ts:**
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CasosConUsuarioSicResponse,
  ReasignarCasoRequest,
  ReasignarCasoResponse
} from '../psicologiaGestion/psicologia-gestion.service';

@Injectable({
  providedIn: 'root'
})
export class ReasignacionCasosPsService {
  private http = inject(HttpClient);
  private apiUrl = 'https://redcemed.com/api';

  /**
   * Obtiene casos con usuario SIC asignado
   */
  getCasosConUsuarioSic(): Observable<CasosConUsuarioSicResponse> {
    const token = localStorage.getItem('token');
    const url = `${this.apiUrl}/hojas-vida/con_usuario_sic`;

    return this.http.get<CasosConUsuarioSicResponse>(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reasigna un caso a otro psicólogo
   */
  reasignarCaso(request: ReasignarCasoRequest): Observable<ReasignarCasoResponse> {
    const url = `${this.apiUrl}/psicologia-gestion/reasignar-caso`;
    const token = localStorage.getItem('token');

    return this.http.post<ReasignarCasoResponse>(url, request, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en servicio ReasignacionCasosPs:', error);
    return throwError(() => error);
  }
}
```

**Contenido de reasignacion-casos-ps.ts:**
```typescript
import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ReasignacionCasosPsService } from './reasignacion-casos-ps.service';
import { PsicologiaGestionService, Usuario, CasoConUsuarioSic } from '../psicologiaGestion/psicologia-gestion.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-reasignacion-casos-ps',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reasignacion-casos-ps.html'
})
export class ReasignacionCasosPs implements OnInit {
  private service = inject(ReasignacionCasosPsService);
  private psicologiaService = inject(PsicologiaGestionService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  casos: CasoConUsuarioSic[] = [];
  psicologos: Usuario[] = [];
  isLoading: boolean = false;

  ngOnInit(): void {
    this.cargarPsicologos();
    this.consultar();
  }

  /**
   * Consulta casos con usuario SIC asignado
   */
  consultar(): void {
    this.isLoading = true;

    this.service.getCasosConUsuarioSic().subscribe({
      next: (resp) => {
        this.isLoading = false;

        if (resp.error === 0) {
          this.casos = resp.response.data;
          this.cdr.detectChanges();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.response?.mensaje || 'Error al consultar casos',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al consultar casos:', error);

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
   * Carga lista de psicólogos
   */
  cargarPsicologos(): void {
    this.psicologiaService.listarUsuarios().subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          this.psicologos = resp.response.data.filter(
            (usuario) => usuario.Cr_Perfil === 'Psicólogo'
          );
        }
      },
      error: (error) => {
        console.error('Error al cargar psicólogos:', error);
      }
    });
  }

  /**
   * Abre modal para reasignar caso
   */
  reasignarCaso(caso: CasoConUsuarioSic): void {
    if (!caso._id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede reasignar el caso. ID no válido.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Crear opciones para el select
    const psicologosOptions: { [key: string]: string } = {};
    this.psicologos.forEach((psicologo) => {
      psicologosOptions[psicologo._id] = `${psicologo.Cr_Nombre_Usuario} - ${psicologo.Cr_Documento}`;
    });

    // Obtener nombre del psicólogo actual
    const psicologoActual = caso.USUARIO_ID?.Cr_Nombre_Usuario || 'No asignado';

    // Mostrar modal
    Swal.fire({
      title: 'Reasignar Caso',
      html: `
        <div class="text-start">
          <p class="mb-2">
            <strong>Aspirante:</strong> ${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO || ''}
          </p>
          <p class="mb-2">
            <strong>Documento:</strong> ${caso.DOCUMENTO}
          </p>
          <p class="mb-2">
            <strong>Psicólogo Actual:</strong> ${psicologoActual}
          </p>
          <hr>
          <label for="psicologo-select" class="form-label">
            <strong>Nuevo Psicólogo:</strong> <span class="text-danger">*</span>
          </label>
        </div>
      `,
      input: 'select',
      inputOptions: psicologosOptions,
      inputPlaceholder: 'Seleccione un psicólogo...',
      showCancelButton: true,
      confirmButtonText: 'Reasignar Caso',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Debe seleccionar un psicólogo';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const psicologoId = result.value as string;
        this.confirmarReasignacion(caso._id, psicologoId);
      }
    });
  }

  /**
   * Confirma la reasignación del caso
   */
  private confirmarReasignacion(casoId: string, psicologoId: string): void {
    const supervisorId = this.authService.getUserId();

    if (!supervisorId) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Autenticación',
        text: 'No se pudo obtener el ID del usuario.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Reasignando caso...',
      html: 'Por favor espere',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar request
    const request = {
      caso_id: casoId,
      psicologo_id: psicologoId,
      supervisor_id: supervisorId
    };

    // Llamar al servicio
    this.service.reasignarCaso(request).subscribe({
      next: (resp) => {
        if (resp.error === 0) {
          const psicologo = this.psicologos.find((p) => p._id === psicologoId);
          const nombrePsicologo = psicologo?.Cr_Nombre_Usuario || 'el psicólogo';

          Swal.fire({
            icon: 'success',
            title: '¡Caso Reasignado!',
            text: `El caso ha sido reasignado exitosamente a ${nombrePsicologo}`,
            timer: 2500,
            showConfirmButton: true,
            confirmButtonText: 'OK'
          });

          // Actualizar listado
          this.consultar();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al Reasignar',
            text: resp.response?.mensaje || 'No se pudo reasignar el caso',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: (error) => {
        console.error('Error al reasignar caso:', error);

        let errorMessage = 'No se pudo conectar con el servidor.';

        if (error.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
        } else if (error.status === 403) {
          errorMessage = 'No tiene permisos para reasignar casos.';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error de Conexión',
          text: errorMessage,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Ver detalle del caso
   */
  verDetalle(caso: CasoConUsuarioSic): void {
    Swal.fire({
      title: 'Detalle del Caso',
      html: `
        <div class="text-start">
          <p><strong>Nombre:</strong> ${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO || ''}</p>
          <p><strong>Documento:</strong> ${caso.DOCUMENTO}</p>
          <p><strong>Psicólogo Asignado:</strong> ${caso.USUARIO_ID?.Cr_Nombre_Usuario || 'No asignado'}</p>
          <p><strong>IPS:</strong> ${caso.IPS_ID?.NOMBRE_IPS || 'N/A'}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
  }
}
```

**Contenido de reasignacion-casos-ps.html:**
```html
<div class="container-fluid mt-4">
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h4 class="mb-0">Reasignación de Casos</h4>
    </div>
    <div class="card-body">
      <!-- Botón Consultar -->
      <div class="mb-3">
        <button
          type="button"
          class="btn btn-primary"
          (click)="consultar()"
          [disabled]="isLoading"
        >
          {{ isLoading ? 'Consultando...' : 'Consultar Casos Asignados' }}
        </button>
      </div>

      <!-- Tabla de casos -->
      <div class="table-responsive" *ngIf="casos.length > 0">
        <table class="table table-striped table-hover">
          <thead class="table-dark">
            <tr>
              <th>Documento</th>
              <th>Nombre Completo</th>
              <th>Psicólogo Asignado</th>
              <th>IPS</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let caso of casos">
              <td>{{ caso.DOCUMENTO }}</td>
              <td>{{ caso.NOMBRE }} {{ caso.PRIMER_APELLIDO }} {{ caso.SEGUNDO_APELLIDO }}</td>
              <td>{{ caso.USUARIO_ID?.Cr_Nombre_Usuario || 'No asignado' }}</td>
              <td>{{ caso.IPS_ID?.NOMBRE_IPS || 'N/A' }}</td>
              <td class="text-center">
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm my-1"
                  (click)="verDetalle(caso)"
                >
                  Ver
                </button>
                <button
                  type="button"
                  class="btn btn-danger btn-sm ms-1 my-1"
                  (click)="reasignarCaso(caso)"
                  title="Reasignar caso a otro psicólogo"
                >
                  Reasignar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mensaje cuando no hay casos -->
      <div class="alert alert-info" *ngIf="!isLoading && casos.length === 0">
        No hay casos asignados para mostrar.
      </div>

      <!-- Loading spinner -->
      <div class="text-center my-4" *ngIf="isLoading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 5.4.2 Actualizar Rutas

**Archivo:** `src/app/app.routes.ts`

```typescript
{
  path: 'reasignacion-casos-ps',
  loadComponent: () =>
    import('./features/reasignacionCasosPs/reasignacion-casos-ps').then(
      (m) => m.ReasignacionCasosPs
    ),
  canActivate: [AuthGuard]
}
```

#### 5.4.3 Actualizar Menú Lateral

**Archivo:** `src/app/shared/aside/aside.html`

**Agregar en Psicología Gestión (después del Informe General):**
```html
<a
  *ngIf="canViewInformeGeneral"
  class="submenu-item"
  title="Reasignación de Casos"
  [class.active]="activePanel === 'reasignacionCasosPs'"
  (click)="openReasignacionCasosPs()"
>
  <span class="icon">🔄</span>
  <span class="text">Reasignación de Casos</span>
</a>
```

**Agregar método en aside.ts:**
```typescript
openReasignacionCasosPs(): void {
  this.activePanel = 'reasignacionCasosPs';
  this.router.navigate(['/home'], {
    queryParams: { panel: 'reasignacionCasosPs' }
  });
}
```

**Actualizar activePanel en clase expanded:**
```typescript
[class.active]="activePanel === 'consultarHojasVidaPs' || activePanel === 'misCasosTomadosPs' || activePanel === 'formularioPs' || activePanel === 'formNotificacionPs' || activePanel === 'creacionPreguntasPs' || activePanel === 'informePs' || activePanel === 'informeGeneralPs' || activePanel === 'reasignacionCasosPs'"
```

#### 5.4.4 Actualizar Home Component

**Archivo:** `src/app/features/home/home.ts`

**Agregar importación:**
```typescript
import { ReasignacionCasosPs } from '../reasignacionCasosPs/reasignacion-casos-ps';
```

**Agregar en imports:**
```typescript
imports: [
  // ... existentes
  ReasignacionCasosPs
]
```

**Archivo:** `src/app/features/home/home.html`

**Agregar componente:**
```html
<app-reasignacion-casos-ps
  *ngIf="activePanel === 'reasignacionCasosPs' && canViewInformeGeneral"
></app-reasignacion-casos-ps>
```

---

## 6. VALIDACIONES Y SEGURIDAD

### 6.1 Validaciones Frontend

| Validación | Tipo | Mensaje de Error |
|------------|------|------------------|
| Psicólogo no seleccionado | Obligatorio | "Debe seleccionar un psicólogo" |
| Usuario sin ID | Autenticación | "No se pudo obtener el ID del usuario" |
| Caso sin ID | Validación de objeto | "No se puede asignar el caso. ID no válido" |
| Rol incorrecto | Autorización | Solo mostrar botones si es Sup-Psicologia |

### 6.2 Validaciones Backend

| Validación | HTTP Status | Mensaje |
|------------|-------------|---------|
| Token JWT inválido | 401 | "No autorizado" |
| Usuario sin permisos | 403 | "No tiene permisos para asignar casos" |
| Caso no encontrado | 404 | "El caso no existe" |
| Psicólogo no encontrado | 404 | "El psicólogo no existe" |
| Psicólogo con perfil incorrecto | 400 | "El usuario seleccionado no es psicólogo" |
| Caso ya asignado (en asignación) | 400 | "El caso ya está asignado a un psicólogo" |

### 6.3 Seguridad

#### Frontend
- Token JWT en header Authorization
- Validación de rol antes de mostrar botones
- Validación de inputs antes de enviar
- Deshabilitar botones durante requests

#### Backend
- Verificar token JWT en cada request
- Validar que usuario tiene rol Sup-Psicologia
- Validar que psicólogo existe y tiene perfil correcto
- Registrar auditoría completa (fecha, supervisor, psicólogo, acción)
- Rate limiting (máx. 20 asignaciones por minuto)

---

## 7. PRUEBAS

### 7.1 Casos de Prueba

#### CP-01: Asignación Exitosa
**Precondiciones:**
- Usuario con rol Sup-Psicologia autenticado
- Caso disponible para asignar

**Pasos:**
1. Navegar a "Psicología Gestión" → "Consultar Hojas de Vida"
2. Verificar que botón "Asignar" es visible
3. Hacer clic en "Asignar"
4. Seleccionar psicólogo de la lista
5. Confirmar asignación

**Resultado Esperado:**
- Modal se muestra con lista de psicólogos
- Request POST exitoso
- Mensaje de éxito se muestra
- Caso queda asignado al psicólogo

#### CP-02: Reasignación Exitosa
**Precondiciones:**
- Usuario Sup-Psicologia autenticado
- Caso ya asignado a un psicólogo

**Pasos:**
1. Navegar a "Reasignación de Casos"
2. Hacer clic en "Consultar Casos Asignados"
3. Verificar que tabla muestra casos con psicólogos asignados
4. Hacer clic en "Reasignar" de un caso
5. Seleccionar nuevo psicólogo
6. Confirmar reasignación

**Resultado Esperado:**
- Tabla muestra casos correctamente
- Modal muestra psicólogo actual
- Request POST exitoso
- Mensaje de éxito
- Tabla se actualiza con nuevo psicólogo

#### CP-03: Validación de Rol
**Precondiciones:**
- Usuario con rol "Psicólogo" (NO Sup-Psicologia)

**Pasos:**
1. Iniciar sesión con usuario Psicólogo
2. Navegar a "Psicología Gestión" → "Consultar Hojas de Vida"

**Resultado Esperado:**
- Botón "Asignar" NO es visible
- Solo se muestran botones "Ver" y "Tomar Caso"

#### CP-04: Informe General - Solo Supervisor
**Precondiciones:**
- Usuario con rol diferente a Sup-Psicologia

**Pasos:**
1. Iniciar sesión
2. Abrir menú "Psicología Gestión"

**Resultado Esperado:**
- Opción "Informe General" NO es visible
- Opción "Reasignación de Casos" NO es visible

#### CP-05: Error de Conexión
**Precondiciones:**
- Backend caído

**Pasos:**
1. Intentar asignar caso

**Resultado Esperado:**
- SweetAlert2 de error con mensaje descriptivo
- Usuario puede reintentar

---

## 8. ESTIMACIÓN DE ESFUERZO

### 8.1 Tareas y Tiempos

| Tarea | Complejidad | Esfuerzo Estimado | Dependencias |
|-------|-------------|-------------------|--------------|
| **PARTE 1: Nuevo Rol** | | | |
| 1. Actualizar AuthService (isSupPsicologia) | Baja | 0.5 horas | - |
| 2. Actualizar aside (menú y navegación) | Baja | 1 hora | Tarea 1 |
| **PARTE 2: Informe General** | | | |
| 3. Crear componente InformeGeneralPs (clon) | Media | 2 horas | Tarea 2 |
| 4. Actualizar rutas y home | Baja | 0.5 horas | Tarea 3 |
| 5. Pruebas de Informe General | Baja | 1 hora | Tareas 3-4 |
| **PARTE 3: Asignación** | | | |
| 6. Actualizar servicio (interfaces + métodos) | Media | 2 horas | - |
| 7. Actualizar componente Consultar HV Ps | Media-Alta | 3 horas | Tarea 6 |
| 8. Actualizar HTML (botón Asignar) | Baja | 0.5 horas | Tarea 7 |
| 9. Pruebas de asignación | Media | 1.5 horas | Tareas 6-8 |
| **PARTE 4: Reasignación** | | | |
| 10. Crear servicio ReasignacionCasosPs | Media | 2 horas | - |
| 11. Crear componente ReasignacionCasosPs | Media-Alta | 3 horas | Tarea 10 |
| 12. Crear HTML tabla + modal | Media | 2 horas | Tarea 11 |
| 13. Actualizar rutas y menú | Baja | 1 hora | Tarea 11 |
| 14. Pruebas de reasignación | Media | 2 horas | Tareas 10-13 |
| **Backend** | | | |
| 15. Endpoint /asignar-caso | Alta | 3 horas | - |
| 16. Endpoint /reasignar-caso | Alta | 3 horas | - |
| 17. Endpoint /con_usuario_sic (si no existe) | Media | 2 horas | - |
| 18. Validaciones y seguridad | Media | 2 horas | Tareas 15-17 |
| 19. Pruebas backend | Media | 2 horas | Tareas 15-18 |
| **QA y Deploy** | | | |
| 20. Testing end-to-end | Alta | 3 horas | Todas |
| 21. Code review | Media | 1.5 horas | Todas |
| 22. Deploy y validación | Media | 1 hora | Todas |
| **TOTAL** | | **38 horas** | |

### 8.2 Distribución por Rol

| Rol | Tareas | Esfuerzo Total |
|-----|--------|----------------|
| Frontend Developer | Tareas 1-14 | 22 horas |
| Backend Developer | Tareas 15-19 | 12 horas |
| QA Engineer | Tarea 20 | 3 horas |
| Tech Lead | Tarea 21 | 1.5 horas |
| DevOps | Tarea 22 | 1 hora |
| **TOTAL** | | **39.5 horas** |

### 8.3 Tiempo de Calendario

**Estimado:** 5-6 días hábiles

**Breakdown:**
- **Día 1:** Rol + Informe General (Tareas 1-5)
- **Día 2:** Asignación - Servicio y Componente (Tareas 6-8)
- **Día 3:** Reasignación - Servicio y Componente (Tareas 10-12)
- **Día 4:** Backend completo (Tareas 15-19)
- **Día 5:** Pruebas + actualización menú/rutas (Tareas 9, 13-14, 20)
- **Día 6:** Code review + deploy (Tareas 21-22)

---

## 9. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Backend endpoints no existen** | Alta | Crítico | Coordinar con backend ANTES de iniciar. Crear mocks si es necesario |
| **Formato JWT diferente al esperado** | Media | Alto | Validar estructura del token con backend. Agregar fallbacks |
| **Problemas al clonar Informe** | Baja | Medio | Hacer copia exacta del código existente. Probar exhaustivamente |
| **Lista de psicólogos vacía** | Media | Alto | Agregar mensaje cuando no hay psicólogos. Validar en backend que existan |
| **Conflictos en reasignación** | Media | Alto | Validar en backend que caso existe y está asignado antes de reasignar |
| **Performance con muchos casos** | Media | Medio | Implementar paginación en frontend. Limitar resultados en backend |

---

## 10. CHECKLIST DE IMPLEMENTACIÓN

### PARTE 1: Nuevo Rol Sup-Psicologia

#### AuthService
- [x] Agregar método `isSupPsicologia(): boolean`
- [x] Validar que lee correctamente el campo `Cr_Perfil` del JWT
- [ ] Probar con diferentes usuarios

#### Aside (Menú)
- [x] Agregar variable `canViewInformeGeneral`
- [x] Inicializar en `ngOnInit()` con `authService.isSupPsicologia()`
- [ ] Probar visibilidad de opciones según rol

---

### PARTE 2: Informe General

#### Crear Componente
- [x] Crear carpeta `src/app/features/informeGeneralPs/`
- [x] Copiar archivos de `informePs/`
- [x] Renombrar clase a `InformeGeneralPs`
- [x] Renombrar servicio a `InformeGeneralPsService`
- [x] Actualizar selector (si aplica)

#### Rutas y Navegación
- [x] Agregar ruta en `app.routes.ts`
- [x] Importar componente en `home.ts`
- [x] Agregar en imports de Home
- [x] Agregar `<app-informe-general-ps>` en `home.html`
- [x] Agregar opción en menú `aside.html`
- [x] Agregar método `openInformeGeneralPs()` en `aside.ts`
- [x] Actualizar `[class.active]` en menú Psicología Gestión

#### Pruebas
- [ ] Verificar que solo Sup-Psicologia ve la opción
- [ ] Verificar que carga correctamente
- [ ] Verificar que toda la funcionalidad de Informe funciona igual

---

### PARTE 3: Asignación de Casos

#### Servicio PsicologiaGestion
- [x] Agregar interfaces: `Usuario`, `ListarUsuariosResponse`
- [x] Agregar interfaces: `AsignarCasoRequest`, `AsignarCasoResponse`
- [x] Implementar método `listarUsuarios()`
- [x] Implementar método `asignarCaso(request)`
- [x] Implementar método privado `getToken()`
- [x] Implementar método privado `handleError()`

#### Componente Consultar Hojas de Vida Ps
- [x] Agregar variable `isSupPsicologia: boolean`
- [x] Agregar variable `psicologos: Usuario[]`
- [x] Inicializar `isSupPsicologia` en `ngOnInit()`
- [x] Implementar método `cargarPsicologos()`
- [x] Implementar método `asignarCaso(caso)`
- [x] Implementar método privado `confirmarAsignacion(casoId, psicologoId)`
- [x] Actualizar constructor para inyectar servicios

#### HTML
- [x] Agregar botón "Asignar" con `*ngIf="isSupPsicologia"`
- [x] Aplicar clase `btn-danger`
- [x] Agregar evento `(click)="asignarCaso(caso)"`
- [x] Posicionar correctamente en columna Acciones

#### Pruebas
- [ ] Verificar que botón solo aparece para Sup-Psicologia
- [ ] Verificar que modal muestra lista de psicólogos
- [ ] Verificar que filtrado funciona correctamente
- [ ] Verificar asignación exitosa
- [ ] Verificar manejo de errores

---

### PARTE 4: Reasignación de Casos

#### Servicio ReasignacionCasosPs
- [x] Crear archivo `reasignacion-casos-ps.service.ts`
- [x] Implementar método `getCasosConUsuarioSic()`
- [x] Implementar método `reasignarCaso(request)`
- [x] Implementar método `handleError()`

#### Componente ReasignacionCasosPs
- [x] Crear archivo `reasignacion-casos-ps.ts`
- [x] Agregar variables: `casos`, `psicologos`, `isLoading`
- [x] Implementar `ngOnInit()`
- [x] Implementar método `consultar()`
- [x] Implementar método `cargarPsicologos()`
- [x] Implementar método `reasignarCaso(caso)`
- [x] Implementar método privado `confirmarReasignacion()`
- [x] Implementar método `verDetalle(caso)`

#### HTML
- [x] Crear archivo `reasignacion-casos-ps.html`
- [x] Crear estructura de card con header
- [x] Agregar botón "Consultar Casos Asignados"
- [x] Crear tabla responsive
- [x] Agregar columnas: Documento, Nombre, Psicólogo, IPS, Acciones
- [x] Agregar botones "Ver" y "Reasignar" en Acciones
- [x] Agregar mensaje cuando no hay casos
- [x] Agregar spinner de loading

#### Rutas y Navegación
- [x] Agregar ruta en `app.routes.ts`
- [x] Importar componente en `home.ts`
- [x] Agregar en imports de Home
- [x] Agregar `<app-reasignacion-casos-ps>` en `home.html`
- [x] Agregar opción en menú `aside.html` (con `*ngIf="canViewInformeGeneral"`)
- [x] Agregar método `openReasignacionCasosPs()` en `aside.ts`
- [x] Actualizar `[class.active]` en menú

#### Pruebas
- [ ] Verificar que solo Sup-Psicologia ve la opción
- [ ] Verificar que tabla carga casos correctamente
- [ ] Verificar que muestra psicólogo asignado
- [ ] Verificar que modal de reasignación funciona
- [ ] Verificar que actualiza tabla después de reasignar
- [ ] Verificar botón "Ver" muestra detalle

---

### Backend

#### Endpoint /api/users/consultar
- [ ] Verificar que existe y funciona
- [ ] Verificar que retorna campo `Cr_Perfil`
- [ ] Probar filtrado por perfil en frontend

#### Endpoint /api/psicologia-gestion/asignar-caso
- [ ] Crear endpoint POST
- [ ] Validar JWT
- [ ] Validar request body (caso_id, psicologo_id, supervisor_id)
- [ ] Verificar que caso existe
- [ ] Verificar que psicólogo existe y tiene perfil correcto
- [ ] Actualizar campo `USUARIO_SIC` del caso
- [ ] Registrar auditoría en `historial_asignaciones`
- [ ] Retornar respuesta estándar

#### Endpoint /api/hojas-vida/con_usuario_sic
- [ ] Verificar que existe (según usuario, ya existe)
- [ ] Si no existe, crearlo
- [ ] Validar JWT
- [ ] Filtrar casos con `USUARIO_SIC` no nulo
- [ ] Hacer populate de `IPS_ID` y `USUARIO_ID`
- [ ] Retornar respuesta con estructura correcta

#### Endpoint /api/psicologia-gestion/reasignar-caso
- [ ] Crear endpoint POST
- [ ] Validar JWT
- [ ] Validar request body
- [ ] Verificar que caso existe y está asignado
- [ ] Registrar psicólogo anterior en auditoría
- [ ] Actualizar `USUARIO_SIC` con nuevo psicólogo
- [ ] Actualizar `historial_asignaciones`
- [ ] Retornar respuesta con datos de reasignación

#### Validaciones Backend
- [ ] Validar token en todos los endpoints
- [ ] Validar que supervisor tiene rol Sup-Psicologia
- [ ] Validar que psicólogo tiene perfil correcto
- [ ] Evitar asignación duplicada
- [ ] Rate limiting
- [ ] Logging de todas las operaciones

#### Pruebas Backend
- [ ] Pruebas unitarias de endpoints
- [ ] Pruebas de validaciones
- [ ] Pruebas de autenticación/autorización
- [ ] Pruebas de casos edge
- [ ] Pruebas de integración con MongoDB

---

### QA y Deploy

#### Testing E2E
- [ ] Ejecutar todos los casos de prueba (CP-01 a CP-05)
- [ ] Probar en Chrome
- [ ] Probar en Firefox
- [ ] Probar en Edge
- [ ] Probar en dispositivos móviles
- [ ] Verificar responsive design
- [ ] Verificar accesibilidad

#### Code Review
- [ ] Revisar código frontend (todos los componentes)
- [ ] Revisar código backend (todos los endpoints)
- [ ] Verificar convenciones de código (CLAUDE.md)
- [ ] Verificar seguridad (XSS, injection, etc.)
- [ ] Verificar manejo de errores
- [ ] Aprobar PR

#### Deploy
- [ ] Build de producción: `npm run build`
- [ ] Deploy a staging
- [ ] Smoke test en staging
- [ ] Validación con usuario final (opcional)
- [ ] Deploy a producción
- [ ] Monitoreo post-deploy
- [ ] Verificar logs de errores

#### Documentación
- [ ] Actualizar CLAUDE.md si es necesario
- [ ] Documentar endpoints en API docs
- [ ] Crear guía de usuario para Sup-Psicologia
- [ ] Actualizar changelog
- [ ] Documentar proceso de asignación/reasignación

---

## 11. CRITERIOS DE ACEPTACIÓN

### Funcionales

#### Nuevo Rol
1. ✅ Usuario con rol "Sup-Psicologia" puede acceder a todas las secciones de Psicología Gestión
2. ✅ Usuario Sup-Psicologia ve opción "Informe General" en menú
3. ✅ Usuario Sup-Psicologia ve opción "Reasignación de Casos" en menú
4. ✅ Otros roles NO ven estas opciones

#### Informe General
5. ✅ Módulo "Informe General" es un clon exacto de "Informe"
6. ✅ Solo Sup-Psicologia puede acceder
7. ✅ Todas las funcionalidades de "Informe" funcionan igual

#### Asignación de Casos
8. ✅ Botón "Asignar" aparece en Consultar Hojas de Vida (solo para Sup-Psicologia)
9. ✅ Botón tiene color rojo
10. ✅ Al hacer clic, abre modal con lista de psicólogos
11. ✅ Lista muestra solo usuarios con perfil "Psicólogo"
12. ✅ Lista muestra Nombre + Documento
13. ✅ Se puede buscar por documento
14. ✅ Al asignar, se envía: caso_id, psicologo_id, supervisor_id
15. ✅ Muestra mensaje de éxito al asignar
16. ✅ Muestra mensaje de error descriptivo si falla

#### Reasignación de Casos
17. ✅ Nueva sección "Reasignación de Casos" aparece en menú (solo Sup-Psicologia)
18. ✅ Al entrar, muestra botón "Consultar Casos Asignados"
19. ✅ Al consultar, consume endpoint `/api/hojas-vida/con_usuario_sic`
20. ✅ Tabla muestra: Documento, Nombre, Psicólogo Asignado, IPS, Acciones
21. ✅ Columna Acciones tiene botones "Ver" y "Reasignar"
22. ✅ Botón "Reasignar" abre modal con lista de psicólogos
23. ✅ Modal muestra psicólogo actual
24. ✅ Al confirmar, envía: caso_id, psicologo_id (nuevo), supervisor_id
25. ✅ Tabla se actualiza después de reasignar
26. ✅ Muestra mensaje de éxito al reasignar

### No Funcionales

27. ✅ Tiempo de respuesta < 3 segundos
28. ✅ Responsive: funciona en desktop, tablet, móvil
29. ✅ Accesibilidad: contraste WCAG AA
30. ✅ Seguridad: validaciones frontend y backend
31. ✅ Sin errores en consola
32. ✅ Build de producción exitoso

---

## 12. GLOSARIO

| Término | Definición |
|---------|------------|
| **Sup-Psicologia** | Supervisor de Psicología - Nuevo rol con permisos avanzados |
| **Asignación** | Acción de asignar un caso a un psicólogo específico |
| **Reasignación** | Cambiar el psicólogo asignado a un caso |
| **USUARIO_SIC** | Campo en BD que almacena el ID del psicólogo asignado al caso |
| **Informe General** | Clon del módulo Informe, exclusivo para Sup-Psicologia |
| **Hoja de Vida** | Expediente de un aspirante (sinónimo de "caso") |

---

## 13. REFERENCIAS

- [SweetAlert2 Documentation](https://sweetalert2.github.io/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)
- [Angular Standalone Components](https://angular.io/guide/standalone-components)
- [MongoDB Update Operators](https://www.mongodb.com/docs/manual/reference/operator/update/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 14. ANEXOS

### Anexo A: Estructura de JWT Esperada

```json
{
  "user_id": "507f191e810c19729de860ea",
  "Cr_Perfil": "Sup-Psicologia",
  "Cr_Nombre_Usuario": "Juan Supervisor",
  "Cr_Documento": "1098765432",
  "iat": 1640000000,
  "exp": 1640086400
}
```

### Anexo B: Ejemplo de Historial de Asignaciones

```javascript
{
  "_id": ObjectId("675abc123def456789012345"),
  "DOCUMENTO": "1098765432",
  "NOMBRE": "María",
  "PRIMER_APELLIDO": "Rodríguez",
  "USUARIO_SIC": ObjectId("507f191e810c19729de860ea"), // Psicólogo actual
  "historial_asignaciones": [
    {
      "fecha": ISODate("2026-05-29T10:00:00Z"),
      "psicologo_id": ObjectId("507f191e810c19729de860ea"),
      "supervisor_id": ObjectId("60a1b2c3d4e5f6g7h8i9j0k1"),
      "accion": "asignacion"
    },
    {
      "fecha": ISODate("2026-06-01T14:30:00Z"),
      "psicologo_id": ObjectId("60a1b2c3d4e5f6g7h8i9j0k2"),
      "psicologo_anterior": ObjectId("507f191e810c19729de860ea"),
      "supervisor_id": ObjectId("60a1b2c3d4e5f6g7h8i9j0k1"),
      "accion": "reasignacion"
    }
  ]
}
```

### Anexo C: Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Angular)                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Psicología Gestión (Sup-Psicologia)       │    │
│  │                                            │    │
│  │  ┌──────────────────────────────────────┐ │    │
│  │  │  Consultar Hojas de Vida Ps          │ │    │
│  │  │  + Botón "Asignar" (rojo)            │ │    │
│  │  └──────────────────────────────────────┘ │    │
│  │                                            │    │
│  │  ┌──────────────────────────────────────┐ │    │
│  │  │  Informe General                     │ │    │
│  │  │  (Clon de Informe)                   │ │    │
│  │  └──────────────────────────────────────┘ │    │
│  │                                            │    │
│  │  ┌──────────────────────────────────────┐ │    │
│  │  │  Reasignación de Casos               │ │    │
│  │  │  + Tabla casos asignados             │ │    │
│  │  │  + Botón "Reasignar"                 │ │    │
│  │  └──────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP Requests
                       │ (JWT Bearer Token)
                       ▼
┌─────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  GET  /api/users/consultar                          │
│  POST /api/psicologia-gestion/asignar-caso          │
│  GET  /api/hojas-vida/con_usuario_sic               │
│  POST /api/psicologia-gestion/reasignar-caso        │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              MongoDB Atlas (Base de Datos)           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Colección: usuarios                                │
│  Colección: hojas_vida                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

**Fin del Documento de Arquitectura Técnica**

_Última actualización: 2026-05-29_
_Versión: 1.0_
_Plan: 04_sup_psicologia_asignacion_reasignacion_
