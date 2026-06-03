# Plan de Arquitectura Técnica - Actualización de Exámenes en Casos Gestionados IPS

## Información General
- **Fecha:** 2026-05-31
- **Módulo:** IPS GESTIÓN → Casos Gestionados → Ver Detalle
- **Tipo de Aplicación:** Web (Angular 21 Standalone)
- **Stack:** Angular 21.2.7 | Bootstrap 5 | Node.js 22.20.0
- **Prioridad:** Alta
- **Complejidad:** Media

---

## 1. RESUMEN EJECUTIVO

### Objetivo
Agregar un botón "Editar" en la vista de detalle del módulo "IPS GESTIÓN → Casos Gestionados", ubicado al lado de los botones "Ver Exámenes" y "Ver Biometría". Al hacer clic, se abrirá un modal Bootstrap que permitirá al usuario cargar un nuevo PDF de exámenes y justificar el motivo del cambio, consumiendo el endpoint `PUT /api/hojas-vida/actualizacion_examenes`.

### Alcance
- Agregar botón "Editar" (color secundario/info) en la sección "Ver Detalle" junto a "Ver Exámenes" y "Ver Biometría"
- Implementar modal Bootstrap con campo de carga de PDF y textarea de justificación (mínimo 100 caracteres)
- Consumir `PUT /api/hojas-vida/actualizacion_examenes` con `multipart/form-data`
- Enviar: `id_caso`, `id_usuario`, `notas_cambio`, `pdf` (archivo)
- Mostrar notificación SweetAlert2 de éxito o error tras la operación

### Restricciones Técnicas
- **Framework:** Angular 21 Standalone
- **Node.js:** 22.20.0
- **Estilos:** Bootstrap 5
- **Notificaciones:** SweetAlert2
- **Formularios:** Reactive Forms
- **API Base:** https://redcemed.com/api/*
- **Método HTTP:** PUT con `multipart/form-data`
- **Tamaño máximo PDF:** 150 MB

---

## 2. STACK TECNOLÓGICO RECOMENDADO

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Angular | 21.2.7 | Framework principal |
| TypeScript | 5.7+ | Lenguaje |
| Bootstrap | 5.x | UI Framework y modal |
| SweetAlert2 | 11.x | Notificaciones de resultado |
| RxJS | 7.8+ | Programación reactiva |
| HttpClient | Angular | Consumo de API (FormData / PUT) |
| FormData API | Browser nativo | Envío multipart/form-data |

### Backend (Existente — solo consumo)
| Componente | Tecnología | Observaciones |
|------------|------------|---------------|
| API REST | FastAPI / Express | Base URL: https://redcemed.com/api/ |
| Base de Datos | MongoDB Atlas | Colección hojas_vida |
| Autenticación | JWT | Token en localStorage key: 'token' |
| Almacenamiento PDF | Sistema de archivos / S3 | Máx 150 MB por archivo |

### Endpoint a Consumir
```
PUT /api/hojas-vida/actualizacion_examenes
Content-Type: multipart/form-data
Authorization: Bearer {token}

Parámetros (FormData):
  - id_caso     (string)  ID del caso a actualizar           [REQUERIDO]
  - id_usuario  (string)  ID del usuario que hace el cambio  [REQUERIDO]
  - notas_cambio(string)  Motivo del cambio                  [REQUERIDO]
  - pdf         (file)    Archivo PDF (máx 150 MB)           [REQUERIDO]

Respuesta exitosa (error: 0):
{
  "error": 0,
  "response": {
    "mensaje": "Exámenes actualizados exitosamente",
    "id_caso": "507f1f77bcf86cd799439011",
    "examenes_actuales": {
      "ruta": "examenes/507f1f77bcf86cd799439011_1735689123456.pdf",
      "id_usuario": "507f191e810c19729de860ea",
      "fecha": "2026-05-31T..."
    },
    "total_historial": 2
  }
}
```

---

## 3. MODELO DE DATOS

### 3.1 Interfaz TypeScript — Request

**Ubicación:** `src/app/features/misCasos/mis-casos.service.ts`

```typescript
// No se define interface para FormData — se construye dinámicamente
// Campos enviados:
// id_caso: string
// id_usuario: string
// notas_cambio: string (min 100 caracteres)
// pdf: File (solo tipo application/pdf, máx 150 MB)
```

### 3.2 Interfaz TypeScript — Response

```typescript
export interface ActualizacionExamenesResponse {
  error: number;
  response: {
    mensaje: string;
    id_caso?: string;
    examenes_actuales?: {
      ruta: string;
      id_usuario: string;
      fecha: string;
    };
    total_historial?: number;
    codigo?: string; // Para errores tipo LIMIT_FILE_SIZE
  };
}
```

### 3.3 Campos Clave

| Campo | Tipo | Fuente | Validación |
|-------|------|--------|------------|
| `id_caso` | string | `caso._id` del objeto seleccionado | Obligatorio, ObjectId válido |
| `id_usuario` | string | `authService.getUserId()` | Obligatorio |
| `notas_cambio` | string | Input textarea del modal | Obligatorio, mínimo 100 caracteres |
| `pdf` | File | Input file del modal | Obligatorio, solo PDF, máx 150 MB |

### 3.4 Estructura en MongoDB (Backend — referencia)

```
Colección: hojas_vida / casos

RUTA_EXAMENES: {
  ruta: String,         // Ruta del PDF actual
  id_usuario: ObjectId,
  fecha: ISODate
}

HISTORIAL_EXAMENES: [
  {
    id_usuario_original: ObjectId,
    ruta_anterior: String,
    fecha_anterior: ISODate,
    fecha_cambio: ISODate,
    notas_cambio: String,
    id_usuario_cambio: ObjectId
  },
  ...
]
```

---

## 4. DIAGRAMA DE FLUJO PRINCIPAL

### 4.1 Flujo Completo del Usuario

```
PASO 1: Usuario navega a "IPS GESTIÓN" → "Casos Gestionados"
   ↓
PASO 2: Usuario localiza un caso en el listado
   ↓
PASO 3: Usuario hace clic en el botón "Ver" para abrir el detalle del caso
   ↓
PASO 4: Sistema muestra el panel/modal de detalle con información del aspirante
        Visible: botones "Ver Exámenes", "Ver Biometría" y (NUEVO) "Editar"
   ↓
PASO 5: Usuario hace clic en botón "Editar" (nuevo botón, color info/warning)
   ↓
PASO 6: Sistema abre modal Bootstrap "Actualizar Documento de Exámenes"
        Contenido del modal:
          - Aviso: "Se realizará la actualización del documento de exámenes"
          - Campo: Input file (acepta solo .pdf)
          - Campo: Textarea "Motivo del cambio" (mínimo 100 caracteres)
          - Contador de caracteres visible
          - Botones: "Cancelar" y "Actualizar Documento"
   ↓
PASO 7: Usuario selecciona un archivo PDF desde su dispositivo
   ↓
PASO 8: Frontend valida en tiempo real:
        • Archivo seleccionado es PDF (type: application/pdf)
        • Tamaño ≤ 150 MB
        • En caso contrario: muestra error inline bajo el input
   ↓
PASO 9: Usuario escribe el motivo del cambio en el textarea
   ↓
PASO 10: [SI VALIDACIONES FALLAN al intentar enviar]
         → Muestra errores inline:
           - "Solo se permiten archivos PDF"
           - "El archivo no puede superar 150 MB"
           - "El motivo debe tener al menos 100 caracteres"
         → Volver a PASO 6 (modal permanece abierto)
   ↓
PASO 11: [SI VALIDACIONES PASAN]
         → Usuario hace clic en "Actualizar Documento"
         → Botón cambia a estado loading (spinner, texto "Actualizando...")
         → Se deshabilitan botones del modal
   ↓
PASO 12: Frontend construye FormData:
         formData.append('id_caso', caso._id)
         formData.append('id_usuario', authService.getUserId())
         formData.append('notas_cambio', textoMotivo)
         formData.append('pdf', archivoSeleccionado)
   ↓
PASO 13: Frontend envía PUT https://redcemed.com/api/hojas-vida/actualizacion_examenes
         Headers: Authorization: Bearer {token}
   ↓
PASO 14: Backend procesa:
         • Valida token JWT
         • Verifica id_caso e id_usuario existen
         • Mueve PDF actual a HISTORIAL_EXAMENES
         • Guarda nuevo PDF en RUTA_EXAMENES
   ↓
PASO 15: Backend responde
   ↓
PASO 16: [SI RESPUESTA EXITOSA (error: 0)]
         → Frontend cierra modal
         → SweetAlert2 success:
           Título: "Documento Actualizado"
           Texto: "Los exámenes han sido actualizados exitosamente"
           Timer: 2500ms
         → (Opcional) Refrescar datos del caso si aplica
   ↓
PASO 17: [SI RESPUESTA ERROR (error: 1)]
         → Modal permanece abierto
         → Botones se rehabilitan
         → SweetAlert2 error con mensaje específico del backend:
           - "El archivo excede el tamaño máximo permitido de 150 MB"
           - "Solo se permiten archivos PDF"
           - "Token inválido o expirado"
           - "Faltan parámetros"
           - "Caso no encontrado"
           - "Usuario no encontrado"
   ↓
PASO 18: Fin del flujo
```

### 4.2 Diagrama Visual

```
┌─────────────────────────────────────────────────┐
│  Lista Casos Gestionados                        │
└───────────────────┬─────────────────────────────┘
                    │  Clic "Ver"
                    ▼
┌─────────────────────────────────────────────────┐
│  Panel/Modal Detalle del Caso                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │
│  │Ver Exámen│  │Ver Biomet.│  │  EDITAR (*)  │ │
│  └──────────┘  └───────────┘  └──────┬───────┘ │
└──────────────────────────────────────┼──────────┘
                                       │ Clic "Editar"
                                       ▼
              ┌────────────────────────────────────┐
              │  Modal Bootstrap                   │
              │  "Actualizar Documento de Exámenes"│
              │  ─────────────────────────────── │
              │  [!] Se actualizará el documento  │
              │                                   │
              │  Nuevo PDF: [Seleccionar archivo] │
              │                                   │
              │  Motivo del cambio:               │
              │  ┌───────────────────────────┐   │
              │  │ [textarea mín 100 chars]  │   │
              │  └───────────────────────────┘   │
              │  (xx / 100 caracteres mínimos)    │
              │                                   │
              │  [Cancelar]  [Actualizar Doc.]    │
              └──────────┬──────────────┬─────────┘
                         │              │
                    [Cancelar]    [Confirmar]
                         │              │
                         │              ▼
                         │     Validaciones frontend
                         │        ┌────┴─────┐
                         │      [FAIL]      [OK]
                         │        │          │
                         │        ▼          ▼
                         │   Errores     FormData
                         │   inline      PUT API
                         │              ┌────┴────┐
                         │           [200 ok]  [error]
                         │              │          │
                         │              ▼          ▼
                         │        SweetAlert   SweetAlert
                         │         success      error
                         │              │
                         └──────────────┴──────► FIN
```

---

## 5. ESPECIFICACIÓN TÉCNICA DETALLADA

### 5.1 Archivos a Modificar

| Archivo | Tipo de cambio |
|---------|---------------|
| `src/app/features/misCasos/mis-casos.html` | Agregar botón "Editar" + modal Bootstrap |
| `src/app/features/misCasos/mis-casos.ts` | Agregar métodos `abrirModalEditar()`, `validarPdf()`, `actualizarExamenes()` |
| `src/app/features/misCasos/mis-casos.service.ts` | Agregar método `actualizarExamenes()` + interface response |

> **Nota:** Si "Casos Gestionados" IPS tiene su propio componente independiente de `misCasos`, aplicar los cambios en ese componente en su lugar. Verificar en `home.component.ts` qué componente renderiza el panel `misCasosGestionados`.

### 5.2 Modal HTML (Bootstrap)

```html
<!-- Modal Actualizar Exámenes -->
<div class="modal fade" id="modalActualizarExamenes" tabindex="-1"
     aria-labelledby="modalActualizarExamenesLabel" aria-hidden="true"
     data-bs-backdrop="static" data-bs-keyboard="false">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">

      <div class="modal-header bg-warning">
        <h5 class="modal-title" id="modalActualizarExamenesLabel">
          Actualizar Documento de Exámenes
        </h5>
        <button type="button" class="btn-close" (click)="cerrarModalEditar()"
                [disabled]="actualizando"></button>
      </div>

      <div class="modal-body">
        <div class="alert alert-warning d-flex align-items-center mb-3" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <span>Se realizará la <strong>actualización del documento</strong> de exámenes correspondiente a este caso.</span>
        </div>

        <!-- Campo PDF -->
        <div class="mb-3">
          <label class="form-label fw-semibold">
            Nuevo documento PDF <span class="text-danger">*</span>
          </label>
          <input
            type="file"
            class="form-control"
            [class.is-invalid]="errorPdf"
            accept=".pdf,application/pdf"
            (change)="onSeleccionarPdf($event)"
            #inputPdf
          />
          <div class="invalid-feedback" *ngIf="errorPdf">{{ errorPdf }}</div>
          <small class="text-muted">Solo archivos PDF. Tamaño máximo: 150 MB</small>
        </div>

        <!-- Campo Motivo -->
        <div class="mb-1">
          <label class="form-label fw-semibold">
            Motivo del cambio <span class="text-danger">*</span>
          </label>
          <textarea
            class="form-control"
            [class.is-invalid]="errorMotivo"
            rows="5"
            placeholder="Explique detalladamente el motivo por el cual se realiza este cambio de documento (mínimo 100 caracteres)..."
            [(ngModel)]="motivoCambio"
            (input)="onMotivoChange()"
            maxlength="2000"
          ></textarea>
          <div class="invalid-feedback" *ngIf="errorMotivo">{{ errorMotivo }}</div>
        </div>
        <small class="text-muted d-block text-end mb-2">
          {{ motivoCambio.length }} / 100 caracteres mínimos
        </small>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary"
                (click)="cerrarModalEditar()"
                [disabled]="actualizando">
          Cancelar
        </button>
        <button type="button" class="btn btn-warning"
                (click)="actualizarExamenes()"
                [disabled]="actualizando">
          <span *ngIf="actualizando" class="spinner-border spinner-border-sm me-2"></span>
          {{ actualizando ? 'Actualizando...' : 'Actualizar Documento' }}
        </button>
      </div>

    </div>
  </div>
</div>
```

### 5.3 Botón "Editar" en la vista de detalle

```html
<!-- Junto a "Ver Exámenes" y "Ver Biometría" en el detalle del caso -->
<button
  type="button"
  class="btn btn-warning btn-sm ms-1 my-1"
  (click)="abrirModalEditar(casoSeleccionado)"
  title="Actualizar documento de exámenes"
>
  <i class="bi bi-pencil-square"></i> Editar
</button>
```

### 5.4 Lógica en el Componente (TypeScript)

```typescript
// Variables de estado para el modal
casoEnEdicion: any = null;
motivoCambio: string = '';
pdfSeleccionado: File | null = null;
errorPdf: string = '';
errorMotivo: string = '';
actualizando: boolean = false;

/**
 * Abre el modal de edición de exámenes para el caso dado
 */
abrirModalEditar(caso: any): void {
  this.casoEnEdicion = caso;
  this.motivoCambio = '';
  this.pdfSeleccionado = null;
  this.errorPdf = '';
  this.errorMotivo = '';
  this.actualizando = false;

  const modal = new (window as any).bootstrap.Modal(
    document.getElementById('modalActualizarExamenes')
  );
  modal.show();
}

/**
 * Cierra el modal limpiando el estado
 */
cerrarModalEditar(): void {
  const modalEl = document.getElementById('modalActualizarExamenes');
  const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
  modal?.hide();
  this.casoEnEdicion = null;
}

/**
 * Valida y guarda el archivo PDF seleccionado
 */
onSeleccionarPdf(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.errorPdf = '';
  this.pdfSeleccionado = null;

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const maxBytes = 150 * 1024 * 1024; // 150 MB

  if (file.type !== 'application/pdf') {
    this.errorPdf = 'Solo se permiten archivos PDF';
    return;
  }

  if (file.size > maxBytes) {
    this.errorPdf = 'El archivo no puede superar 150 MB';
    return;
  }

  this.pdfSeleccionado = file;
}

/**
 * Valida textarea en tiempo real
 */
onMotivoChange(): void {
  if (this.motivoCambio.trim().length >= 100) {
    this.errorMotivo = '';
  }
}

/**
 * Valida formulario y envía la actualización
 */
actualizarExamenes(): void {
  // Reset errores
  this.errorPdf = '';
  this.errorMotivo = '';

  // Validaciones
  let valido = true;

  if (!this.pdfSeleccionado) {
    this.errorPdf = 'Debe seleccionar un archivo PDF';
    valido = false;
  }

  if (!this.motivoCambio || this.motivoCambio.trim().length < 100) {
    this.errorMotivo = `El motivo debe tener al menos 100 caracteres (actual: ${this.motivoCambio.trim().length})`;
    valido = false;
  }

  if (!valido) return;

  const userId = this.authService.getUserId();
  if (!userId) {
    Swal.fire({
      icon: 'error',
      title: 'Error de Autenticación',
      text: 'No se pudo obtener el ID del usuario. Inicie sesión nuevamente.',
    });
    return;
  }

  this.actualizando = true;

  const formData = new FormData();
  formData.append('id_caso', this.casoEnEdicion._id);
  formData.append('id_usuario', userId);
  formData.append('notas_cambio', this.motivoCambio.trim());
  formData.append('pdf', this.pdfSeleccionado!);

  this.service.actualizarExamenes(formData).subscribe({
    next: (resp) => {
      this.actualizando = false;
      if (resp.error === 0) {
        this.cerrarModalEditar();
        Swal.fire({
          icon: 'success',
          title: 'Documento Actualizado',
          text: resp.response?.mensaje || 'Los exámenes han sido actualizados exitosamente',
          timer: 2500,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al Actualizar',
          text: resp.response?.mensaje || 'No se pudo actualizar el documento',
        });
      }
    },
    error: (err) => {
      this.actualizando = false;
      let msg = 'No se pudo conectar con el servidor.';
      if (err.status === 401) msg = 'Sesión expirada. Por favor inicie sesión nuevamente.';
      else if (err.status === 413) msg = 'El archivo excede el tamaño máximo permitido (150 MB).';

      Swal.fire({ icon: 'error', title: 'Error de Conexión', text: msg });
    }
  });
}
```

### 5.5 Método en el Servicio

```typescript
/**
 * Actualiza el documento de exámenes de un caso
 * @param formData FormData con: id_caso, id_usuario, notas_cambio, pdf
 */
actualizarExamenes(formData: FormData): Observable<ActualizacionExamenesResponse> {
  const url = `${this.apiUrl}/hojas-vida/actualizacion_examenes`;
  const token = localStorage.getItem('token') || '';

  return this.http.put<ActualizacionExamenesResponse>(url, formData, {
    headers: {
      'Authorization': `Bearer ${token}`
      // NO incluir 'Content-Type' — HttpClient lo setea automáticamente con boundary
    }
  }).pipe(
    catchError((error: HttpErrorResponse) => throwError(() => error))
  );
}
```

---

## 6. VALIDACIONES Y MANEJO DE ERRORES

### 6.1 Validaciones Frontend

| Campo | Regla | Mensaje |
|-------|-------|---------|
| PDF | Obligatorio | "Debe seleccionar un archivo PDF" |
| PDF | Tipo `application/pdf` | "Solo se permiten archivos PDF" |
| PDF | Tamaño ≤ 150 MB | "El archivo no puede superar 150 MB" |
| Motivo | Obligatorio | "Debe ingresar el motivo del cambio" |
| Motivo | Mínimo 100 caracteres | "El motivo debe tener al menos 100 caracteres (actual: X)" |
| id_caso | Validación de objeto | Verificar que `caso._id` existe antes de abrir modal |
| id_usuario | Autenticación | "No se pudo obtener el ID del usuario" |

### 6.2 Errores del Backend manejados

| Código Backend | Mensaje a mostrar |
|----------------|-------------------|
| `error: 1` + `LIMIT_FILE_SIZE` | "El archivo excede el tamaño máximo de 150 MB" |
| `error: 1` + "Solo se permiten archivos PDF" | "Solo se permiten archivos PDF" |
| `error: 1` + "Token inválido" | "Sesión expirada. Por favor inicie sesión nuevamente" |
| `error: 1` + "Faltan parámetros" | "Faltan datos requeridos. Intente nuevamente" |
| `error: 1` + "notas_cambio son obligatorias" | "El motivo del cambio es obligatorio" |
| `error: 1` + "Formato de id_caso inválido" | "ID de caso inválido. Contacte al administrador" |
| `error: 1` + "Caso no encontrado" | "El caso no fue encontrado en el sistema" |
| `error: 1` + "Usuario no encontrado" | "El usuario no fue encontrado. Inicie sesión nuevamente" |
| HTTP 413 | "El archivo excede el tamaño permitido por el servidor" |
| HTTP 401 | "Sesión expirada. Por favor inicie sesión nuevamente" |
| Sin conexión | "No se pudo conectar con el servidor" |

---

## 7. CHECKLIST DE IMPLEMENTACIÓN

### Frontend — HTML

- [ ] Identificar en qué componente se renderiza "Casos Gestionados" IPS (verificar `home.component.ts`)
- [ ] Localizar la sección "Ver Detalle" dentro del componente identificado
- [ ] Agregar botón "Editar" (`btn-warning`) al lado de "Ver Exámenes" y "Ver Biometría"
- [ ] Agregar modal Bootstrap `#modalActualizarExamenes` al final del template
- [ ] Modal debe tener: alerta informativa, input file PDF, textarea motivo, contador de caracteres
- [ ] Modal con `data-bs-backdrop="static"` para evitar cierre accidental
- [ ] Botón de submit con estado loading (spinner + texto "Actualizando...")

### Frontend — TypeScript (Componente)

- [ ] Declarar variables de estado: `casoEnEdicion`, `motivoCambio`, `pdfSeleccionado`, `errorPdf`, `errorMotivo`, `actualizando`
- [ ] Implementar `abrirModalEditar(caso)`: asigna caso, limpia estado, abre modal Bootstrap
- [ ] Implementar `cerrarModalEditar()`: limpia estado, cierra modal
- [ ] Implementar `onSeleccionarPdf(event)`: valida tipo PDF y tamaño (≤150 MB)
- [ ] Implementar `onMotivoChange()`: limpia error cuando se alcanza mínimo 100 chars
- [ ] Implementar `actualizarExamenes()`: valida todo, construye FormData, llama al servicio
- [ ] Manejar respuesta exitosa: cerrar modal + SweetAlert2 success
- [ ] Manejar errores del backend: SweetAlert2 con mensaje específico
- [ ] Manejar errores HTTP (401, 413, sin conexión)
- [ ] Deshabilitar botones durante la petición (`actualizando = true`)
- [ ] Inyectar `AuthService` si no está ya inyectado en el componente
- [ ] Inyectar servicio del módulo si `actualizarExamenes` es método nuevo

### Frontend — Servicio

- [ ] Agregar interface `ActualizacionExamenesResponse` en el archivo de servicio
- [ ] Implementar método `actualizarExamenes(formData: FormData): Observable<...>`
- [ ] Usar `PUT` con `multipart/form-data` (NO incluir Content-Type manual en headers)
- [ ] Incluir header `Authorization: Bearer {token}`
- [ ] Agregar `catchError` para reenviar errores al componente

### Verificaciones Previas

- [ ] Confirmar que `AuthService.getUserId()` retorna el ID correcto (verificar estructura del localStorage 'user')
- [ ] Confirmar que `caso._id` existe en el objeto del caso seleccionado
- [ ] Confirmar que Bootstrap JS está disponible (para `new bootstrap.Modal(...)`)
- [ ] Probar endpoint con Postman/curl antes de implementar frontend

### Pruebas Manuales

- [ ] CP-01: Carga exitosa — PDF válido + motivo >= 100 chars → éxito
- [ ] CP-02: Sin PDF → error inline "Debe seleccionar un archivo PDF"
- [ ] CP-03: PDF inválido (ej. .docx) → error inline "Solo se permiten archivos PDF"
- [ ] CP-04: Motivo vacío → error inline
- [ ] CP-05: Motivo con 50 chars → error inline con contador
- [ ] CP-06: Motivo con exactamente 100 chars → sin error
- [ ] CP-07: Token expirado → SweetAlert2 error de sesión
- [ ] CP-08: Cancelar → no se envía nada, modal se cierra limpio
- [ ] CP-09: Doble clic en "Actualizar" → botón deshabilitado, no duplica request

---

## 8. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Bootstrap JS no disponible en Angular | Media | Alto | Verificar que bootstrap está importado en `angular.json` scripts. Alternativa: usar `@ViewChild` y `Modal` de `@ng-bootstrap` |
| `caso._id` undefined en el detalle | Baja | Medio | Validar antes de abrir modal: `if (!caso?._id) return` |
| Content-Type con boundary incorrecto | Media | Alto | NO setear Content-Type manual. Dejar que `HttpClient` lo haga automáticamente al detectar FormData |
| Archivo grande bloquea UI | Media | Bajo | La carga al servidor es async; el spinner cubre el período de espera |
| Timeout en archivos muy grandes | Media | Medio | Considerar agregar timeout extendido en HttpClient para archivos > 50 MB |

---

## 9. CRITERIOS DE ACEPTACIÓN

### Funcionales
- [ ] El botón "Editar" aparece al lado de "Ver Exámenes" y "Ver Biometría" en la vista de detalle
- [ ] Al hacer clic abre modal con aviso informativo, input file y textarea
- [ ] El input file acepta solo `.pdf`
- [ ] El textarea exige mínimo 100 caracteres con contador visible
- [ ] Los errores de validación aparecen inline (no en alerta externa)
- [ ] Durante el envío los botones se deshabilitan y aparece spinner
- [ ] Respuesta exitosa: modal se cierra + SweetAlert2 success
- [ ] Respuesta error: modal permanece abierto + SweetAlert2 con mensaje del backend
- [ ] Cancelar limpia todos los campos del modal

### No Funcionales
- [ ] No se envía Content-Type manual (evita error de boundary en multipart)
- [ ] Token JWT incluido en Authorization header
- [ ] Validación de tamaño (150 MB) en frontend antes de enviar
- [ ] Compatible con Chrome, Firefox y Edge
- [ ] Responsive en desktop y tablet

---

**Fin del Documento**

_Última actualización: 2026-05-31_
