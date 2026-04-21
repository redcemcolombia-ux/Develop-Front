# Plan de trabajo — Pantalla de Login (réplica UI) con Bootstrap

## Objetivo
Implementar en el proyecto Angular actual una pantalla de login visualmente equivalente a la imagen de referencia (fondo a pantalla completa + tarjeta de login alineada a la derecha con logo, campos Usuario/Contraseña y botón “Iniciar Sesión”), usando Bootstrap en su última versión y reutilizando los assets existentes del proyecto previo.

## Alcance
- Solo Frontend (UI + routing + formulario + estados).
- Integración con API de autenticación: dejar preparada la estructura (service + contrato) y un stub, sin suponer backend disponible.

## Assets a reutilizar
Fuente de imágenes (proyecto previo):
- `C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\assets\images`

Archivos disponibles en esa carpeta:
- `Fondo.png`, `Fondo2.png`, `fondoWar.png`, `fondoWar2.png`
- `Logo.png`, `Logo2.png`, `Logo3.jpg`, `Logo3.png`, `logoF.png`, `logow.png`
- `icono.png`, `icono2.png`, `icono3.png`, `man.png`

Selección sugerida (ajustar si el “match” visual no es exacto):
- Fondo: `fondoWar2.png` (alternativas: `Fondo2.png`, `fondoWar.png`)
- Logo: `Logo.png` (alternativas: `Logo2.png`, `Logo3.png`)

## Checklist de ejecución

### 1) Preparación de dependencias y estilos globales
- [ ] Instalar Bootstrap en su última versión (`bootstrap@latest`) en el proyecto actual.
- [ ] Registrar Bootstrap CSS (preferible por import en `src/styles.css`).
- [ ] Si se requieren componentes con JS (dropdown/modal/offcanvas), registrar `bootstrap.bundle.min.js` en `angular.json` o usar import puntual (definir un único enfoque).
- [ ] Definir variables de color/estilos globales mínimos (paleta dorado/grises del botón y tarjeta) en `src/styles.css` sin romper estilos existentes.

### 2) Incorporación de imágenes al proyecto actual
- [ ] Crear carpeta de assets del proyecto si no existe: `src/assets/images`.
- [ ] Copiar desde el path fuente los archivos seleccionados (fondo y logo) hacia `src/assets/images/`.
- [ ] Verificar rutas relativas correctas desde CSS/HTML (sin hardcodear rutas absolutas de Windows).

### 3) Estructura de feature y routing
- [ ] Crear un feature de autenticación (por ejemplo `src/app/features/auth/`).
- [ ] Crear componente `LoginComponent` (standalone) con su HTML/CSS dedicado.
- [ ] Configurar rutas en `src/app/app.routes.ts`:
  - [ ] Ruta `/login` → `LoginComponent`.
  - [ ] Redirect inicial `''` → `/login` (mientras no exista dashboard).
- [ ] Simplificar `App` para que renderice solo `RouterOutlet` (remover plantilla de ejemplo de Angular en `app.html`).

### 4) Maquetación (réplica UI)
- [ ] Crear layout full-screen:
  - [ ] Fondo con imagen y overlay (opacidad y/o gradiente) para lograr contraste.
  - [ ] Contenedor a la derecha para la tarjeta.
  - [ ] Footer inferior izquierdo (texto de copyright).
- [ ] Construir tarjeta de login:
  - [ ] Logo en la parte superior dentro de la tarjeta.
  - [ ] Labels “Usuario” y “Contraseña”.
  - [ ] Inputs con estilos similares (bordes suaves, foco consistente).
  - [ ] Botón ancho “Iniciar Sesion” con color dorado y estados hover/disabled.
- [ ] Responsividad:
  - [ ] En pantallas pequeñas, centrar tarjeta y reducir padding.
  - [ ] Evitar overflow vertical; permitir scroll si el viewport es bajo.
- [ ] Accesibilidad:
  - [ ] Asociar `label` con `input` (for/id).
  - [ ] Estados de error con `aria-invalid` y mensajes legibles.

### 5) Formulario y validaciones (Reactive Forms)
- [ ] Implementar `FormGroup` con:
  - [ ] `username` (o `email`) requerido.
  - [ ] `password` requerido.
- [ ] Mostrar errores solo al tocar el campo o al enviar.
- [ ] Controlar estado del botón:
  - [ ] Disabled si el form es inválido o si está en `loading`.
- [ ] (Opcional) Toggle mostrar/ocultar contraseña si se quiere replicar UX moderna.

### 6) Contrato de autenticación (sin acoplar al backend)
- [ ] Crear `AuthService` con método `login(credentials)` que devuelva `Observable`.
- [ ] Definir interfaces:
  - [ ] `LoginRequest` (usuario + contraseña).
  - [ ] `LoginResponse` (token + metadata mínima).
- [ ] Implementar stub temporal:
  - [ ] Simular éxito/fracaso para validar flujo UI (hasta que exista endpoint real).
- [ ] Preparar manejo de errores:
  - [ ] Mensaje genérico (“Usuario o contraseña inválidos”) sin filtrar detalles sensibles.

### 7) Estado, navegación y almacenamiento
- [ ] Al éxito de login:
  - [ ] Guardar token en memoria o `localStorage` (definir estrategia; preferir memoria si habrá refresh-token más adelante).
  - [ ] Navegar a una ruta placeholder (`/home` o `/dashboard`) o mostrar mensaje temporal si aún no existe.
- [ ] Al error:
  - [ ] Mantener al usuario en login y mostrar alerta Bootstrap (`alert-danger`).

### 8) Calidad y verificación
- [ ] Verificar build y tests del repo:
  - [ ] `npm run build`
  - [ ] `npm test`
- [ ] Revisar que no existan rutas absolutas a imágenes.
- [ ] Confirmar que el login se ve igual/compatible con la referencia (alineación, tamaños, colores y espaciados).

## Criterios de aceptación
- La ruta `/login` carga una pantalla full-screen con fondo e overlay similar a la referencia.
- La tarjeta está alineada a la derecha en desktop y centrada en mobile.
- El logo y el fondo provienen de `src/assets/images` del proyecto actual.
- El formulario valida requerido y deshabilita el botón cuando corresponde.
- Bootstrap está instalado y aplicado sin romper la app.

## Notas de implementación (decisiones sugeridas)
- Preferir estilos del login encapsulados en el componente (CSS del componente) y usar `src/styles.css` solo para tokens/variables globales.
- Mantener el layout con Bootstrap (grid/flex utilities) y usar CSS personalizado solo para el overlay y el posicionamiento del fondo.
