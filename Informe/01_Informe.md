# 01_Informe - Resumen Ejecutivo para Áreas de Negocio
## Mejoras al Sistema de Gestión de Psicología e IPS

---

## 1. RESUMEN EJECUTIVO

### 1.1 ¿Qué vamos a mejorar?

Este proyecto mejorará significativamente la gestión de casos de los aspirantes que son atendidos por el equipo de Psicología y las IPS. Las mejoras se centran en tres áreas principales:

1. **Flexibilidad en la gestión de casos**: Los psicólogos y las IPS podrán liberar casos que ya no pueden atender, permitiendo que otros profesionales los tomen.

2. **Nuevo rol de Supervisor de Psicología**: Se creará un perfil especial con capacidades administrativas para supervisar el trabajo del equipo de psicología, reasignar casos y generar informes.

3. **Informes y análisis**: Se implementará un sistema de reportes visuales que permitirá ver el rendimiento del equipo, la carga de trabajo de cada psicólogo y el estado general de los casos.

### 1.2 Beneficios para la Organización

- **Mayor agilidad**: Reducción de tiempos de espera para aspirantes cuando un psicólogo no puede atender un caso.
- **Mejor distribución de carga**: El supervisor podrá balancear la carga de trabajo entre el equipo.
- **Visibilidad completa**: Informes visuales para tomar decisiones basadas en datos reales.
- **Trazabilidad**: Registro completo de quién ha trabajado cada caso y cuándo.
- **Control de calidad**: El supervisor puede monitorear y apoyar al equipo de manera más efectiva.

---

## 2. FUNCIONALIDADES NUEVAS EXPLICADAS

### 2.1 Liberación de Casos por Psicólogos

**¿Qué es?**
Los psicólogos podrán "devolver" un caso que tienen asignado, dejándolo disponible para que otro profesional lo tome.

**¿Por qué es importante?**
En ocasiones, un psicólogo puede tener mucha carga de trabajo, estar de vacaciones, o no poder continuar con un caso por diversas razones. Actualmente, estos casos quedan bloqueados. Con esta mejora, el caso se libera inmediatamente y puede ser atendido por otro psicólogo.

**¿Cómo funciona?**
1. El psicólogo entra a "Mis Casos Tomados"
2. Ve un botón de "Liberar" junto a cada caso
3. Al hacer clic, el sistema le pregunta si está seguro
4. Si confirma, el caso queda disponible automáticamente
5. El sistema guarda un registro de que ese psicólogo trabajó el caso

**Impacto en el proceso:**
- **Antes**: Un caso asignado quedaba bloqueado hasta que el psicólogo lo completara
- **Después**: Cualquier caso puede ser liberado en segundos y tomado por otro profesional

---

### 2.2 Nuevo Rol: Supervisor de Psicología

**¿Qué es?**
Se creará un nuevo tipo de usuario con permisos especiales para administrar el equipo de psicología.

**¿Qué puede hacer este usuario?**

1. **Ver todos los casos asignados**: Puede ver en tiempo real qué casos tiene cada psicólogo
2. **Reasignar casos**: Puede quitar un caso a un psicólogo y asignarlo a otro
3. **Asignar casos directamente**: Desde las hojas de vida, puede asignar un aspirante a un psicólogo específico
4. **Ver informes completos**: Tiene acceso a gráficos y reportes del equipo
5. **Eliminar asignaciones**: Puede liberar cualquier caso, no solo los propios

**¿Por qué es necesario?**
Actualmente no existe una figura que pueda:
- Redistribuir la carga de trabajo cuando un psicólogo está saturado
- Asignar casos estratégicamente según especialidad o disponibilidad
- Supervisar el avance general del equipo
- Generar reportes para la dirección

**Ejemplo de uso:**
María (supervisora) nota que el psicólogo Juan tiene 20 casos mientras que Ana solo tiene 5. María puede reasignar 7 casos de Juan a Ana para balancear la carga de trabajo.

---

### 2.3 Módulo: Gestión de Grupo

**¿Qué es?**
Una pantalla especial solo para supervisores donde ven todos los casos asignados del equipo de psicología.

**¿Qué muestra?**
- Tabla completa con:
  - Nombre del aspirante
  - Documento de identidad
  - Psicólogo asignado actualmente
  - Fecha en que se asignó
  - Estado del caso (En proceso, Completado, etc.)

**Acciones disponibles:**

1. **Eliminar asignación**: Quita el caso del psicólogo actual (queda disponible)
2. **Reasignar**: Asigna el caso a otro psicólogo específico
   - Al hacer clic aparece una ventana
   - Muestra lista de psicólogos disponibles
   - Muestra cuántos casos tiene cada uno
   - El supervisor selecciona uno y confirma

**Beneficio:**
El supervisor puede gestionar el equipo completo desde una sola pantalla, sin necesidad de llamar o enviar correos para coordinar reasignaciones.

---

### 2.4 Asignación Directa desde Hojas de Vida

**¿Qué es?**
El supervisor puede asignar un aspirante a un psicólogo directamente desde el módulo de consulta de hojas de vida.

**¿Cómo funciona?**
1. El supervisor busca hojas de vida de aspirantes
2. Ve un botón "Asignar" junto a cada aspirante
3. Al hacer clic, aparece una ventana con la lista de psicólogos
4. Selecciona el psicólogo y confirma
5. El aspirante queda asignado inmediatamente

**Beneficio:**
Asignación proactiva. El supervisor puede asignar casos nuevos directamente sin esperar a que los psicólogos los tomen por sí mismos, agilizando el proceso.

---

### 2.5 Módulo: Informe Global

**¿Qué es?**
Un tablero visual con gráficos y estadísticas del equipo de psicología.

**¿Qué información muestra?**

**Tarjetas de resumen:**
- Total de casos en el sistema
- Casos completados
- Casos en proceso
- Casos disponibles (sin asignar)

**Gráficos:**
1. **Gráfico de barras**: Muestra cuántos casos tiene asignado cada psicólogo
2. **Gráfico circular**: Muestra distribución de casos por estado

**Filtros:**
- Ver todos los psicólogos o filtrar por uno específico
- Ver métricas individuales o del equipo completo

**Tabla detallada:**
- Lista de todos los casos con:
  - Nombre del aspirante
  - Psicólogo asignado
  - Fecha de asignación
  - Tiempo que lleva el caso asignado
  - Estado actual

**Exportación:**
- Botón para descargar toda la información en Excel
- Útil para reportes a dirección o reuniones de equipo

**Beneficios:**
- **Transparencia**: La dirección puede ver el estado del departamento en tiempo real
- **Toma de decisiones**: Basada en datos reales, no en percepciones
- **Identificación de cuellos de botella**: Ver qué psicólogos están saturados
- **Medición de rendimiento**: Ver cuántos casos completa cada profesional
- **Planificación**: Decidir si se necesita más personal o redistribución

---

### 2.6 Liberación de Casos por IPS

**¿Qué es?**
Similar a los psicólogos, las IPS podrán liberar casos que tienen asignados.

**¿Por qué?**
Una IPS puede tener muchos casos pendientes, problemas de disponibilidad, o no poder atender un aspirante específico. Con esta función, pueden liberar el caso para que otra IPS lo tome.

**¿Cómo funciona?**
1. El usuario de IPS entra a "Mis Casos Tomados"
2. Ve un botón "Liberar" junto a cada caso
3. Confirma la acción
4. El caso queda disponible para otras IPS

---

## 3. ESTIMACIÓN DE TIEMPO Y JUSTIFICACIÓN

### 3.1 Metodología de Estimación

La estimación se basa en:
- Análisis de complejidad técnica de cada componente
- Experiencia previa en desarrollos similares
- Tiempo para pruebas y correcciones
- Documentación y reuniones de coordinación

**Nota importante**: Las horas incluyen desarrollo, pruebas unitarias, pruebas de integración y ajustes. No incluyen reuniones de seguimiento con el equipo de negocio.

---

### 3.2 Desglose Detallado por Componente

#### **FASE 1: Psicología Gestión - Liberación de Casos**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Frontend: Botón Liberar en Mis Casos** | 3h | Modificar tabla HTML, agregar botón, implementar modal de confirmación |
| **Frontend: Lógica de liberación** | 2h | Crear método en componente, integrar con servicio, manejo de errores |
| **Frontend: Servicio HTTP** | 1h | Crear método que consuma el endpoint del backend |
| **Backend: Endpoint liberar caso** | 4h | Crear ruta, validaciones de permisos, lógica de actualización en BD, manejo de errores |
| **Backend: Validaciones de seguridad** | 2h | Verificar que solo el dueño del caso o admin puede liberar |
| **Pruebas funcionales** | 2h | Probar diferentes escenarios (caso propio, caso ajeno, errores) |
| **Correcciones y ajustes** | 2h | Tiempo buffer para ajustes encontrados en pruebas |
| **SUBTOTAL FASE 1** | **16h** | **2 días de trabajo** |

**Justificación del tiempo:**
Esta es una funcionalidad relativamente simple pero requiere tocar múltiples capas (frontend, backend, base de datos). Las validaciones de seguridad son críticas porque no cualquier usuario puede liberar cualquier caso.

---

#### **FASE 2: Nuevo Rol de Supervisor Psicología**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Backend: Actualizar sistema de roles** | 2h | Agregar nuevo rol en el sistema de autenticación |
| **Backend: Actualizar middleware de permisos** | 2h | Configurar qué endpoints puede acceder este rol |
| **Frontend: Actualizar AuthService** | 1h | Agregar validación del nuevo rol |
| **Frontend: Actualizar menú lateral** | 2h | Mostrar/ocultar opciones según el rol del usuario |
| **Base de datos: Migración** | 1h | Script para actualizar usuarios existentes si es necesario |
| **Pruebas de permisos** | 2h | Verificar que cada rol ve solo lo que debe ver |
| **SUBTOTAL FASE 2** | **10h** | **1.5 días de trabajo** |

**Justificación del tiempo:**
Aunque agregar un rol parece simple, requiere validar que no rompe la seguridad existente y que todos los permisos funcionen correctamente en cada módulo.

---

#### **FASE 3: Módulo Gestión de Grupo**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Frontend: Crear componente** | 4h | Estructura del componente, imports, configuración standalone |
| **Frontend: Template HTML** | 4h | Tabla con todos los casos, columnas, diseño responsive con Bootstrap |
| **Frontend: Botón Eliminar Asignación** | 2h | Lógica y modal de confirmación |
| **Frontend: Botón Reasignar** | 4h | Modal personalizado con SweetAlert2, dropdown de psicólogos, validaciones |
| **Frontend: Servicio HTTP** | 2h | Métodos para obtener casos, psicólogos, eliminar y reasignar |
| **Frontend: Manejo de estados** | 2h | Loading, errores, actualización de datos tras acciones |
| **Backend: Endpoint casos asignados** | 4h | Query compleja para traer casos con datos de aspirante y psicólogo |
| **Backend: Endpoint psicólogos activos** | 3h | Query que cuenta casos por psicólogo, filtra por estado activo |
| **Backend: Endpoint eliminar asignación** | 3h | Lógica para quitar asignación, registrar en historial |
| **Backend: Endpoint reasignar caso** | 4h | Validaciones complejas, actualización de asignación, historial |
| **Estilos CSS** | 2h | Personalización visual del módulo |
| **Pruebas funcionales** | 4h | Probar todos los flujos, casos límite, errores |
| **Correcciones** | 3h | Ajustes basados en pruebas |
| **SUBTOTAL FASE 3** | **41h** | **5 días de trabajo** |

**Justificación del tiempo:**
Este es el módulo más complejo del proyecto porque:
- Requiere crear un componente completamente nuevo desde cero
- Maneja múltiples operaciones (ver, eliminar, reasignar)
- Requiere modales personalizados con lógica compleja
- Los endpoints del backend deben hacer consultas a múltiples colecciones (joins)
- Necesita validaciones exhaustivas de seguridad
- El historial de asignaciones requiere lógica de auditoría

---

#### **FASE 4: Asignación Directa desde Hojas de Vida**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Frontend: Modificar componente HojaVida** | 2h | Agregar botón condicional según rol |
| **Frontend: Modal de asignación** | 3h | SweetAlert2 con dropdown de psicólogos, similar a reasignación |
| **Frontend: Lógica de asignación** | 2h | Método para ejecutar asignación, actualizar vista |
| **Frontend: Actualizar servicio** | 1h | Método HTTP para llamar endpoint de asignación |
| **Backend: Endpoint asignar caso** | 4h | Crear caso nuevo o actualizar existente, validaciones |
| **Backend: Validación de duplicados** | 2h | Verificar que el aspirante no tenga ya un caso asignado |
| **Pruebas funcionales** | 2h | Probar asignación, errores, casos ya asignados |
| **Correcciones** | 2h | Ajustes basados en pruebas |
| **SUBTOTAL FASE 4** | **18h** | **2.5 días de trabajo** |

**Justificación del tiempo:**
Se reutiliza mucha lógica del módulo anterior (modal, dropdown de psicólogos), pero requiere:
- Modificar un módulo existente sin romper funcionalidad actual
- Validaciones complejas para evitar duplicados
- Integración con el módulo de hojas de vida que ya existe

---

#### **FASE 5: Módulo Informe Global**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Instalación y configuración Chart.js** | 1h | Instalar librería, configurar en Angular |
| **Frontend: Crear componente** | 3h | Estructura, imports, configuración |
| **Frontend: Template HTML** | 5h | Tarjetas de resumen, contenedores para gráficos, tabla detallada |
| **Frontend: Configuración de gráficos** | 6h | Configurar gráfico de barras, gráfico circular, opciones, colores |
| **Frontend: Lógica de filtros** | 3h | Filtro por psicólogo, actualización dinámica de gráficos |
| **Frontend: Cálculos y métricas** | 3h | Calcular totales, porcentajes, tiempos transcurridos |
| **Frontend: Función de exportar** | 4h | Generar y descargar archivo Excel con datos del informe |
| **Frontend: Servicio HTTP** | 2h | Métodos para obtener datos del informe |
| **Backend: Endpoint informe global** | 8h | Query de agregación compleja en MongoDB, múltiples lookups, cálculos |
| **Backend: Optimización de consultas** | 3h | Indexación, optimización de rendimiento para grandes volúmenes |
| **Estilos CSS** | 3h | Personalización visual de tarjetas y gráficos |
| **Pruebas funcionales** | 4h | Probar con diferentes volúmenes de datos, filtros, exportación |
| **Correcciones** | 3h | Ajustes de rendimiento y visualización |
| **SUBTOTAL FASE 5** | **48h** | **6 días de trabajo** |

**Justificación del tiempo:**
Este es el módulo más extenso porque:
- Requiere integrar una librería de gráficos (Chart.js) nueva en el proyecto
- Los gráficos requieren configuración detallada para que sean informativos y visualmente claros
- El backend debe hacer consultas muy complejas para agregar datos de múltiples colecciones
- La optimización es crítica porque puede manejar miles de registros
- La exportación a Excel requiere formatear correctamente los datos
- Las pruebas deben validar rendimiento con diferentes volúmenes de datos

---

#### **FASE 6: Liberación de Casos por IPS**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Frontend: Modificar IPS Gestión** | 2h | Agregar botón liberar en tabla de casos |
| **Frontend: Lógica de liberación** | 2h | Modal de confirmación, llamada a servicio |
| **Frontend: Actualizar servicio** | 1h | Método HTTP para liberar caso IPS |
| **Backend: Endpoint liberar caso IPS** | 3h | Similar a psicología pero para IPS, validaciones |
| **Pruebas funcionales** | 2h | Probar liberación, permisos, actualización |
| **Correcciones** | 1h | Ajustes basados en pruebas |
| **SUBTOTAL FASE 6** | **11h** | **1.5 días de trabajo** |

**Justificación del tiempo:**
Es muy similar a la liberación de casos de psicología (Fase 1), por lo que se puede reutilizar mucho código. El tiempo es menor porque se replica la lógica ya desarrollada.

---

#### **FASE 7: Rutas, Navegación y Permisos**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Actualizar app.routes.ts** | 2h | Agregar rutas para nuevos módulos con guards |
| **Configurar guards de autenticación** | 2h | Validar permisos por rol en cada ruta |
| **Pruebas de navegación** | 2h | Verificar que navegación funciona correctamente |
| **Pruebas de permisos** | 2h | Verificar que usuarios sin permisos no accedan |
| **SUBTOTAL FASE 7** | **8h** | **1 día de trabajo** |

**Justificación del tiempo:**
Aunque agregar rutas es simple, la validación de permisos es crítica para la seguridad. Cada ruta debe verificar correctamente el rol del usuario.

---

#### **FASE 8: Base de Datos**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Diseño de colección casos_psicologia** | 2h | Definir estructura, campos, relaciones |
| **Diseño de colección casos_ips** | 1h | Similar a casos_psicologia |
| **Scripts de migración** | 4h | Crear documentos para casos existentes, migrar datos |
| **Creación de índices** | 1h | Optimizar consultas con índices apropiados |
| **Pruebas de consultas** | 2h | Verificar performance de queries |
| **Backup de seguridad** | 1h | Respaldar datos antes de migración |
| **SUBTOTAL FASE 8** | **11h** | **1.5 días de trabajo** |

**Justificación del tiempo:**
La base de datos es crítica. Requiere:
- Diseño cuidadoso para evitar problemas futuros
- Scripts de migración para datos existentes
- Pruebas exhaustivas para garantizar integridad
- Backups para evitar pérdida de información

---

#### **FASE 9: Testing y QA**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Tests unitarios frontend** | 8h | Tests para cada componente nuevo (3 componentes) |
| **Tests unitarios backend** | 8h | Tests para cada endpoint (8 endpoints) |
| **Tests de integración** | 6h | Probar flujos completos entre frontend y backend |
| **Tests de permisos y seguridad** | 4h | Validar que permisos funcionan correctamente |
| **Tests de UI/UX** | 3h | Verificar que interfaz es intuitiva y funcional |
| **Corrección de bugs encontrados** | 8h | Buffer para corregir problemas encontrados en testing |
| **SUBTOTAL FASE 9** | **37h** | **5 días de trabajo** |

**Justificación del tiempo:**
El testing es fundamental para garantizar calidad. Incluye:
- Tests automatizados para prevenir regresiones futuras
- Validación exhaustiva de seguridad (aspecto crítico)
- Tiempo buffer realista para corregir problemas
- Tests de integración para validar que todo funciona en conjunto

---

#### **FASE 10: Documentación y Capacitación**

| Actividad | Horas | Justificación |
|-----------|-------|---------------|
| **Documentación técnica** | 6h | Documentar código, endpoints, arquitectura |
| **Manual de usuario - Supervisor** | 4h | Guía paso a paso para supervisor de psicología |
| **Manual de usuario - Psicólogos** | 2h | Guía de cómo liberar casos |
| **Manual de usuario - IPS** | 2h | Guía de cómo liberar casos IPS |
| **Preparación de capacitación** | 3h | Preparar presentación y ejemplos |
| **Sesión de capacitación** | 2h | Capacitar a usuarios en las nuevas funcionalidades |
| **SUBTOTAL FASE 10** | **19h** | **2.5 días de trabajo** |

**Justificación del tiempo:**
La documentación es esencial para:
- Mantenimiento futuro del sistema
- Capacitación de nuevos usuarios
- Referencia rápida para usuarios actuales
- Reducir consultas de soporte

---

### 3.3 RESUMEN TOTAL DE HORAS

| Fase | Descripción | Horas | Días |
|------|-------------|-------|------|
| 1 | Liberación Casos Psicología | 16h | 2 |
| 2 | Nuevo Rol Supervisor | 10h | 1.5 |
| 3 | Módulo Gestión Grupo | 41h | 5 |
| 4 | Asignación desde Hojas de Vida | 18h | 2.5 |
| 5 | Módulo Informe Global | 48h | 6 |
| 6 | Liberación Casos IPS | 11h | 1.5 |
| 7 | Rutas y Permisos | 8h | 1 |
| 8 | Base de Datos | 11h | 1.5 |
| 9 | Testing y QA | 37h | 5 |
| 10 | Documentación | 19h | 2.5 |
| **TOTAL** | | **219 horas** | **28.5 días** |

---

### 3.4 Distribución de Tiempo por Área

| Área | Horas | Porcentaje |
|------|-------|------------|
| **Frontend (Angular)** | 86h | 39% |
| **Backend (FastAPI)** | 61h | 28% |
| **Base de Datos** | 11h | 5% |
| **Testing y QA** | 37h | 17% |
| **Documentación** | 19h | 9% |
| **Configuración/Setup** | 5h | 2% |

---

### 3.5 Cronograma Estimado

Asumiendo un desarrollador full-stack trabajando 8 horas diarias:

**Opción 1: Un solo desarrollador**
- **Duración**: 28.5 días laborales (≈ 6 semanas calendario)
- **Ventaja**: Mayor consistencia en el código
- **Desventaja**: Mayor tiempo total

**Opción 2: Dos desarrolladores (Frontend + Backend)**
- **Duración**: 15-18 días laborales (≈ 3.5-4 semanas calendario)
- **Ventaja**: Desarrollo paralelo, menor tiempo total
- **Desventaja**: Requiere mayor coordinación

**Opción 3: Desarrollo por fases prioritarias**
Si no se necesitan todas las funcionalidades de inmediato, se puede desarrollar por prioridad:

**Prioridad Alta (Crítico):**
- Fase 1: Liberación Casos Psicología (16h - 2 días)
- Fase 2: Nuevo Rol Supervisor (10h - 1.5 días)
- Fase 6: Liberación Casos IPS (11h - 1.5 días)
- **Subtotal**: 37h - 5 días

**Prioridad Media (Importante):**
- Fase 3: Módulo Gestión Grupo (41h - 5 días)
- Fase 4: Asignación desde Hojas de Vida (18h - 2.5 días)
- **Subtotal**: 59h - 7.5 días

**Prioridad Baja (Deseable):**
- Fase 5: Módulo Informe Global (48h - 6 días)
- **Subtotal**: 48h - 6 días

**Siempre necesario:**
- Fase 7-10: Infraestructura, Testing, Docs (94h - 12 días)

---

## 4. JUSTIFICACIÓN DE INVERSIÓN

### 4.1 Problemas Actuales que se Resuelven

| Problema Actual | Impacto en Negocio | Solución Propuesta |
|-----------------|-------------------|-------------------|
| Casos bloqueados con psicólogos saturados | Aspirantes sin atención, quejas, pérdida de clientes | Liberación y reasignación de casos |
| Sin visibilidad de carga de trabajo | Decisiones sin datos, distribución desigual | Informe Global con métricas |
| Asignación manual por correo/llamada | Lentitud, errores, falta de trazabilidad | Asignación directa desde el sistema |
| Sin supervisión del equipo | Falta de control de calidad | Rol de Supervisor con herramientas |
| Sin historial de quién trabajó cada caso | Problemas de auditoría y seguimiento | Historial automático de asignaciones |

### 4.2 Retorno de Inversión

**Inversión:**
- 219 horas de desarrollo
- A tarifa promedio de desarrollo: $50-80 USD/hora
- **Costo estimado**: $10,950 - $17,520 USD

**Retorno estimado:**

1. **Ahorro en tiempo administrativo:**
   - Actualmente: ~2 horas/día en coordinación manual de casos (correos, llamadas)
   - Con el sistema: ~15 minutos/día
   - **Ahorro**: 1.75 horas/día × 22 días × $30/hora = $1,155/mes
   - **ROI en coordinación**: 10-17 meses

2. **Mejora en atención de aspirantes:**
   - Reducción estimada del 30% en tiempo de espera por reasignaciones
   - Mayor satisfacción del cliente
   - **Valor**: Difícil de cuantificar pero significativo

3. **Toma de decisiones basada en datos:**
   - Informes que antes requerían 4-6 horas de trabajo manual
   - Ahora disponibles en 1 clic
   - **Ahorro**: ~20 horas/mes en generación de reportes = $600/mes

4. **Reducción de errores:**
   - Asignaciones duplicadas, casos perdidos, falta de seguimiento
   - **Valor**: Reducción de riesgos y mejora en calidad

**ROI Total Estimado**: 12-18 meses

---

## 5. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|-----------|
| Resistencia al cambio por usuarios | Media | Alto | Capacitación adecuada, involucrar usuarios en pruebas |
| Bugs en producción | Media | Medio | Testing exhaustivo, despliegue gradual |
| Problemas de rendimiento con muchos datos | Baja | Alto | Optimización de BD, pruebas de carga |
| Migración de datos existentes | Media | Alto | Backups completos, scripts probados en ambiente de pruebas |
| Retrasos en desarrollo | Media | Medio | Buffer de 15% incluido en estimaciones |

---

## 6. RECOMENDACIONES

### 6.1 Enfoque Recomendado

**Desarrollo por Fases con Validación:**

**Fase 1 (5 días)**: Funcionalidades básicas de liberación
- Liberar casos por psicólogos e IPS
- Nuevo rol de supervisor
- **Validación**: Usuarios prueban y dan feedback

**Fase 2 (7-10 días)**: Gestión avanzada
- Módulo Gestión de Grupo
- Asignación directa desde hojas de vida
- **Validación**: Supervisores prueban funcionalidades

**Fase 3 (8-10 días)**: Análisis e informes
- Módulo Informe Global
- Exportación de datos
- **Validación**: Dirección revisa informes

**Fase 4 (6-8 días)**: Infraestructura y calidad
- Testing completo
- Documentación
- Capacitación

### 6.2 Factores Críticos de Éxito

1. **Participación de usuarios finales**: Involucrar desde el inicio
2. **Capacitación adecuada**: No solo mostrar, sino practicar
3. **Soporte post-implementación**: Disponible para dudas primeras semanas
4. **Monitoreo de adopción**: Verificar que realmente se usa el sistema

---

## 7. CONCLUSIÓN

Este proyecto representa una mejora significativa en la gestión operativa del área de psicología e IPS. Con una inversión de **219 horas de desarrollo** (equivalente a **6 semanas con un desarrollador** o **3.5 semanas con dos desarrolladores**), se logra:

- **Mayor agilidad** en la gestión de casos
- **Mejor distribución** de carga de trabajo
- **Visibilidad completa** del estado del departamento
- **Toma de decisiones** basada en datos reales
- **Trazabilidad** completa de todas las operaciones

El retorno de inversión se estima en **12-18 meses** considerando solo ahorros en tiempo administrativo, sin contar los beneficios intangibles de mejor servicio al cliente y mayor control de calidad.

**Recomendación final**: Proceder con el desarrollo en fases, comenzando por las funcionalidades de mayor impacto (liberación de casos y rol de supervisor) y escalando progresivamente hacia los módulos de análisis e informes.

---

**Elaborado por**: Equipo de Desarrollo
**Fecha**: 30 de Abril de 2026
**Versión**: 1.0

---

## ANEXO: Glosario de Términos

| Término | Significado |
|---------|-------------|
| **Aspirante** | Persona que está en proceso de selección/evaluación |
| **Caso** | Registro de un aspirante asignado a un profesional |
| **Psicólogo** | Usuario del sistema que atiende aspirantes |
| **IPS** | Institución Prestadora de Servicios de Salud |
| **Supervisor** | Usuario con permisos para administrar el equipo |
| **Liberar caso** | Quitar la asignación actual de un caso |
| **Reasignar** | Cambiar el caso de un profesional a otro |
| **Hoja de vida** | Registro completo de información de un aspirante |
| **Backend** | Parte del sistema que maneja datos y lógica de negocio |
| **Frontend** | Parte del sistema que el usuario ve e interactúa |
| **Endpoint** | Punto de conexión entre frontend y backend |
| **MongoDB** | Base de datos donde se guarda la información |
| **Angular** | Tecnología usada para construir la interfaz visual |
| **FastAPI** | Tecnología usada para construir el backend |

---

**FIN DEL INFORME EJECUTIVO**
