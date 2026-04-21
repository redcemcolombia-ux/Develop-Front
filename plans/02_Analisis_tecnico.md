# Análisis Técnico Completo - Sistema Gestor IPS

## Fecha: 2026-04-14
## Alcance: Frontend Angular 17 Standalone + Backend API + MongoDB Atlas
## Stack: Angular 17 | Bootstrap 5 | API REST (`https://redcemed.com/api/*`) | MongoDB Atlas

---

## 1. RESUMEN EJECUTIVO

### Objetivo General
Implementar un sistema completo de gestión para IPS (Instituciones Prestadoras de Salud) que permita:
- Autenticación y gestión de usuarios
- Administración de IPS y aspirantes
- Gestión de hojas de vida
- **NUEVO**: Módulo de Psicología con carga de PDFs de evaluaciones
- Reportes y consultas

### Módulos del Sistema

#### 1.1 Módulos Existentes (Base)
- **Login**: Autenticación JWT
- **Home**: Dashboard principal
- **Registro de Usuarios**: Alta de usuarios del sistema
- **Listado de Usuarios**: Consulta y gestión de usuarios (en construcción)

#### 1.2 Módulos Admin IPS (en construcción)
- **Registro IPS**: Alta de instituciones
- **Listado IPS**: Consulta y gestión de IPS

#### 1.3 Módulos Críticos
- **Gestor Hoja de Vida**: Consulta de hojas de vida de aspirantes
- **NUEVO - Psicología Gestión**: Carga y gestión de PDFs de evaluaciones psicológicas

### Componentes Afectados en esta Fase
- **NUEVO**: Módulo completo de Psicología Gestión (frontend)
- **ACTUALIZACIÓN**: Módulo Gestor Hoja de Vida (agregar visualización de PDFs psicológicos)
- **ACTUALIZACIÓN**: Navegación y menú lateral (agregar nueva opción en Admin IPS)

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Estructura Frontend Completa (Angular 17 Standalone)

```
src/app/
├── app.ts, app.html, app.css                    # Componente raíz
├── app.config.ts                                # Configuración global
├── app.routes.ts                                # Rutas principales
│
├── assets/                                      # Recursos estáticos
│   ├── images/                                  # Logos, fondos, iconos
│   └── videos/                                  # Videos institucionales
│
├── core/                                        # Servicios y guards core
│   ├── auth.guard.ts                            # Protección de rutas
│   └── auth.service.ts                          # Servicio de autenticación
│
├── features/                                    # Módulos funcionales
│   │
│   ├── login/                                   # EXISTENTE
│   │   ├── login.ts
│   │   ├── login.html
│   │   ├── login.css
│   │   ├── login.service.ts
│   │   └── login.spec.ts
│   │
│   ├── home/                                    # EXISTENTE
│   │   ├── home.ts
│   │   ├── home.html
│   │   └── home.css
│   │
│   ├── registroUsuarios/                        # EXISTENTE
│   │   ├── registro-usuarios.ts
│   │   ├── registro-usuarios.html
│   │   ├── registro-usuarios.css
│   │   ├── registro-usuarios.service.ts
│   │   └── registro-usuarios.spec.ts
│   │
│   ├── listadoUsuarios/                         # EN CONSTRUCCIÓN
│   │   ├── listado-usuarios.ts
│   │   ├── listado-usuarios.html
│   │   ├── listado-usuarios.css
│   │   └── listado-usuarios.service.ts
│   │
│   ├── registroIps/                             # EN CONSTRUCCIÓN
│   │   ├── registro-ips.ts
│   │   ├── registro-ips.html
│   │   ├── registro-ips.css
│   │   └── registro-ips.service.ts
│   │
│   ├── listadoIps/                              # EN CONSTRUCCIÓN
│   │   ├── listado-ips.ts
│   │   ├── listado-ips.html
│   │   ├── listado-ips.css
│   │   └── listado-ips.service.ts
│   │
│   ├── hojaVida/                                # ACTUALIZAR ⚠️
│   │   ├── hoja-vida.ts                         → agregar sección PDF Psicología
│   │   ├── hoja-vida.html                       → mostrar PDF cargado
│   │   ├── hoja-vida.css
│   │   └── hoja-vida.service.ts                 → nuevo endpoint psicología
│   │
│   └── psicologiaGestion/                       # NUEVO ⭐
│       ├── psicologia-gestion.ts
│       ├── psicologia-gestion.html
│       ├── psicologia-gestion.css
│       ├── psicologia-gestion.service.ts
│       └── psicologia-gestion.spec.ts
│
└── shared/                                      # Componentes compartidos
    ├── aside/                                   # Menú lateral (ACTUALIZAR)
    │   └── aside.ts                             → agregar ruta Psicología
    ├── topbar/                                  # Barra superior
    │   └── topbar.ts
    └── theme/                                   # Configuración de tema
        └── theme.service.ts
```

### 2.2 API Endpoints (Backend existente: `https://redcemed.com/api/*`)

```
API Base URL: https://redcemed.com/api

AUTENTICACIÓN
├── POST   /auth/login                           # Login con JWT
├── POST   /auth/logout                          # Cerrar sesión
└── POST   /auth/refresh                         # Renovar token

USUARIOS
├── GET    /usuarios                             # Listar usuarios
├── POST   /usuarios                             # Crear usuario
├── GET    /usuarios/{id}                        # Obtener usuario
├── PUT    /usuarios/{id}                        # Actualizar usuario
└── DELETE /usuarios/{id}                        # Eliminar usuario

IPS (INSTITUCIONES)
├── GET    /ips                                  # Listar IPS
├── POST   /ips                                  # Crear IPS
├── GET    /ips/{id}                             # Obtener IPS
├── PUT    /ips/{id}                             # Actualizar IPS
└── DELETE /ips/{id}                             # Eliminar IPS

HOJAS DE VIDA
├── GET    /hojas-vida                           # Listar hojas de vida
├── GET    /hojas-vida/{aspirante_id}            # Obtener hoja de vida
├── GET    /hojas-vida/{aspirante_id}/psicologia # NUEVO - PDF Psicología
└── PUT    /hojas-vida/{aspirante_id}            # Actualizar hoja de vida

PSICOLOGÍA (NUEVOS ENDPOINTS) ⭐
├── GET    /psicologia/evaluaciones              # Listar evaluaciones (paginado)
├── GET    /psicologia/aspirantes-disponibles    # Aspirantes sin evaluación
├── POST   /psicologia/evaluaciones              # Subir PDF evaluación
├── GET    /psicologia/evaluaciones/{id}/pdf     # Descargar PDF
├── DELETE /psicologia/evaluaciones/{id}         # Eliminar evaluación
├── PATCH  /psicologia/evaluaciones/{id}         # Actualizar observaciones
└── GET    /psicologia/reportes/export           # Exportar reporte
```

### 2.3 Base de Datos MongoDB Atlas - Esquemas de Colecciones

#### 2.3.1 Colección: `usuarios`
```javascript
{
  _id: ObjectId,
  nombre: String,
  apellido: String,
  email: String,                   // Único, índice
  password: String,                // Hash bcrypt
  rol: String,                     // "admin", "admin_ips", "operador"
  estado: String,                  // "activo", "inactivo"
  fecha_creacion: DateTime,
  fecha_actualizacion: DateTime,
  creado_por: ObjectId,            // Referencia a usuarios
  ultimo_acceso: DateTime
}
```

#### 2.3.2 Colección: `ips` (Instituciones)
```javascript
{
  _id: ObjectId,
  nit: String,                     // Único, índice
  razon_social: String,
  nombre_comercial: String,
  direccion: String,
  ciudad: String,
  departamento: String,
  telefono: String,
  email: String,
  representante_legal: {
    nombre: String,
    documento: String,
    cargo: String
  },
  estado: String,                  // "activo", "inactivo", "suspendido"
  fecha_registro: DateTime,
  fecha_actualizacion: DateTime,
  registrado_por: ObjectId         // Referencia a usuarios
}
```

#### 2.3.3 Colección: `aspirantes`
```javascript
{
  _id: ObjectId,
  documento: String,               // Único, índice
  tipo_documento: String,          // "CC", "TI", "CE", "PP"
  nombres: String,
  apellidos: String,
  fecha_nacimiento: Date,
  email: String,
  telefono: String,
  direccion: String,
  ciudad: String,
  estado: String,                  // "activo", "inactivo", "proceso"
  fecha_registro: DateTime,
  ips_asociada: ObjectId,          // Referencia a ips (opcional)
}
```

#### 2.3.4 Colección: `hojas_vida` (ACTUALIZAR ⚠️)
```javascript
{
  _id: ObjectId,
  aspirante_id: ObjectId,          // Referencia a aspirantes (único)
  documento: String,               // Denormalizado para búsquedas
  nombre_completo: String,         // Denormalizado

  // Información académica
  formacion: [{
    nivel: String,                 // "bachillerato", "técnico", "profesional", etc.
    titulo: String,
    institucion: String,
    fecha_inicio: Date,
    fecha_fin: Date,
    documento_url: String          // PDF certificado
  }],

  // Experiencia laboral
  experiencia: [{
    cargo: String,
    empresa: String,
    fecha_inicio: Date,
    fecha_fin: Date,
    funciones: String,
    documento_url: String          // PDF certificado
  }],

  // Documentos generales
  documentos: [{
    tipo: String,                  // "cedula", "diplomas", "certificados", etc.
    nombre: String,
    url: String,
    fecha_carga: DateTime
  }],

  // ⭐ NUEVO CAMPO - Evaluación Psicológica
  psicologia: {
    tiene_evaluacion: Boolean,
    evaluacion_id: ObjectId,       // Referencia a psicologia_evaluaciones
    ultima_actualizacion: DateTime
  },

  // Metadata
  estado: String,                  // "completo", "incompleto", "revisión"
  porcentaje_completitud: Number,  // 0-100
  fecha_creacion: DateTime,
  fecha_actualizacion: DateTime,
  actualizado_por: ObjectId        // Referencia a usuarios
}
```

#### 2.3.5 Colección: `psicologia_evaluaciones` (NUEVA ⭐)
```javascript
{
  _id: ObjectId,
  aspirante_id: ObjectId,          // Referencia a aspirantes (índice)
  documento: String,               // Denormalizado para búsquedas (índice)
  nombre_completo: String,         // Denormalizado

  // Información del archivo PDF
  pdf_url: String,                 // URL completa del archivo
  pdf_filename: String,            // Nombre original del archivo
  pdf_size: Number,                // Tamaño en bytes

  // Metadata de evaluación
  tipo_evaluacion: String,         // "inicial", "seguimiento", "control"
  observaciones: String,           // Notas del evaluador
  vigencia: Date,                  // Fecha de vigencia del documento

  // Auditoría
  fecha_carga: DateTime,           // Timestamp de carga
  cargado_por: ObjectId,           // Usuario que cargó (referencia a usuarios)
  estado: String,                  // "activo", "archivado", "eliminado"

  // Índices sugeridos
  // - { aspirante_id: 1, estado: 1 }
  // - { documento: 1 }
  // - { fecha_carga: -1 }
}
```

---

## 3. ESPECIFICACIÓN TÉCNICA - FRONTEND ANGULAR

### 3.1 Módulo de Autenticación (Login) - EXISTENTE

#### 3.1.1 Componente: Login
**Archivos**:
- `src/app/features/login/login.ts`
- `src/app/features/login/login.html`
- `src/app/features/login/login.css`
- `src/app/features/login/login.service.ts`

**Funcionalidades**:
- Reactive Form con validaciones (usuario/email y contraseña)
- Integración con API: `POST /auth/login`
- Guardar JWT en localStorage (key: `token`)
- Redirección a `/home` después de login exitoso
- Manejo de errores con SweetAlert2

**Ruta**: `/login`

**Pending**:
- ✅ Ya implementado según CLAUDE.md

---

### 3.2 Módulo Home (Dashboard) - EXISTENTE

#### 3.2.1 Componente: Home
**Archivos**:
- `src/app/features/home/home.ts`
- `src/app/features/home/home.html`
- `src/app/features/home/home.css`

**Funcionalidades**:
- Dashboard principal protegido por AuthGuard
- Mostrar resumen de estadísticas (opcional)
- Navegación a diferentes módulos vía aside menu

**Ruta**: `/home`

**Estado**: ✅ Implementado

---

### 3.3 Módulo Registro de Usuarios - EXISTENTE

#### 3.3.1 Componente: RegistroUsuarios
**Archivos**:
- `src/app/features/registroUsuarios/registro-usuarios.ts`
- `src/app/features/registroUsuarios/registro-usuarios.html`
- `src/app/features/registroUsuarios/registro-usuarios.css`
- `src/app/features/registroUsuarios/registro-usuarios.service.ts`

**Funcionalidades**:
- Reactive Form para alta de usuarios del sistema
- Campos: nombre, apellido, email, contraseña, rol
- Validaciones: email único, contraseña fuerte
- Integración con API: `POST /usuarios`
- SweetAlert2 para confirmaciones

**Ruta**: `/admin/registro-usuario`

**Estado**: ✅ Implementado

---

### 3.4 Módulo Listado de Usuarios - EN CONSTRUCCIÓN

#### 3.4.1 Componente: ListadoUsuarios
**Archivos** (a crear):
- `src/app/features/listadoUsuarios/listado-usuarios.ts`
- `src/app/features/listadoUsuarios/listado-usuarios.html`
- `src/app/features/listadoUsuarios/listado-usuarios.css`
- `src/app/features/listadoUsuarios/listado-usuarios.service.ts`

**Funcionalidades**:
- Tabla Bootstrap con listado paginado
- Columnas: Nombre, Email, Rol, Estado, Fecha Creación, Acciones
- Filtros: búsqueda por nombre/email, filtro por rol
- Acciones por registro:
  - Ver detalle (modal o vista dedicada)
  - Editar (formulario en modal)
  - Activar/Desactivar (cambio de estado)
  - Eliminar (con confirmación)
- Paginación (10, 25, 50 registros)

**Endpoints**:
- `GET /usuarios?page=1&limit=10&search=...&rol=...`
- `PUT /usuarios/{id}`
- `DELETE /usuarios/{id}`

**Ruta**: `/admin/listado-usuario`

**Estado**: 🚧 Pendiente

---

### 3.5 Módulo Registro IPS - EN CONSTRUCCIÓN

#### 3.5.1 Componente: RegistroIps
**Archivos** (a crear):
- `src/app/features/registroIps/registro-ips.ts`
- `src/app/features/registroIps/registro-ips.html`
- `src/app/features/registroIps/registro-ips.css`
- `src/app/features/registroIps/registro-ips.service.ts`

**Funcionalidades**:
- Reactive Form para registro de IPS
- Secciones:
  1. Información general (NIT, razón social, nombre comercial)
  2. Ubicación (dirección, ciudad, departamento)
  3. Contacto (teléfono, email)
  4. Representante legal (nombre, documento, cargo)
- Validaciones: NIT único, email válido
- Integración con API: `POST /ips`

**Endpoints**:
- `POST /ips`

**Ruta**: `/admin-ips/registro-ips`

**Estado**: 🚧 Pendiente

---

### 3.6 Módulo Listado IPS - EN CONSTRUCCIÓN

#### 3.6.1 Componente: ListadoIps
**Archivos** (a crear):
- `src/app/features/listadoIps/listado-ips.ts`
- `src/app/features/listadoIps/listado-ips.html`
- `src/app/features/listadoIps/listado-ips.css`
- `src/app/features/listadoIps/listado-ips.service.ts`

**Funcionalidades**:
- Tabla Bootstrap con listado paginado
- Columnas: NIT, Razón Social, Ciudad, Estado, Acciones
- Filtros: búsqueda por NIT/nombre, filtro por estado
- Acciones:
  - Ver detalle completo
  - Editar
  - Activar/Suspender
  - Eliminar

**Endpoints**:
- `GET /ips?page=1&limit=10&search=...&estado=...`
- `PUT /ips/{id}`
- `DELETE /ips/{id}`

**Ruta**: `/admin-ips/listado-ips`

**Estado**: 🚧 Pendiente

---

### 3.7 Módulo Gestor Hoja de Vida - ACTUALIZAR ⚠️

#### 3.7.1 Componente: HojaVida (EXISTENTE, REQUIERE ACTUALIZACIÓN)
**Archivos**:
- `src/app/features/hojaVida/hoja-vida.ts` → **ACTUALIZAR**
- `src/app/features/hojaVida/hoja-vida.html` → **ACTUALIZAR**
- `src/app/features/hojaVida/hoja-vida.css`
- `src/app/features/hojaVida/hoja-vida.service.ts` → **ACTUALIZAR**

**Funcionalidades Actuales**:
- Consulta de hojas de vida de aspirantes
- Visualización de información académica
- Visualización de experiencia laboral
- Visualización de documentos adjuntos

**⭐ NUEVAS Funcionalidades (Actualización)**:
- **Nueva sección/tab**: "Evaluación Psicológica"
  - Mostrar estado: "Cargado" o "Pendiente"
  - Si existe evaluación:
    - Fecha de carga
    - Tipo de evaluación
    - Botón "Ver PDF" (abre en nueva pestaña)
    - Botón "Descargar PDF"
    - Observaciones del evaluador
  - Si no existe:
    - Mensaje: "No hay evaluación psicológica cargada"
    - Link a módulo de Psicología Gestión (si tiene permisos)

**Cambios en Servicio**:
```typescript
// Método nuevo en hoja-vida.service.ts
obtenerEvaluacionPsicologica(aspiranteId: string): Observable<EvaluacionPsicologia | null> {
  return this.http.get<EvaluacionPsicologia | null>(
    `${this.apiUrl}/hojas-vida/${aspiranteId}/psicologia`
  );
}
```

**Endpoint nuevo**:
- `GET /hojas-vida/{aspirante_id}/psicologia`

**Ruta**: `/gestor-hoja-vida` (o similar)

**Estado**: 🔄 Requiere actualización

---

### 3.8 Módulo Psicología Gestión - NUEVO ⭐

#### 3.8.1 Archivos
- `src/app/features/psicologiaGestion/psicologia-gestion.ts`
- `src/app/features/psicologiaGestion/psicologia-gestion.html`
- `src/app/features/psicologiaGestion/psicologia-gestion.css`
- `src/app/features/psicologiaGestion/psicologia-gestion.service.ts`
- `src/app/features/psicologiaGestion/psicologia-gestion.spec.ts`

#### 3.8.2 Routing
**Archivo**: `src/app/app.routes.ts`

```typescript
// Agregar nueva ruta
{
  path: 'admin-ips/psicologia-gestion',
  component: PsicologiaGestion,
  canActivate: [AuthGuard]
}
```

#### 3.8.3 Componente Principal
**Archivo**: `src/app/features/psicologiaGestion/psicologia-gestion.ts`

**Funcionalidades**:
1. **Formulario de carga de PDF**
   - Reactive Form con validaciones:
     - Selección de aspirante (dropdown/autocomplete)
     - Upload de archivo (solo PDF, máx 5MB)
     - Tipo de evaluación (opcional)
     - Observaciones (textarea)

2. **Listado de aspirantes con PDFs**
   - Tabla Bootstrap con:
     - Columnas: Documento, Nombre, Fecha carga, Archivo, Acciones
     - Búsqueda/filtrado por nombre o documento
     - Paginación (10, 25, 50 registros)
   - Acciones por registro:
     - Ver PDF (nueva pestaña o modal)
     - Descargar PDF
     - Eliminar (con confirmación SweetAlert2)
     - Editar observaciones

3. **Sección de Reportes**
   - Filtros:
     - Rango de fechas
     - Estado del documento
   - Exportar listado a Excel/CSV
   - Estadísticas: Total documentos, Documentos por mes, etc.

**Estados de UI**:
- Loading durante carga de archivo
- Error handling con SweetAlert2
- Validación de formato y tamaño de archivo antes de enviar

#### 3.1.3 Servicio
**Archivo**: `src/app/features/psicologiaGestion/psicologia-gestion.service.ts`

**Métodos**:
```typescript
interface PsicologiaGestionService {
  // Listar todos los registros (con paginación)
  listarEvaluaciones(page: number, limit: number, filtros?: any): Observable<ListadoResponse>;

  // Obtener aspirantes sin evaluación cargada
  obtenerAspirantesSinEvaluacion(): Observable<Aspirante[]>;

  // Subir PDF
  cargarPDF(formData: FormData): Observable<UploadResponse>;

  // Descargar PDF
  descargarPDF(evaluacionId: string): Observable<Blob>;

  // Eliminar registro
  eliminarEvaluacion(evaluacionId: string): Observable<void>;

  // Actualizar observaciones
  actualizarObservaciones(evaluacionId: string, observaciones: string): Observable<void>;

  // Generar reporte
  generarReporte(filtros: FiltrosReporte): Observable<Blob>;
}
```

**Endpoints (base: `https://redcemed.com/api/`)**:
- `GET /psicologia/evaluaciones?page=1&limit=10` → Listado paginado
- `GET /psicologia/aspirantes-disponibles` → Aspirantes sin eval
- `POST /psicologia/evaluaciones` → Subir PDF (multipart/form-data)
- `GET /psicologia/evaluaciones/{id}/pdf` → Descargar archivo
- `DELETE /psicologia/evaluaciones/{id}` → Eliminar
- `PATCH /psicologia/evaluaciones/{id}` → Actualizar observaciones
- `GET /psicologia/reportes/export?formato=excel&desde=...&hasta=...`

### 3.2 Actualización: Módulo Gestor Hoja de Vida

#### 3.2.1 Componente
**Archivo**: `src/app/features/hojaVida/hoja-vida.ts`

**Cambios**:
- Agregar nueva sección/tab "Evaluación Psicológica"
- Mostrar:
  - Estado: "Cargado" o "Pendiente"
  - Fecha de carga (si existe)
  - Botón "Ver PDF" (abre en nueva pestaña)
  - Botón "Descargar PDF"

#### 3.2.2 Servicio
**Archivo**: `src/app/features/hojaVida/hoja-vida.service.ts`

**Método nuevo**:
```typescript
obtenerEvaluacionPsicologica(aspiranteId: string): Observable<EvaluacionPsicologia | null>
```

**Endpoint**:
- `GET /hojas-vida/{aspirante_id}/psicologia` → Retorna info del PDF si existe

---

### 3.9 Componente Compartido: Aside (Menú Lateral) - ACTUALIZAR ⚠️

#### 3.9.1 Actualización del Menú
**Archivo**: `src/app/shared/aside/aside.ts` (o `.html`)

**Cambios requeridos**:
Agregar nueva opción en la sección **Admin IPS**:

```typescript
// Estructura del menú Admin IPS
adminIpsMenu = [
  {
    icon: '🏥',
    label: 'Registro IPS',
    route: '/admin-ips/registro-ips',
    estado: 'construccion'
  },
  {
    icon: '📋',
    label: 'Listado IPS',
    route: '/admin-ips/listado-ips',
    estado: 'construccion'
  },
  {
    icon: '🧠',                          // NUEVO
    label: 'Psicología Gestión',        // NUEVO
    route: '/admin-ips/psicologia-gestion',  // NUEVO
    estado: 'activo'                     // NUEVO
  }
];
```

---

## 4. FLUJO DE DATOS Y CASOS DE USO

### 4.1 Caso de Uso: Login de Usuario
```
[Frontend] Usuario ingresa credenciales
    ↓
[Frontend - Validación] Reactive Form valida campos requeridos
    ↓
[Frontend] POST /auth/login { email, password }
    ↓
[API Backend] Valida credenciales y genera JWT
    ↓
[API Backend] Retorna { token, usuario: { id, nombre, rol } }
    ↓
[Frontend] Guarda token en localStorage (key: 'token')
    ↓
[Frontend] Navega a /home
```

### 4.2 Caso de Uso: Registro de Usuario
```
[Frontend] Admin llena formulario de registro
    ↓
[Frontend - Validación] Valida email único, contraseña fuerte
    ↓
[Frontend] POST /usuarios { nombre, apellido, email, password, rol }
    ↓
[API Backend] Valida datos, hash de password, inserta en MongoDB
    ↓
[API Backend] Retorna { success: true, usuario_id }
    ↓
[Frontend] SweetAlert2 éxito + limpia formulario
```

### 4.3 Caso de Uso: Registro de IPS
```
[Frontend] Usuario llena formulario multi-sección
    ↓
[Frontend - Validación] Valida NIT único, campos requeridos
    ↓
[Frontend] POST /ips { ...datos_ips }
    ↓
[API Backend] Valida NIT único, inserta en MongoDB
    ↓
[API Backend] Retorna { success: true, ips_id }
    ↓
[Frontend] SweetAlert2 éxito + opción de ver listado
```

### 4.4 Caso de Uso: Carga de PDF Psicología (NUEVO ⭐)
```
[Frontend] Usuario selecciona aspirante y archivo PDF
    ↓
[Frontend - Validación]
    - Extensión .pdf
    - Tamaño máximo 5MB
    - Aspirante seleccionado
    ↓
[Frontend] Crea FormData con:
    - aspirante_id
    - documento
    - archivo (File object)
    - tipo_evaluacion (opcional)
    - observaciones (opcional)
    ↓
[Frontend] POST /psicologia/evaluaciones (multipart/form-data)
    ↓
[API Backend]
    - Valida PDF (MIME type, magic bytes)
    - Guarda archivo en storage (filesystem o S3)
    - Genera URL accesible
    ↓
[API Backend] Inserta en MongoDB:
    - Colección: psicologia_evaluaciones
    - Datos: aspirante_id, pdf_url, metadata, audit
    ↓
[API Backend] Actualiza colección hojas_vida:
    - Campo: psicologia.tiene_evaluacion = true
    - Campo: psicologia.evaluacion_id = nuevo_id
    ↓
[API Backend] Retorna:
    {
      success: true,
      data: { evaluacion_id, pdf_url },
      message: "Evaluación cargada exitosamente"
    }
    ↓
[Frontend]
    - SweetAlert2 muestra éxito
    - Refresca listado de evaluaciones
    - Limpia formulario
```

### 4.5 Caso de Uso: Consulta desde Hoja de Vida (NUEVO ⭐)
```
[Frontend] Usuario abre Hoja de Vida de aspirante
    ↓
[Frontend] Carga datos principales del aspirante
    ↓
[Frontend] GET /hojas-vida/{aspirante_id}/psicologia
    ↓
[API Backend]
    - Busca en psicologia_evaluaciones
    - Filtra por: aspirante_id y estado='activo'
    ↓
[API Backend] Retorna:
    - Si existe: { evaluacion_id, pdf_url, fecha_carga, ... }
    - Si no existe: null
    ↓
[Frontend] Renderiza sección "Evaluación Psicológica":
    - Si existe evaluación:
      ✅ Badge "Cargado"
      📅 Fecha de carga
      📄 Botón "Ver PDF" → window.open(pdf_url, '_blank')
      ⬇️ Botón "Descargar PDF" → descarga archivo
      📝 Observaciones del evaluador
    - Si no existe:
      ⚠️ Badge "Pendiente"
      💬 Mensaje: "No hay evaluación cargada"
      🔗 Link a Psicología Gestión (si tiene permisos)
```

### 4.6 Caso de Uso: Listado de Evaluaciones con Paginación
```
[Frontend] Usuario navega a Psicología Gestión
    ↓
[Frontend] GET /psicologia/evaluaciones?page=1&limit=10
    ↓
[API Backend]
    - Query MongoDB con skip/limit
    - Cuenta total de registros
    ↓
[API Backend] Retorna:
    {
      data: [...evaluaciones],
      pagination: {
        total: 150,
        page: 1,
        limit: 10,
        totalPages: 15
      }
    }
    ↓
[Frontend]
    - Renderiza tabla Bootstrap
    - Muestra controles de paginación
    - Habilita filtros y búsqueda
```

### 4.7 Caso de Uso: Exportar Reporte
```
[Frontend] Usuario selecciona filtros (rango de fechas)
    ↓
[Frontend] Click en "Exportar a Excel"
    ↓
[Frontend] GET /psicologia/reportes/export?formato=excel&desde=2026-01-01&hasta=2026-04-14
    ↓
[API Backend]
    - Query MongoDB con filtros
    - Genera archivo Excel/CSV
    - Retorna Blob
    ↓
[Frontend]
    - Descarga archivo automáticamente
    - Nombre: evaluaciones_psicologia_2026-04-14.xlsx
```

---

## 5. VALIDACIONES Y SEGURIDAD

### 5.1 Validaciones Frontend (Angular)

#### 5.1.1 Formularios (Reactive Forms)
**Login**:
- Email: requerido, formato válido
- Contraseña: requerido, mínimo 6 caracteres

**Registro Usuario**:
- Nombre y Apellido: requerido, solo letras
- Email: requerido, único, formato válido
- Contraseña: requerido, mínimo 8 caracteres, mayúscula, número
- Rol: requerido, debe ser valor del enum

**Registro IPS**:
- NIT: requerido, único, formato numérico
- Razón Social: requerido
- Email: formato válido
- Teléfono: formato válido (10 dígitos)

**Psicología Gestión**:
- Aspirante: requerido (selección de lista)
- Archivo PDF: requerido, extensión `.pdf`, tamaño máximo 5MB
- Validación en tiempo real antes de enviar

#### 5.1.2 Upload de Archivos
```typescript
// Validación de archivo PDF
validarArchivoPDF(file: File): { valid: boolean, error?: string } {
  // Extensión
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'Solo se permiten archivos PDF' };
  }

  // Tamaño (5MB = 5 * 1024 * 1024 bytes)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'El archivo no debe superar 5MB' };
  }

  // Tipo MIME
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Tipo de archivo inválido' };
  }

  return { valid: true };
}
```

#### 5.1.3 Sanitización
- Nombres de archivo: remover caracteres especiales
- Inputs de texto: evitar inyección de código
- URLs: validar origen antes de abrir en nueva pestaña

### 5.2 Seguridad Frontend

#### 5.2.1 Autenticación
- JWT almacenado en `localStorage` (key: `token`)
- Interceptor HTTP para agregar header `Authorization: Bearer {token}` en cada request
- Manejo de expiración de token (redirect a login)

#### 5.2.2 Autorización (Guards)
```typescript
// auth.guard.ts
canActivate(route: ActivatedRouteSnapshot): boolean {
  const token = localStorage.getItem('token');
  if (!token) {
    this.router.navigate(['/login']);
    return false;
  }

  // Validar rol según ruta
  const requiredRole = route.data['role'];
  const userRole = this.getUserRoleFromToken(token);

  if (requiredRole && userRole !== requiredRole) {
    this.router.navigate(['/home']);
    return false;
  }

  return true;
}
```

**Rutas protegidas**:
- `/home` y subsiguientes: requieren token válido
- `/admin/*`: requieren rol `admin`
- `/admin-ips/*`: requieren rol `admin` o `admin_ips`

#### 5.2.3 Estados de UI
- Deshabilitar botones durante requests (evitar doble click)
- Loading spinners en operaciones async
- Timeout en requests HTTP (30 segundos)

### 5.3 Seguridad Backend (API)

#### 5.3.1 Autenticación
- JWT firmado con secret key
- Expiración de token: 8 horas
- Refresh token opcional (implementación futura)

#### 5.3.2 Autorización
- Middleware de verificación de token en todas las rutas protegidas
- Validación de roles por endpoint:
  - `/usuarios`: solo `admin`
  - `/ips`: `admin` y `admin_ips`
  - `/psicologia`: `admin` y `admin_ips`

#### 5.3.3 Validación de Archivos
- Content-Type: `application/pdf`
- Magic bytes (primeros bytes): `%PDF-`
- Límite de tamaño: 5MB
- Escaneo antivirus (producción, opcional)

#### 5.3.4 Otras medidas
- Rate limiting: máximo 100 requests/minuto por IP
- CORS: solo dominio `redcemed.com`
- Sanitización de inputs (evitar NoSQL injection)
- HTTPS obligatorio en producción

### 5.4 Base de Datos (MongoDB Atlas)

#### 5.4.1 Índices (para performance)
**Colección `usuarios`**:
- `{ email: 1 }` (unique)

**Colección `ips`**:
- `{ nit: 1 }` (unique)
- `{ estado: 1 }`

**Colección `aspirantes`**:
- `{ documento: 1 }` (unique)

**Colección `hojas_vida`**:
- `{ aspirante_id: 1 }` (unique)
- `{ documento: 1 }`

**Colección `psicologia_evaluaciones`**:
- `{ aspirante_id: 1, estado: 1 }`
- `{ documento: 1 }`
- `{ fecha_carga: -1 }` (para ordenamiento)

#### 5.4.2 Seguridad
- Usuario de BD con permisos mínimos (solo read/write en colecciones necesarias)
- Conexión encriptada (TLS/SSL)
- Backup automático diario
- IP Whitelist en MongoDB Atlas (solo servidor de aplicación)

---

## 6. ESTRATEGIA DE PRUEBAS

### 6.1 Pruebas Frontend (Angular)

#### 6.1.1 Unitarias (Jasmine/Karma)
**Componente Login** (`login.spec.ts`):
```typescript
describe('Login', () => {
  it('debe crear el formulario con controles válidos', () => {
    expect(component.loginForm.contains('email')).toBeTruthy();
    expect(component.loginForm.contains('password')).toBeTruthy();
  });

  it('debe marcar email como inválido si no tiene formato correcto', () => {
    const email = component.loginForm.get('email');
    email?.setValue('invalido');
    expect(email?.valid).toBeFalsy();
  });

  it('debe llamar al servicio de login al enviar formulario válido', () => {
    spyOn(component.authService, 'login').and.returnValue(of({ token: 'abc' }));
    component.loginForm.patchValue({ email: 'test@test.com', password: '123456' });
    component.onSubmit();
    expect(component.authService.login).toHaveBeenCalled();
  });
});
```

**Servicio AuthService**:
```typescript
describe('AuthService', () => {
  it('debe guardar token en localStorage después de login exitoso', () => {
    const mockResponse = { token: 'abc123', usuario: { id: '1', nombre: 'Test' } };
    spyOn(localStorage, 'setItem');

    service.login({ email: 'test@test.com', password: '123' }).subscribe(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'abc123');
    });
  });

  it('debe lanzar error si credenciales son inválidas', () => {
    // Mock HttpClient error
    const errorResponse = { status: 401, error: { message: 'Credenciales inválidas' } };

    service.login({ email: 'bad@test.com', password: 'wrong' }).subscribe(
      () => fail('debería haber fallado'),
      (error) => expect(error.status).toBe(401)
    );
  });
});
```

**Componente Psicología Gestión**:
```typescript
describe('PsicologiaGestion', () => {
  it('debe validar tamaño de archivo antes de enviar', () => {
    const largeFile = new File([''], 'test.pdf', { type: 'application/pdf', size: 6 * 1024 * 1024 });
    const result = component.validarArchivoPDF(largeFile);
    expect(result.valid).toBeFalsy();
    expect(result.error).toContain('5MB');
  });

  it('debe aceptar solo archivos PDF', () => {
    const txtFile = new File([''], 'test.txt', { type: 'text/plain' });
    const result = component.validarArchivoPDF(txtFile);
    expect(result.valid).toBeFalsy();
  });

  it('debe deshabilitar botón durante carga', () => {
    component.uploadLoading = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeTruthy();
  });
});
```

#### 6.1.2 Pruebas de Integración
**Guards**:
```typescript
describe('AuthGuard', () => {
  it('debe permitir acceso si hay token válido', () => {
    localStorage.setItem('token', 'valid-token');
    const result = guard.canActivate(mockRoute);
    expect(result).toBeTruthy();
  });

  it('debe redirigir a login si no hay token', () => {
    localStorage.removeItem('token');
    spyOn(router, 'navigate');
    guard.canActivate(mockRoute);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
```

#### 6.1.3 E2E (Opcional - Cypress/Playwright)
**Flujo completo de login**:
```typescript
describe('Login Flow', () => {
  it('debe permitir login con credenciales válidas', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@test.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/home');
  });
});
```

**Flujo de carga de PDF**:
```typescript
describe('Psicología - Carga de PDF', () => {
  beforeEach(() => {
    // Login previo
    cy.login('admin@test.com', 'password');
    cy.visit('/admin-ips/psicologia-gestion');
  });

  it('debe permitir subir PDF válido', () => {
    cy.get('select[name="aspirante"]').select('12345678');
    cy.get('input[type="file"]').attachFile('evaluacion.pdf');
    cy.get('button[type="submit"]').click();
    cy.get('.swal2-success').should('be.visible');
  });

  it('debe rechazar archivo que no es PDF', () => {
    cy.get('input[type="file"]').attachFile('documento.txt');
    cy.get('.error-message').should('contain', 'Solo se permiten archivos PDF');
  });
});
```

### 6.2 Comandos de Testing

```bash
# Ejecutar pruebas unitarias
npm test

# Ejecutar pruebas con coverage
npm run test:coverage

# Ejecutar pruebas E2E (si se implementa Cypress)
npm run e2e

# Ejecutar pruebas en modo watch (desarrollo)
npm run test:watch
```

### 6.3 Checklist de Pruebas

#### Antes de cada commit
- [ ] Todas las pruebas unitarias pasan
- [ ] Coverage mínimo: 70%
- [ ] No hay errores de linter

#### Antes de PR/merge
- [ ] Pruebas de integración pasan
- [ ] Build de producción exitoso: `npm run build`
- [ ] Pruebas manuales en navegadores (Chrome, Firefox, Edge)

#### Antes de deploy
- [ ] Pruebas E2E pasan (si implementadas)
- [ ] Pruebas de regresión en módulos existentes
- [ ] Verificación de seguridad (permisos, autenticación)

---

## 7. ESTIMACIÓN DE ESFUERZO Y PRIORIDADES

### 7.1 Módulos Existentes (Verificación y Refactoring)

| Módulo | Estado | Esfuerzo | Prioridad |
|--------|--------|----------|-----------|
| Login | ✅ Implementado | 0h (verificar) | Alta |
| Home | ✅ Implementado | 0h (verificar) | Alta |
| Registro Usuarios | ✅ Implementado | 0h (verificar) | Alta |
| AuthGuard | ✅ Implementado | 0h (verificar) | Alta |
| AuthService | ✅ Implementado | 0h (verificar) | Alta |

### 7.2 Módulos en Construcción

| Módulo | Estado | Complejidad | Esfuerzo Estimado | Prioridad |
|--------|--------|-------------|-------------------|-----------|
| **Listado Usuarios** | 🚧 Pendiente | Media | 8-12 horas | Media |
| - Componente + tabla | | | 4h | |
| - Servicio + endpoints | | | 2h | |
| - Filtros y paginación | | | 2h | |
| - Acciones (editar/eliminar) | | | 3h | |
| - Pruebas unitarias | | | 1h | |
| **Registro IPS** | 🚧 Pendiente | Media-Alta | 12-16 horas | Alta |
| - Formulario multi-sección | | | 6h | |
| - Validaciones complejas | | | 3h | |
| - Servicio + endpoints | | | 2h | |
| - Integración con API | | | 3h | |
| - Pruebas | | | 2h | |
| **Listado IPS** | 🚧 Pendiente | Media | 8-12 horas | Media |
| - Componente + tabla | | | 4h | |
| - Servicio + endpoints | | | 2h | |
| - Filtros y paginación | | | 2h | |
| - Acciones (editar/activar) | | | 3h | |
| - Pruebas | | | 1h | |

### 7.3 Módulos Nuevos (Críticos)

| Módulo | Estado | Complejidad | Esfuerzo Estimado | Prioridad |
|--------|--------|-------------|-------------------|-----------|
| **Psicología Gestión** | ⭐ Nuevo | Alta | 20-24 horas | **CRÍTICA** |
| - Componente principal | | | 4h | |
| - Formulario carga PDF | | | 4h | |
| - Validación archivos | | | 2h | |
| - Listado + paginación | | | 4h | |
| - Reportes y exportación | | | 3h | |
| - Servicio completo | | | 3h | |
| - Pruebas unitarias | | | 2h | |
| - Integración E2E | | | 2h | |
| **Actualización Hoja Vida** | ⚠️ Modificar | Baja | 4-6 horas | **CRÍTICA** |
| - Nueva sección UI | | | 2h | |
| - Integración con API | | | 1h | |
| - Botones ver/descargar PDF | | | 1h | |
| - Pruebas | | | 1h | |
| **Actualización Menú** | ⚠️ Modificar | Baja | 1-2 horas | **CRÍTICA** |
| - Agregar opción en aside | | | 1h | |
| - Routing | | | 0.5h | |

### 7.4 Backend (API Endpoints)

| Endpoint | Estado | Complejidad | Observaciones |
|----------|--------|-------------|---------------|
| `/auth/*` | ✅ Existente | - | Verificar funcionamiento |
| `/usuarios/*` | ✅ Existente | - | Verificar CRUD completo |
| `/ips/*` | 🚧 Parcial | Media | Completar CRUD |
| `/hojas-vida/*` | ✅ Existente | - | Agregar endpoint `/psicologia` |
| `/psicologia/*` | ⭐ Nuevo | Alta | CRUD + upload archivos |

**Esfuerzo Backend (si no existe)**: 30-40 horas
**Esfuerzo Backend (si existe y solo ajustes)**: 8-12 horas

### 7.5 Infraestructura y Storage

| Componente | Complejidad | Esfuerzo | Prioridad |
|------------|-------------|----------|-----------|
| Storage de archivos PDF | Alta | 6-8 horas | Alta |
| - Filesystem local (desarrollo) | Media | 2h | |
| - S3/Cloud Storage (producción) | Alta | 4h | |
| - Presigned URLs | Media | 2h | |
| Índices MongoDB | Baja | 1-2 horas | Media |
| Backup y políticas | Media | 4-6 horas | Baja |

### 7.6 Testing y QA

| Actividad | Esfuerzo | Prioridad |
|-----------|----------|-----------|
| Pruebas unitarias (todos los módulos) | 12-16 horas | Alta |
| Pruebas E2E (flujos críticos) | 8-12 horas | Media |
| Testing manual | 4-6 horas | Alta |
| Code review | 4 horas | Media |

### 7.7 Resumen Total

| Fase | Esfuerzo Total | Tiempo Calendario |
|------|---------------|-------------------|
| **Fase 1: Módulo Psicología + Actualización Hoja Vida** | 24-30 horas | 3-4 días |
| **Fase 2: Módulos IPS (Registro + Listado)** | 20-28 horas | 3-4 días |
| **Fase 3: Listado Usuarios** | 8-12 horas | 1-2 días |
| **Fase 4: Backend API (si no existe)** | 30-40 horas | 4-5 días |
| **Fase 5: Testing y QA** | 24-34 horas | 3-4 días |
| **TOTAL (Frontend solo)** | **52-70 horas** | **7-10 días** |
| **TOTAL (Frontend + Backend)** | **82-110 horas** | **11-15 días** |

### 7.8 Roadmap Sugerido

#### Sprint 1 (Semana 1) - CRÍTICO
- ✅ Módulo Psicología Gestión completo
- ✅ Actualización Hoja de Vida
- ✅ Actualización menú lateral
- ✅ Testing básico

#### Sprint 2 (Semana 2) - ALTA PRIORIDAD
- 🚧 Registro IPS
- 🚧 Listado IPS
- 🚧 Pruebas de integración

#### Sprint 3 (Semana 3) - MEDIA PRIORIDAD
- 🚧 Listado Usuarios
- 🚧 Mejoras de UX
- 🚧 Testing E2E

#### Sprint 4 (Semana 4) - PULIDO
- 🚧 Reportes avanzados
- 🚧 Optimizaciones de performance
- 🚧 Documentación de usuario

---

## 8. DEPENDENCIAS Y TECNOLOGÍAS

### 8.1 Frontend (Angular 17)

#### 8.1.1 Dependencias Actuales (package.json)
```json
{
  "dependencies": {
    "@angular/animations": "^17.x",
    "@angular/common": "^17.x",
    "@angular/compiler": "^17.x",
    "@angular/core": "^17.x",
    "@angular/forms": "^17.x",
    "@angular/platform-browser": "^17.x",
    "@angular/router": "^17.x",
    "bootstrap": "^5.x",          // ✅ Ya instalado
    "rxjs": "^7.x",
    "tslib": "^2.x",
    "zone.js": "^0.14.x"
  }
}
```

#### 8.1.2 Dependencias a Agregar/Verificar
```json
{
  "dependencies": {
    "sweetalert2": "^11.x",       // Notificaciones (verificar si ya está)
    "ngx-pagination": "^6.x",     // Paginación (opcional, si no está con Bootstrap)
    "file-saver": "^2.x",         // Para descargar archivos
    "xlsx": "^0.18.x"             // Para generar reportes Excel (opcional)
  },
  "devDependencies": {
    "@angular/cli": "^17.x",
    "@angular/compiler-cli": "^17.x",
    "jasmine-core": "^5.x",       // Testing
    "karma": "^6.x",              // Test runner
    "karma-jasmine": "^5.x",
    "typescript": "^5.x"
  }
}
```

#### 8.1.3 Instalación
```bash
# Verificar dependencias actuales
npm list

# Instalar SweetAlert2 (si no está)
npm install sweetalert2

# Para exportar reportes Excel
npm install file-saver xlsx

# Para mejorar upload de archivos (opcional)
npm install ng2-file-upload
```

### 8.2 Backend API

#### 8.2.1 Tecnologías Requeridas
- **Framework**: Node.js + Express, FastAPI, o similar (según implementación actual)
- **Base de datos**: MongoDB Atlas
- **Storage**: Filesystem local o AWS S3 / Google Cloud Storage
- **Autenticación**: JWT (jsonwebtoken)

#### 8.2.2 Endpoints Requeridos
Ver sección **2.2 API Endpoints** para lista completa

### 8.3 Infraestructura

| Componente | Tecnología | Observaciones |
|------------|------------|---------------|
| Hosting Frontend | Netlify, Vercel, o servidor propio | Build estático de Angular |
| API Backend | VPS, AWS EC2, GCP Compute | Puerto 443 (HTTPS) |
| Base de Datos | MongoDB Atlas | Cluster M0 (gratis) o superior |
| Storage Archivos | Local filesystem o AWS S3 | Recomendado S3 para producción |
| CDN (opcional) | Cloudflare, AWS CloudFront | Para servir assets estáticos |

---

## 9. RIESGOS Y MITIGACIONES

### 9.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Archivos PDF muy grandes** | Media | Alto | - Límite estricto de 5MB<br>- Validación en frontend y backend<br>- Compresión automática (opcional) |
| **Almacenamiento ilimitado** | Alta | Alto | - Política de retención (ej: 2 años)<br>- Limpieza automática de archivos "eliminados"<br>- Alertas cuando storage > 80% |
| **Archivos maliciosos** | Baja | Crítico | - Validación estricta (magic bytes)<br>- Escaneo antivirus (producción)<br>- Sandbox para abrir PDFs |
| **Performance con muchos registros** | Media | Medio | - Paginación obligatoria<br>- Índices en MongoDB<br>- Lazy loading de imágenes/PDFs |
| **API caída o lenta** | Media | Alto | - Timeout en requests (30s)<br>- Retry automático (1 vez)<br>- Mensajes de error claros |
| **Token JWT expirado** | Media | Medio | - Refresh token automático<br>- Logout automático y redirect a login |
| **CORS en producción** | Baja | Alto | - Configurar CORS correctamente en backend<br>- Whitelist de dominios |
| **MongoDB Atlas límite gratis** | Media | Medio | - Monitorear uso mensual<br>- Plan de upgrade si es necesario |

### 9.2 Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Falta de backend funcional** | Media | Crítico | - Verificar endpoints antes de empezar frontend<br>- Crear mocks si es necesario<br>- Coordinar con equipo backend |
| **Cambios de requerimientos** | Alta | Medio | - Documentar decisiones en CLAUDE.md<br>- Validar prototipos con usuario final |
| **Falta de datos de prueba** | Media | Medio | - Crear seeders/fixtures<br>- Usar datos sintéticos |
| **Acceso no autorizado** | Baja | Crítico | - Implementar AuthGuard correctamente<br>- Auditoría de permisos |

### 9.3 Riesgos de Integración

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **API devuelve formato inesperado** | Media | Alto | - Definir contratos (TypeScript interfaces)<br>- Validación de respuestas<br>- Manejo de errores robusto |
| **Diferencias entre dev y prod** | Media | Alto | - Environment variables (`.env`)<br>- CI/CD para deploy consistente |
| **Módulo HojaVida rompe con cambios** | Baja | Alto | - Pruebas de regresión<br>- Feature flags para activar/desactivar |

### 9.4 Plan de Contingencia

#### Si el backend no está listo:
1. **Fase 1**: Desarrollar frontend con datos mockeados
2. **Fase 2**: Crear servicios con flag `USE_MOCK_DATA`
3. **Fase 3**: Integrar cuando backend esté disponible

```typescript
// Ejemplo en servicio
export class PsicologiaService {
  private USE_MOCK = environment.useMockData;

  listarEvaluaciones() {
    if (this.USE_MOCK) {
      return of(MOCK_EVALUACIONES);
    }
    return this.http.get<Evaluacion[]>(`${this.apiUrl}/psicologia/evaluaciones`);
  }
}
```

#### Si MongoDB Atlas alcanza límite:
1. Exportar datos a JSON
2. Migrar a cluster pagado (M10+)
3. O migrar a MongoDB auto-hospedado

#### Si storage de archivos crece mucho:
1. Implementar compresión de PDFs
2. Migrar a S3 (costo por GB muy bajo)
3. Implementar lifecycle policies (archivar/eliminar antiguos)

---

## 10. ENTREGABLES POR FASE

### Fase 1: Módulo Psicología Gestión (CRÍTICO - Sprint 1)

#### Frontend
- [x] **Estructura de archivos**
  - [ ] `src/app/features/psicologiaGestion/psicologia-gestion.ts`
  - [ ] `src/app/features/psicologiaGestion/psicologia-gestion.html`
  - [ ] `src/app/features/psicologiaGestion/psicologia-gestion.css`
  - [ ] `src/app/features/psicologiaGestion/psicologia-gestion.service.ts`
  - [ ] `src/app/features/psicologiaGestion/psicologia-gestion.spec.ts`

- [x] **Componente completo**
  - [ ] Reactive Form para carga de PDF
  - [ ] Validaciones de archivo (tipo, tamaño)
  - [ ] Listado con paginación
  - [ ] Filtros de búsqueda
  - [ ] Acciones: ver, descargar, eliminar
  - [ ] Sección de reportes

- [x] **Servicio Angular**
  - [ ] Método `listarEvaluaciones()`
  - [ ] Método `cargarPDF()`
  - [ ] Método `descargarPDF()`
  - [ ] Método `eliminarEvaluacion()`
  - [ ] Método `generarReporte()`
  - [ ] Manejo de errores con interceptor

- [x] **Routing y navegación**
  - [ ] Ruta: `/admin-ips/psicologia-gestion`
  - [ ] AuthGuard configurado
  - [ ] Actualización de menú lateral (aside)

- [x] **Pruebas**
  - [ ] Pruebas unitarias (Jasmine/Karma)
  - [ ] Coverage mínimo 70%

#### Backend (si no existe)
- [ ] Endpoints `/psicologia/*` (ver sección 2.2)
- [ ] Colección MongoDB `psicologia_evaluaciones`
- [ ] Sistema de storage de archivos
- [ ] Validaciones de seguridad

---

### Fase 2: Actualización Hoja de Vida (CRÍTICO - Sprint 1)

#### Frontend
- [x] **Modificaciones en componente**
  - [ ] Actualizar `hoja-vida.ts`
  - [ ] Actualizar `hoja-vida.html` (nueva sección)
  - [ ] Actualizar `hoja-vida.service.ts` (nuevo método)

- [x] **Nueva sección UI**
  - [ ] Tab/sección "Evaluación Psicológica"
  - [ ] Estados: Cargado / Pendiente
  - [ ] Botones: Ver PDF, Descargar PDF
  - [ ] Mostrar observaciones

- [x] **Integración con API**
  - [ ] Método `obtenerEvaluacionPsicologica(aspiranteId)`
  - [ ] Manejo de respuesta null (sin evaluación)

- [x] **Pruebas**
  - [ ] Pruebas de integración con mock data
  - [ ] Verificar que no rompe funcionalidad existente

#### Backend (si no existe)
- [ ] Endpoint `GET /hojas-vida/{aspirante_id}/psicologia`
- [ ] Actualizar colección `hojas_vida` (campo `psicologia`)

---

### Fase 3: Módulos IPS (Sprint 2)

#### Registro IPS
- [ ] Componente `RegistroIps` completo
- [ ] Formulario multi-sección
- [ ] Servicio con integración a API
- [ ] Validaciones (NIT único, email)
- [ ] Pruebas unitarias

#### Listado IPS
- [ ] Componente `ListadoIps` completo
- [ ] Tabla con paginación
- [ ] Filtros y búsqueda
- [ ] Acciones: ver, editar, activar/suspender
- [ ] Pruebas unitarias

---

### Fase 4: Listado Usuarios (Sprint 3)

- [ ] Componente `ListadoUsuarios` completo
- [ ] Tabla con paginación
- [ ] Filtros por rol y estado
- [ ] Acciones: ver, editar, activar/desactivar
- [ ] Pruebas unitarias

---

### Fase 5: Testing y QA (Continuo)

- [ ] **Pruebas unitarias** (todos los módulos)
- [ ] **Pruebas de integración**
- [ ] **Pruebas E2E** (flujos críticos)
- [ ] **Testing manual** en navegadores
- [ ] **Code review** y refactoring

---

### Fase 6: Deploy y Documentación (Final)

- [ ] **Build de producción**
  - [ ] `npm run build` sin errores
  - [ ] Optimización de assets
  - [ ] Environment de producción configurado

- [ ] **Documentación**
  - [ ] README.md actualizado
  - [ ] Guía de usuario (PDF o wiki)
  - [ ] Documentación técnica (este documento)

- [ ] **Deploy**
  - [ ] Deploy a staging para QA
  - [ ] Validación con usuario final
  - [ ] Deploy a producción
  - [ ] Monitoreo post-deploy

---

## 11. NOTAS TÉCNICAS Y CONVENCIONES

### 11.1 Convenciones de Código (según CLAUDE.md)

#### Nomenclatura
- **Clases sin sufijo**: `Login` no `LoginComponent`
- **Archivos**: kebab-case (`psicologia-gestion.ts`)
- **Clases TypeScript**: PascalCase (`PsicologiaGestion`)
- **Variables y métodos**: camelCase (`listarEvaluaciones`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

#### Estructura de Componentes
```typescript
export class PsicologiaGestion implements OnInit {
  // 1. Propiedades del componente
  loading = false;
  evaluaciones: Evaluacion[] = [];

  // 2. Reactive Forms
  uploadForm: FormGroup;

  // 3. Constructor con inyección de dependencias
  constructor(
    private psicologiaService: PsicologiaService,
    private fb: FormBuilder
  ) {
    this.uploadForm = this.fb.group({
      aspirante: ['', Validators.required],
      archivo: [null, Validators.required]
    });
  }

  // 4. Lifecycle hooks
  ngOnInit(): void {
    this.cargarEvaluaciones();
  }

  // 5. Métodos públicos
  onSubmit(): void { }

  // 6. Métodos privados
  private cargarEvaluaciones(): void { }
}
```

#### Reactive Forms
- **Siempre usar** Reactive Forms (no Template-driven)
- Validaciones en el componente, no en template
- FormBuilder para crear grupos

#### Notificaciones
- **SweetAlert2** para todas las notificaciones
- Éxito: `Swal.fire({ icon: 'success', title: 'Éxito', text: '...' })`
- Error: `Swal.fire({ icon: 'error', title: 'Error', text: '...' })`
- Confirmación: `Swal.fire({ icon: 'warning', showCancelButton: true })`

### 11.2 Manejo de Errores HTTP

#### En Servicios
```typescript
cargarPDF(formData: FormData): Observable<UploadResponse> {
  return this.http.post<UploadResponse>(`${this.apiUrl}/psicologia/evaluaciones`, formData)
    .pipe(
      catchError(this.handleError)
    );
}

private handleError(error: HttpErrorResponse): Observable<never> {
  let errorMessage = 'Error desconocido';

  if (error.error instanceof ErrorEvent) {
    // Error del cliente
    errorMessage = `Error: ${error.error.message}`;
  } else {
    // Error del backend
    switch (error.status) {
      case 400:
        errorMessage = 'Datos inválidos';
        break;
      case 401:
        errorMessage = 'No autorizado';
        // Redirigir a login
        break;
      case 413:
        errorMessage = 'El archivo es demasiado grande';
        break;
      case 500:
        errorMessage = 'Error del servidor';
        break;
      default:
        errorMessage = `Error: ${error.message}`;
    }
  }

  return throwError(() => new Error(errorMessage));
}
```

### 11.3 Formato de Respuestas API

#### Éxito
```json
{
  "success": true,
  "data": {
    "evaluacion_id": "507f1f77bcf86cd799439011",
    "pdf_url": "https://storage.redcemed.com/psicologia/123456/evaluacion.pdf"
  },
  "message": "Evaluación cargada exitosamente"
}
```

#### Error
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Solo se permiten archivos PDF",
    "details": {}
  }
}
```

#### Lista Paginada
```json
{
  "success": true,
  "data": [
    { "id": "1", "nombre": "..." },
    { "id": "2", "nombre": "..." }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

### 11.4 Environment Variables

```typescript
// src/environments/environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',  // o URL de dev
  useMockData: false
};

// src/environments/environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://redcemed.com/api',
  useMockData: false
};
```

### 11.5 Git Workflow

#### Branches
- `main`: Producción (protegida)
- `develop`: Desarrollo
- `feature/nombre-feature`: Features nuevas
- `fix/nombre-fix`: Bugfixes

#### Commits
```bash
# Formato de mensajes
feat: agregar módulo Psicología Gestión
fix: corregir validación de archivos PDF
refactor: mejorar estructura de HojaVida
test: agregar pruebas unitarias a Login
docs: actualizar CLAUDE.md con convenciones
```

#### Antes de commit
```bash
npm run lint          # Verificar linting
npm test              # Ejecutar pruebas
npm run build         # Verificar build
```

---

## 12. CHECKLIST FINAL

### Antes de considerar completo

#### Funcionalidad
- [ ] Todos los componentes renderizan sin errores
- [ ] Formularios validan correctamente
- [ ] API endpoints responden correctamente
- [ ] Upload de archivos funciona
- [ ] Descarga de archivos funciona
- [ ] Paginación funciona
- [ ] Filtros y búsquedas funcionan

#### Calidad
- [ ] Code review completado
- [ ] Pruebas unitarias pasan (>70% coverage)
- [ ] Pruebas E2E pasan (si implementadas)
- [ ] No hay warnings de linter
- [ ] Build de producción exitoso

#### Seguridad
- [ ] AuthGuard protege rutas correctas
- [ ] Validaciones de archivo funcionan
- [ ] Token JWT se maneja correctamente
- [ ] No hay datos sensibles en código

#### UX
- [ ] Loading states en operaciones async
- [ ] Mensajes de error claros
- [ ] Confirmaciones en acciones destructivas
- [ ] Responsive en mobile/tablet/desktop

#### Documentación
- [ ] README.md actualizado
- [ ] CLAUDE.md actualizado
- [ ] Comentarios en código complejo
- [ ] Guía de usuario creada

---

**FIN DEL ANÁLISIS TÉCNICO**

Para dudas o actualizaciones, consultar este documento y CLAUDE.md del proyecto.
