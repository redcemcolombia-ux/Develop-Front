# Plan de Arquitectura Técnica - Liberación de Casos IPS GESTIÓN

## Información General
- **Fecha:** 2026-05-29
- **Módulo:** IPS GESTIÓN → Mis Casos Tomados
- **Tipo de Aplicación:** Web (Angular 21 Standalone)
- **Stack:** Angular 21.2.7 | Angular CLI 21.2.6 | Node.js 22.20.0
- **Prioridad:** Alta
- **Complejidad:** Media

---

## 1. RESUMEN EJECUTIVO

### Objetivo
Implementar funcionalidad de liberación de casos en el módulo "IPS GESTIÓN" → "Mis Casos Tomados", permitiendo a los usuarios de IPS liberar casos asignados mediante un botón con modal de confirmación que capture el motivo de liberación.

### Alcance
- Agregar botón de liberación (rojo con icono de papelera) en la columna Acciones
- Implementar modal de confirmación con textarea para informe de liberación
- Integrar con servicio backend para procesar la liberación
- Enviar: ID del caso, informe de liberación, ID del usuario logueado
- Actualizar listado después de liberación exitosa

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

### Nuevo Endpoint Requerido
```
POST /api/ips-gestion/liberar-caso
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "caso_id": "string",
  "informe_liberacion": "string",
  "usuario_id": "string"
}

Response (Éxito):
{
  "error": 0,
  "response": {
    "mensaje": "Caso liberado exitosamente",
    "data": {
      "caso_id": "string",
      "fecha_liberacion": "2026-05-29T10:30:00Z"
    }
  }
}

Response (Error):
{
  "error": 1,
  "response": {
    "mensaje": "Error al liberar caso: [detalle]"
  }
}
```

---

## 3. MODELO DE DATOS

### 3.1 Entidad Principal: Caso (HojaVida)

**Interfaz TypeScript Existente:**
```typescript
export interface HojaVida {
  _id?: string;
  DOCUMENTO: string;
  NOMBRE: string;
  PRIMER_APELLIDO: string;
  SEGUNDO_APELLIDO?: string;
  CORREO?: string;
  CELULAR?: string;
  CIUDAD?: string;
  EXAMENES?: string;
  PDF_URL?: string;
  RUTA_BIOMETRIA?: {
    ruta?: string;
  };
  NOMBREIPS?: string;
  ESTADO?: string;
  // ... otros campos
}
```

### 3.2 Nueva Interfaz: Liberación de Caso

**Ubicación:** `src/app/features/misCasos/mis-casos.service.ts`

```typescript
export interface LiberacionCasoRequest {
  caso_id: string;              // ID del caso (_id de HojaVida)
  informe_liberacion: string;   // Motivo de liberación
  usuario_id: string;           // ID del usuario logueado
}

export interface LiberacionCasoResponse {
  error: number;
  response: {
    mensaje: string;
    data?: {
      caso_id: string;
      fecha_liberacion: string;
    }
  }
}
```

### 3.3 Campos Clave y Relaciones

| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| caso_id | string | Identificador único del caso (_id) | Sí |
| informe_liberacion | string | Motivo/razón de liberación (max 1000 caracteres) | Sí |
| usuario_id | string | ID del usuario que libera | Sí |
| fecha_liberacion | DateTime | Timestamp de liberación (generado por backend) | No (auto) |
| ips_id | string | ID de la IPS asociada al usuario | No (inferido) |

### 3.4 Actualización en Base de Datos (Backend)

**Colección:** `hojas_vida` o `casos_ips`

**Campos a actualizar/agregar:**
```javascript
{
  // ... campos existentes

  // NUEVO - Información de liberación
  liberacion: {
    estado: "liberado",              // "tomado" | "liberado" | "gestionado"
    fecha_liberacion: ISODate,       // Timestamp
    liberado_por: ObjectId,          // Referencia a usuarios
    informe: String,                 // Motivo de liberación
    ips_anterior: ObjectId           // Referencia a IPS que lo liberó
  },

  // ACTUALIZAR campo existente
  estado_asignacion: "disponible",   // Cambiar de "tomado" a "disponible"

  // Auditoría
  ultima_actualizacion: ISODate,
  actualizado_por: ObjectId
}
```

---

## 4. DIAGRAMA DE FLUJO PRINCIPAL

### 4.1 Flujo Completo del Usuario

```
PASO 1: Usuario visualiza listado "Mis Casos Tomados"
   ↓
PASO 2: Usuario identifica caso a liberar
   ↓
PASO 3: Usuario hace clic en botón "Liberar" (rojo con icono papelera)
   ↓
PASO 4: Sistema abre modal de SweetAlert2
   • Título: "Liberar Caso"
   • Mensaje: "Por favor, indique el motivo de liberación"
   • Input: Textarea grande (5 filas, max 1000 caracteres)
   • Botones: "Cancelar" y "Confirmar Liberación"
   ↓
PASO 5: Usuario escribe informe de liberación
   ↓
PASO 6: Usuario hace clic en "Confirmar Liberación"
   ↓
PASO 7: Frontend valida:
   • Textarea no está vacío
   • Longitud mínima: 10 caracteres
   • Longitud máxima: 1000 caracteres
   ↓
PASO 8: [SI VALIDACIÓN FALLA]
   → Mostrar error: "El informe debe tener entre 10 y 1000 caracteres"
   → Volver a PASO 4
   ↓
PASO 9: [SI VALIDACIÓN PASA]
   → Frontend prepara payload:
     {
       caso_id: caso._id,
       informe_liberacion: texto ingresado,
       usuario_id: usuario logueado
     }
   ↓
PASO 10: Frontend envía POST /api/ips-gestion/liberar-caso
   • Loading: Deshabilitar botones en modal
   • Mostrar spinner
   ↓
PASO 11: Backend procesa solicitud
   • Valida token JWT
   • Verifica que caso existe
   • Verifica que caso está asignado a esa IPS
   • Actualiza estado del caso a "liberado"
   • Registra auditoría (fecha, usuario, informe)
   ↓
PASO 12: Backend responde
   ↓
PASO 13: [SI RESPUESTA ES EXITOSA (error: 0)]
   → Frontend cierra modal
   → Muestra SweetAlert2 de éxito:
     • Título: "¡Caso Liberado!"
     • Texto: "El caso ha sido liberado exitosamente"
     • Icono: success
     • Timer: 2 segundos
   → Actualiza listado (llama a consultar())
   → Caso desaparece de la tabla
   ↓
PASO 14: [SI RESPUESTA ES ERROR (error: 1)]
   → Frontend muestra SweetAlert2 de error:
     • Título: "Error al Liberar"
     • Texto: mensaje del backend
     • Icono: error
   → Usuario puede reintentar desde PASO 3
   ↓
PASO 15: Fin del flujo
```

### 4.2 Diagrama de Flujo Visual

```
┌──────────────────────────────────────────────────────────┐
│  Usuario en "Mis Casos Tomados"                          │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────┐
    │  Clic en botón "Liberar" (rojo)       │
    └───────────────┬───────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────────────────┐
    │  Modal SweetAlert2                                 │
    │  ┌─────────────────────────────────────────────┐  │
    │  │ Título: Liberar Caso                        │  │
    │  │ ─────────────────────────────────────────── │  │
    │  │ Motivo de liberación:                       │  │
    │  │ ┌─────────────────────────────────────────┐ │  │
    │  │ │ [Textarea - 5 filas]                    │ │  │
    │  │ │                                         │ │  │
    │  │ └─────────────────────────────────────────┘ │  │
    │  │                                             │  │
    │  │ [Cancelar]  [Confirmar Liberación]         │  │
    │  └─────────────────────────────────────────────┘  │
    └───────────────┬─────────────────┬─────────────────┘
                    │                 │
         ┌──────────┴─────────┐      │
         │                     │      │
         ▼                     ▼      │
    [Cancelar]           [Confirmar] │
         │                     │      │
         │                     ▼      │
         │          ┌──────────────────┐
         │          │  Validar input   │
         │          │  (10-1000 chars) │
         │          └────┬─────────┬───┘
         │               │         │
         │          [FAIL]       [OK]
         │               │         │
         │               ▼         ▼
         │          ┌────────┐  ┌──────────────────┐
         │          │ Error  │  │ POST API         │
         │          └────────┘  │ /liberar-caso    │
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
         │                           ▼
         │                    ┌────────────────┐
         │                    │ Recargar datos │
         │                    │ consultar()    │
         │                    └────────────────┘
         │                           │
         └───────────────────────────┴───────────────►  FIN
```

---

## 5. ESPECIFICACIÓN TÉCNICA DETALLADA

### 5.1 Modificaciones en el Componente `MisCasos`

#### 5.1.1 Archivo: `src/app/features/misCasos/mis-casos.html`

**Líneas a modificar:** 87-105 (Columna Acciones)

**Cambio:**
```html
<!-- ANTES -->
<td class="text-center">
  <button type="button" class="btn btn-outline-primary btn-sm my-1" (click)="verDetalle(caso)">Ver</button>
  <button
    type="button"
    class="btn btn-sm ms-1 my-1 platform-btn-text-white"
    [ngClass]="caso.PDF_URL ? 'btn-primary' : 'btn-warning'"
    (click)="cargarPDF(caso)"
  >
    Examenes
  </button>
  <button
    type="button"
    class="btn btn-sm ms-1 my-1"
    [ngClass]="hasBiometriaPdf(caso) ? 'btn-primary' : 'btn-success'"
    (click)="cargarBiometria(caso)"
  >
    Biometria
  </button>
</td>

<!-- DESPUÉS -->
<td class="text-center">
  <button type="button" class="btn btn-outline-primary btn-sm my-1" (click)="verDetalle(caso)">Ver</button>
  <button
    type="button"
    class="btn btn-sm ms-1 my-1 platform-btn-text-white"
    [ngClass]="caso.PDF_URL ? 'btn-primary' : 'btn-warning'"
    (click)="cargarPDF(caso)"
  >
    Examenes
  </button>
  <button
    type="button"
    class="btn btn-sm ms-1 my-1"
    [ngClass]="hasBiometriaPdf(caso) ? 'btn-primary' : 'btn-success'"
    (click)="cargarBiometria(caso)"
  >
    Biometria
  </button>
  <!-- NUEVO BOTÓN: Liberar Caso -->
  <button
    type="button"
    class="btn btn-danger btn-sm ms-1 my-1"
    (click)="liberarCaso(caso)"
    title="Liberar caso"
  >
    <i class="bi bi-trash"></i> Liberar
  </button>
</td>
```

**Nota:** Si no se usa Bootstrap Icons, usar emoji o FontAwesome:
- Emoji: `🗑️`
- FontAwesome: `<i class="fas fa-trash-alt"></i>`

#### 5.1.2 Archivo: `src/app/features/misCasos/mis-casos.ts`

**Método nuevo a agregar:**

```typescript
/**
 * Libera un caso asignado a la IPS
 * Muestra modal de confirmación con textarea para informe
 */
liberarCaso(caso: HojaVida): void {
  // Validar que el caso tenga ID
  if (!caso._id) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se puede liberar el caso. ID no válido.',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  // Mostrar modal de SweetAlert2 con input textarea
  Swal.fire({
    title: 'Liberar Caso',
    html: `
      <div class="text-start">
        <p class="mb-2">
          <strong>Aspirante:</strong> ${caso.NOMBRE} ${caso.PRIMER_APELLIDO} ${caso.SEGUNDO_APELLIDO || ''}
        </p>
        <p class="mb-2">
          <strong>Documento:</strong> ${caso.DOCUMENTO}
        </p>
        <hr>
        <label for="informe-liberacion" class="form-label">
          <strong>Motivo de liberación:</strong> <span class="text-danger">*</span>
        </label>
        <textarea
          id="informe-liberacion"
          class="form-control"
          rows="5"
          placeholder="Describa el motivo por el cual libera este caso (mínimo 10 caracteres)..."
          maxlength="1000"
        ></textarea>
        <small class="text-muted d-block mt-1">Máximo 1000 caracteres</small>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Confirmar Liberación',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
    focusConfirm: false,
    preConfirm: () => {
      const textarea = document.getElementById('informe-liberacion') as HTMLTextAreaElement;
      const informe = textarea?.value?.trim() || '';

      // Validación
      if (!informe) {
        Swal.showValidationMessage('El informe de liberación es obligatorio');
        return false;
      }

      if (informe.length < 10) {
        Swal.showValidationMessage('El informe debe tener al menos 10 caracteres');
        return false;
      }

      if (informe.length > 1000) {
        Swal.showValidationMessage('El informe no puede exceder 1000 caracteres');
        return false;
      }

      return informe;
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    if (result.isConfirmed) {
      const informeLiberacion = result.value as string;
      this.confirmarLiberacion(caso._id!, informeLiberacion);
    }
  });
}

/**
 * Confirma la liberación del caso llamando al servicio
 */
private confirmarLiberacion(casoId: string, informeLiberacion: string): void {
  // Obtener ID del usuario logueado
  const usuarioId = this.authService.getUserId();

  if (!usuarioId) {
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
    title: 'Liberando caso...',
    html: 'Por favor espere',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Preparar request
  const request: LiberacionCasoRequest = {
    caso_id: casoId,
    informe_liberacion: informeLiberacion,
    usuario_id: usuarioId
  };

  // Llamar al servicio
  this.service.liberarCaso(request).subscribe({
    next: (resp) => {
      if (resp.error === 0) {
        // Éxito
        Swal.fire({
          icon: 'success',
          title: '¡Caso Liberado!',
          text: resp.response?.mensaje || 'El caso ha sido liberado exitosamente',
          timer: 2000,
          showConfirmButton: false
        });

        // Recargar datos
        this.consultar(false);
      } else {
        // Error del backend
        Swal.fire({
          icon: 'error',
          title: 'Error al Liberar',
          text: resp.response?.mensaje || 'No se pudo liberar el caso',
          confirmButtonText: 'Entendido'
        });
      }
    },
    error: (error) => {
      console.error('Error al liberar caso:', error);

      let errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.';

      if (error.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
      } else if (error.status === 403) {
        errorMessage = 'No tiene permisos para liberar este caso.';
      } else if (error.status === 404) {
        errorMessage = 'El caso no fue encontrado.';
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
```

#### 5.1.3 Archivo: `src/app/features/misCasos/mis-casos.service.ts`

**Interfaces a agregar:**

```typescript
export interface LiberacionCasoRequest {
  caso_id: string;
  informe_liberacion: string;
  usuario_id: string;
}

export interface LiberacionCasoResponse {
  error: number;
  response: {
    mensaje: string;
    data?: {
      caso_id: string;
      fecha_liberacion: string;
    }
  }
}
```

**Método nuevo en el servicio:**

```typescript
/**
 * Libera un caso asignado a una IPS
 * @param request Datos de liberación (caso_id, informe, usuario_id)
 * @returns Observable con respuesta del backend
 */
liberarCaso(request: LiberacionCasoRequest): Observable<LiberacionCasoResponse> {
  const url = `${this.apiUrl}/ips-gestion/liberar-caso`;

  return this.http.post<LiberacionCasoResponse>(url, request, {
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
  console.error('Error en servicio MisCasos:', error);
  return throwError(() => error);
}
```

#### 5.1.4 Actualización en `AuthService`

**Archivo:** `src/app/core/auth.service.ts`

**Método a agregar (si no existe):**

```typescript
/**
 * Obtiene el ID del usuario logueado desde el token JWT
 * @returns ID del usuario o null si no está disponible
 */
getUserId(): string | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Decodificar JWT (parte del payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.id || payload.sub || null;
  } catch (error) {
    console.error('Error al obtener ID de usuario:', error);
    return null;
  }
}
```

---

## 6. VALIDACIONES Y SEGURIDAD

### 6.1 Validaciones Frontend (Angular)

| Validación | Tipo | Mensaje de Error |
|------------|------|------------------|
| Campo vacío | Obligatorio | "El informe de liberación es obligatorio" |
| Longitud mínima | 10 caracteres | "El informe debe tener al menos 10 caracteres" |
| Longitud máxima | 1000 caracteres | "El informe no puede exceder 1000 caracteres" |
| Caso sin ID | Validación de objeto | "No se puede liberar el caso. ID no válido" |
| Usuario sin ID | Autenticación | "No se pudo obtener el ID del usuario" |

### 6.2 Validaciones Backend (API)

| Validación | HTTP Status | Mensaje |
|------------|-------------|---------|
| Token JWT inválido | 401 | "No autorizado" |
| Usuario sin permisos | 403 | "No tiene permisos para liberar casos" |
| Caso no encontrado | 404 | "El caso no existe" |
| Caso no asignado a IPS | 403 | "El caso no está asignado a su IPS" |
| Caso ya liberado | 400 | "El caso ya fue liberado previamente" |
| Informe vacío | 400 | "El informe de liberación es obligatorio" |
| Informe muy corto | 400 | "El informe debe tener al menos 10 caracteres" |

### 6.3 Seguridad

#### Frontend
- ✅ Token JWT enviado en header `Authorization`
- ✅ Validación de input antes de enviar
- ✅ Sanitización de HTML en SweetAlert2
- ✅ Deshabilitar botones durante request (evitar doble clic)
- ✅ Manejo de timeout (30 segundos)

#### Backend
- ✅ Verificar token JWT en cada request
- ✅ Validar que usuario pertenece a la IPS del caso
- ✅ Validar estado del caso antes de liberar
- ✅ Registrar auditoría completa (fecha, usuario, motivo)
- ✅ Evitar SQL/NoSQL injection
- ✅ Rate limiting (máx. 10 liberaciones por minuto por usuario)

---

## 7. PRUEBAS

### 7.1 Casos de Prueba

#### CP-01: Liberación Exitosa
**Precondiciones:**
- Usuario autenticado con rol IPS
- Caso asignado a la IPS del usuario

**Pasos:**
1. Navegar a "IPS GESTIÓN" → "Mis Casos Tomados"
2. Hacer clic en botón "Liberar" (rojo) de un caso
3. Ingresar motivo válido (>10 caracteres) en textarea
4. Hacer clic en "Confirmar Liberación"

**Resultado Esperado:**
- Modal de loading se muestra
- Request POST exitoso (error: 0)
- Modal de éxito se muestra
- Caso desaparece del listado
- Tabla se actualiza automáticamente

#### CP-02: Validación de Campo Vacío
**Pasos:**
1. Abrir modal de liberación
2. Dejar textarea vacío
3. Hacer clic en "Confirmar Liberación"

**Resultado Esperado:**
- Mensaje de error: "El informe de liberación es obligatorio"
- Modal permanece abierto
- No se envía request al backend

#### CP-03: Validación de Longitud Mínima
**Pasos:**
1. Abrir modal de liberación
2. Ingresar texto de 5 caracteres
3. Hacer clic en "Confirmar Liberación"

**Resultado Esperado:**
- Mensaje de error: "El informe debe tener al menos 10 caracteres"
- Modal permanece abierto

#### CP-04: Caso Sin ID
**Pasos:**
1. Modificar temporalmente objeto caso para que no tenga _id
2. Hacer clic en botón "Liberar"

**Resultado Esperado:**
- SweetAlert2 de error: "No se puede liberar el caso. ID no válido"
- No se abre modal de confirmación

#### CP-05: Error de Conexión
**Precondiciones:**
- Servidor backend caído o sin conexión

**Pasos:**
1. Abrir modal de liberación
2. Ingresar motivo válido
3. Confirmar liberación

**Resultado Esperado:**
- SweetAlert2 de error: "No se pudo conectar con el servidor..."
- Usuario puede reintentar

#### CP-06: Token Expirado
**Precondiciones:**
- Token JWT expirado

**Pasos:**
1. Intentar liberar caso

**Resultado Esperado:**
- SweetAlert2 de error: "Sesión expirada. Por favor, inicie sesión nuevamente"
- HTTP Status: 401

### 7.2 Pruebas Unitarias (Jasmine/Karma)

```typescript
describe('MisCasos - Liberación de Casos', () => {
  let component: MisCasos;
  let service: jasmine.SpyObj<MisCasosService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('MisCasosService', ['liberarCaso']);
    authService = jasmine.createSpyObj('AuthService', ['getUserId']);

    component = new MisCasos(service, authService, cdr);
  });

  it('debe mostrar modal de confirmación al hacer clic en liberar', () => {
    spyOn(Swal, 'fire');
    const casoMock = { _id: '123', NOMBRE: 'Juan', DOCUMENTO: '12345' };

    component.liberarCaso(casoMock as any);

    expect(Swal.fire).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Liberar Caso' })
    );
  });

  it('debe validar que el informe no esté vacío', () => {
    const casoMock = { _id: '123' };
    // Simular textarea vacío
    // ... lógica de prueba
  });

  it('debe llamar al servicio con datos correctos', () => {
    authService.getUserId.and.returnValue('user123');
    service.liberarCaso.and.returnValue(of({
      error: 0,
      response: { mensaje: 'Éxito' }
    }));

    const request = {
      caso_id: 'caso123',
      informe_liberacion: 'Motivo de liberación válido',
      usuario_id: 'user123'
    };

    component['confirmarLiberacion']('caso123', 'Motivo de liberación válido');

    expect(service.liberarCaso).toHaveBeenCalledWith(request);
  });

  it('debe actualizar listado después de liberación exitosa', () => {
    spyOn(component, 'consultar');
    service.liberarCaso.and.returnValue(of({
      error: 0,
      response: { mensaje: 'Éxito' }
    }));

    // ... ejecutar liberación

    expect(component.consultar).toHaveBeenCalledWith(false);
  });
});
```

---

## 8. ESTIMACIÓN DE ESFUERZO

### 8.1 Tareas y Tiempos

| Tarea | Complejidad | Esfuerzo Estimado | Dependencias |
|-------|-------------|-------------------|--------------|
| **Frontend** | | | |
| 1. Agregar botón en HTML | Baja | 0.5 horas | - |
| 2. Implementar método `liberarCaso()` | Media | 2 horas | - |
| 3. Implementar método `confirmarLiberacion()` | Media | 1.5 horas | Tarea 2 |
| 4. Actualizar servicio (interfaces + método) | Media | 1.5 horas | - |
| 5. Agregar método `getUserId()` en AuthService | Baja | 0.5 horas | - |
| 6. Pruebas unitarias | Media | 2 horas | Tareas 2-5 |
| 7. Pruebas manuales | Media | 1 hora | Todas frontend |
| **Backend** | | | |
| 8. Crear endpoint `/liberar-caso` | Media-Alta | 3 horas | - |
| 9. Implementar lógica de liberación | Alta | 2 horas | Tarea 8 |
| 10. Validaciones y seguridad | Media | 1.5 horas | Tarea 9 |
| 11. Actualización en MongoDB | Media | 1.5 horas | Tarea 9 |
| 12. Pruebas de integración | Media | 2 horas | Tareas 8-11 |
| **QA y Deploy** | | | |
| 13. Testing end-to-end | Media | 1.5 horas | Todas |
| 14. Code review | Baja | 1 hora | Todas |
| 15. Deploy a staging | Baja | 0.5 horas | Todas |
| 16. Testing en staging | Media | 1 hora | Tarea 15 |
| **TOTAL** | | **23 horas** | |

### 8.2 Distribución por Rol

| Rol | Tareas | Esfuerzo Total |
|-----|--------|----------------|
| Frontend Developer | Tareas 1-7 | 9 horas |
| Backend Developer | Tareas 8-12 | 10 horas |
| QA Engineer | Tareas 13, 16 | 2.5 horas |
| Tech Lead | Tarea 14 | 1 hora |
| DevOps | Tarea 15 | 0.5 horas |
| **TOTAL** | | **23 horas** |

### 8.3 Tiempo de Calendario

**Estimado:** 3-4 días hábiles

**Breakdown:**
- **Día 1:** Frontend completo (Tareas 1-5)
- **Día 2:** Backend completo (Tareas 8-11) + Pruebas unitarias frontend (Tarea 6)
- **Día 3:** Pruebas de integración backend (Tarea 12) + Testing manual (Tarea 7)
- **Día 4:** QA, code review, deploy y validación final (Tareas 13-16)

---

## 9. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Backend endpoint no existe** | Media | Alto | Coordinar con backend antes de iniciar. Crear mock temporal si es necesario |
| **Cambios en estructura de JWT** | Baja | Medio | Validar formato de JWT con backend. Agregar manejo de errores robusto |
| **Usuario libera caso que no le pertenece** | Baja | Crítico | Validación estricta en backend (verificar IPS del usuario vs caso) |
| **Error al actualizar listado** | Media | Medio | Agregar try-catch en método `consultar()`. Mostrar mensaje amigable al usuario |
| **Modal no renderiza correctamente** | Baja | Bajo | Probar en diferentes navegadores (Chrome, Firefox, Edge) |
| **Textarea no valida en móvil** | Media | Bajo | Agregar validación responsive. Probar en dispositivos móviles |

---

## 10. CHECKLIST DE IMPLEMENTACIÓN

### ✅ Frontend

#### Estructura
- [x] Agregar botón "Liberar" en `mis-casos.html` línea ~105
- [x] Agregar icono de papelera (Bootstrap Icons, emoji o FontAwesome)
- [x] Aplicar clase `btn-danger` para color rojo
- [x] Agregar evento `(click)="liberarCaso(caso)"`

#### Lógica (Component)
- [x] Crear método `liberarCaso(caso: HojaVida): void`
- [x] Validar que caso tenga `_id`
- [x] Implementar modal SweetAlert2 con textarea
- [x] Agregar validaciones de input (vacío, longitud mín/máx)
- [x] Crear método privado `confirmarLiberacion(casoId, informe): void`
- [x] Obtener `usuario_id` desde `AuthService`
- [x] Llamar a `service.liberarCaso(request)`
- [x] Manejar respuesta exitosa (mostrar success + recargar datos)
- [x] Manejar errores (mostrar mensajes específicos)

#### Servicio
- [x] Crear interface `LiberacionCasoRequest`
- [x] Crear interface `LiberacionCasoResponse`
- [x] Implementar método `liberarCaso(request): Observable<Response>`
- [x] Agregar headers de autenticación (Bearer token)
- [x] Implementar manejo de errores con `catchError`

#### AuthService
- [x] Agregar método `getUserId(): string | null`
- [x] Decodificar JWT para extraer ID de usuario
- [x] Manejar errores de decodificación

#### Pruebas
- [ ] Escribir pruebas unitarias para `liberarCaso()`
- [ ] Escribir pruebas para validaciones
- [ ] Escribir pruebas para `confirmarLiberacion()`
- [ ] Ejecutar `ng test` y verificar cobertura >70%
- [ ] Pruebas manuales en navegador
- [ ] Pruebas en diferentes dispositivos (desktop, tablet, móvil)

### ✅ Backend

#### Endpoint
- [ ] Crear ruta `POST /api/ips-gestion/liberar-caso`
- [ ] Configurar middleware de autenticación JWT
- [ ] Validar request body (caso_id, informe, usuario_id)
- [ ] Implementar lógica de liberación

#### Validaciones
- [ ] Validar que usuario esté autenticado
- [ ] Validar que caso existe en BD
- [ ] Validar que caso está asignado a la IPS del usuario
- [ ] Validar que caso no esté ya liberado
- [ ] Validar longitud del informe (10-1000 caracteres)

#### Base de Datos
- [ ] Actualizar campo `estado_asignacion` a "disponible"
- [ ] Crear/actualizar objeto `liberacion` con:
  - [ ] `estado: "liberado"`
  - [ ] `fecha_liberacion: ISODate`
  - [ ] `liberado_por: ObjectId`
  - [ ] `informe: String`
  - [ ] `ips_anterior: ObjectId`
- [ ] Actualizar campo `ultima_actualizacion`
- [ ] Registrar auditoría completa

#### Respuesta
- [ ] Retornar JSON con estructura estándar
- [ ] Incluir mensaje descriptivo
- [ ] Incluir datos relevantes (caso_id, fecha_liberacion)
- [ ] Manejar errores con códigos HTTP apropiados

#### Pruebas
- [ ] Pruebas unitarias de endpoint
- [ ] Pruebas de integración con MongoDB
- [ ] Pruebas de autenticación y autorización
- [ ] Pruebas de validaciones
- [ ] Pruebas de casos edge (caso ya liberado, usuario sin permisos, etc.)

### ✅ QA y Deploy

#### Testing
- [ ] Ejecutar todos los casos de prueba (CP-01 a CP-06)
- [ ] Probar en navegadores: Chrome, Firefox, Edge
- [ ] Probar en dispositivos móviles (responsive)
- [ ] Verificar accesibilidad (contraste, tamaño de fuente)
- [ ] Probar con diferentes roles de usuario

#### Code Review
- [ ] Revisar código frontend (componente + servicio)
- [ ] Revisar código backend (endpoint + validaciones)
- [ ] Verificar convenciones de código (CLAUDE.md)
- [ ] Verificar seguridad (XSS, SQL injection, etc.)
- [ ] Aprobar PR

#### Deploy
- [ ] Build de producción: `npm run build`
- [ ] Deploy a entorno staging
- [ ] Smoke test en staging
- [ ] Validación con usuario final (opcional)
- [ ] Deploy a producción
- [ ] Monitoreo post-deploy (logs, errores)

#### Documentación
- [ ] Actualizar CLAUDE.md con nuevos métodos
- [ ] Documentar endpoint en API docs
- [ ] Crear guía de usuario (si aplica)
- [ ] Actualizar changelog

---

## 11. DOCUMENTACIÓN ADICIONAL

### 11.1 Endpoint API - Documentación Técnica

```yaml
# Swagger / OpenAPI Specification

/api/ips-gestion/liberar-caso:
  post:
    summary: Libera un caso asignado a una IPS
    description: |
      Permite a un usuario de IPS liberar un caso previamente asignado,
      registrando el motivo de liberación para auditoría.

    tags:
      - IPS Gestión

    security:
      - BearerAuth: []

    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - caso_id
              - informe_liberacion
              - usuario_id
            properties:
              caso_id:
                type: string
                description: ID único del caso (MongoDB ObjectId)
                example: "507f1f77bcf86cd799439011"
              informe_liberacion:
                type: string
                minLength: 10
                maxLength: 1000
                description: Motivo detallado de liberación del caso
                example: "Paciente no se presentó a la cita programada después de 3 intentos"
              usuario_id:
                type: string
                description: ID del usuario que libera el caso
                example: "507f191e810c19729de860ea"

    responses:
      200:
        description: Caso liberado exitosamente
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: integer
                  example: 0
                response:
                  type: object
                  properties:
                    mensaje:
                      type: string
                      example: "Caso liberado exitosamente"
                    data:
                      type: object
                      properties:
                        caso_id:
                          type: string
                          example: "507f1f77bcf86cd799439011"
                        fecha_liberacion:
                          type: string
                          format: date-time
                          example: "2026-05-29T10:30:00Z"

      400:
        description: Datos inválidos o caso ya liberado
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: integer
                  example: 1
                response:
                  type: object
                  properties:
                    mensaje:
                      type: string
                      example: "El informe de liberación es obligatorio"

      401:
        description: No autorizado (token inválido o expirado)

      403:
        description: No tiene permisos para liberar este caso

      404:
        description: Caso no encontrado

      500:
        description: Error interno del servidor
```

### 11.2 Convenciones de Código

Según `CLAUDE.md`:

- **Clases sin sufijo:** `MisCasos` (no `MisCasosComponent`)
- **Archivos:** kebab-case (`mis-casos.html`)
- **Métodos:** camelCase (`liberarCaso`)
- **Reactive Forms:** siempre
- **SweetAlert2:** para todas las notificaciones
- **Standalone:** `true` siempre

### 11.3 Referencias

- [SweetAlert2 Documentation](https://sweetalert2.github.io/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)
- [Angular Reactive Forms](https://angular.io/guide/reactive-forms)
- [MongoDB Update Operators](https://www.mongodb.com/docs/manual/reference/operator/update/)

---

## 12. GLOSARIO

| Término | Definición |
|---------|------------|
| **Caso** | Aspirante asignado a una IPS para evaluación médica |
| **Liberación** | Acción de desasignar un caso de una IPS, dejándolo disponible |
| **Informe de Liberación** | Documento que justifica por qué se libera un caso |
| **IPS** | Institución Prestadora de Salud |
| **JWT** | JSON Web Token - método de autenticación |
| **Modal** | Ventana emergente para interacción del usuario |

---

## 13. CRITERIOS DE ACEPTACIÓN

### ✅ Funcionales

1. ✅ El botón "Liberar" aparece en la columna Acciones
2. ✅ El botón tiene color rojo (`btn-danger`)
3. ✅ El botón tiene icono de papelera
4. ✅ Al hacer clic, se abre modal de SweetAlert2
5. ✅ El modal tiene:
   - ✅ Título: "Liberar Caso"
   - ✅ Información del aspirante (nombre, documento)
   - ✅ Textarea con 5 filas
   - ✅ Placeholder descriptivo
   - ✅ Botones "Cancelar" y "Confirmar Liberación"
6. ✅ El textarea valida:
   - ✅ No vacío
   - ✅ Mínimo 10 caracteres
   - ✅ Máximo 1000 caracteres
7. ✅ Al confirmar, se envía request POST al backend
8. ✅ Request incluye: `caso_id`, `informe_liberacion`, `usuario_id`
9. ✅ Si éxito: muestra alerta de éxito + actualiza listado
10. ✅ Si error: muestra alerta de error con mensaje descriptivo
11. ✅ El caso liberado desaparece del listado

### ✅ No Funcionales

1. ✅ Tiempo de respuesta: <3 segundos
2. ✅ Responsive: funciona en desktop, tablet y móvil
3. ✅ Accesibilidad: contraste mínimo WCAG AA
4. ✅ Seguridad: validaciones en frontend y backend
5. ✅ Cobertura de pruebas: >70%
6. ✅ Sin errores de linter
7. ✅ Build de producción exitoso

---

## 14. CONTACTO Y SOPORTE

### Responsables

| Rol | Nombre | Contacto |
|-----|--------|----------|
| Product Owner | [Nombre] | [email] |
| Tech Lead | [Nombre] | [email] |
| Frontend Developer | [Nombre] | [email] |
| Backend Developer | [Nombre] | [email] |
| QA Engineer | [Nombre] | [email] |

### Enlaces Útiles

- **Repositorio:** [Git URL]
- **Trello/Jira:** [Board URL]
- **API Docs:** https://redcemed.com/api/docs
- **Staging:** [Staging URL]
- **Producción:** https://redcemed.com

---

**Fin del Documento de Arquitectura Técnica**

_Última actualización: 2026-05-29_
