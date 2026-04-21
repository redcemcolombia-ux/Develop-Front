# Gestor IPS

## Stack
Angular 17 standalone | Bootstrap 5 | FastAPI | MongoDB Atlas
API base: `https://redcemed.com/api/*`

## Estructura
src/app/
├── app.ts, app.html, app.css, app.config.ts, app.routes.ts, app.spec.ts
├── assets/      → images/, video/
├── core/        → auth.guard.ts, auth.service.ts
├── features/    → login/, home/, aspirante/ (desactivado), registroUsuarios/
└── shared/      → aside/ (con submenús Admin y Admin IPS), topbar/, theme/

## Navegación
- Admin → Registro Usuario, Listado Usuario (en construcción)
- Admin IPS → Registro IPS (en construcción), Listado IPS (en construcción)

## Convenciones
- Clases sin sufijo: Login no LoginComponent
- Standalone: true siempre
- Reactive forms siempre
- SweetAlert2 para notificaciones
- JWT en localStorage key: 'token'

## Reglas de trabajo
- No leer más de 3 archivos por tarea
- No explorar si el usuario da ruta exacta
- En bugs: leer solo ±50 líneas del error
- /clear entre tareas distintas

## Referencia Proyecto Similar
Ruta: `C:\Users\alejo\OneDrive\Escritorio\GestorIps\GetorIpsPre\Gestor-Ips\src\app\`
Usar solo cuando el usuario lo pida explícitamente.
Adaptar rutas y nombres al proyecto actual.


## Mapa de archivos (usar solo cuando el usuario lo pida) Proyectos de Referencia

### Proyecto B - Auth/Login
Ruta local: `C:\Users\alejo\OneDrive\Escritorio\GestorIps\GetorIpsPre\Gestor-Ips\src`

### Auth/Login
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\login
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\login\login.ts
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\login\login.spec.ts
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\login\login.service.ts
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\login\login.html

### Aspirante
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\aspirante\aspirante.html
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\aspirante\aspirante.ts

### aplicaiones
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\aplicaciones\aplicaciones.html
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\aplicaciones\aplicaciones.ts

### GestorIps
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\gestorIps\gestor-ips.html
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\gestorIps\gestor-ips.service.ts
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\gestorIps\gestor-ips.ts

### HojaVida
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\HojaVida\hoja-vida.html
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\HojaVida\hoja-vida.ts
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\HojaVida\hoja.service.ts

### ipsGestion
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\ipsGestion\ips-gestion.html
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\ipsGestion\ips-gestion.service.ts
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\ipsGestion\ips-gestion.ts

### PsicologiaGestion
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\psicologiaGestion\psicologia-gestion.html
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\psicologiaGestion\psicologia-gestion.service.ts
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\psicologiaGestion\psicologia-gestion.ts

### RegistroUsuarios
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\registroUsuarios\registro-usuarios.html
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\registroUsuarios\registro-usuarios.ts
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\admin\registroUsuarios\registro.service.ts

### Aspirante
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\aspirante\aspirante.html
C:\Users\alejo\OneDrive\Escritorio\Gestor Ips\GetorIpsPre\Gestor-Ips\src\app\features\aspirante\aspirante.ts