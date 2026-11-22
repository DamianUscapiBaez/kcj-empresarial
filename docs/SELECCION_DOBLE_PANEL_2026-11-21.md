# KCJ CONTROL — Selección de panel por cuenta (Fase 02.7)

## Reglas aprobadas

- Una sola cuenta, una contraseña, una ficha Worker; roles adicionales autorizados por Centro de Control.
- Si la cuenta tiene rol CONDUCTOR y otro rol: al iniciar sesión muestra **1. Administrativo** y **2. Conductor**.
- Elige Administrativo para KCJ CONTROL y Conductor para KCJ CONNECT. Puede cambiar entre los dos sin volver a iniciar sesión.
- Una cuenta con una sola categoría se dirige automáticamente a su vista.
- ADMIN puede añadir CONDUCTOR como rol adicional solo si ya existe una ficha Worker vinculada; se revocan sesiones tras cambiar roles.
- La selección y el cambio de panel se registran en AuditLog con referencia al usuario existente.
- La selección se guarda en cookie HttpOnly SameSite=Lax y se limpia en cada inicio/cierre de sesión; se comprueban los roles vigentes al leerla.
- La selección limita la navegación y las páginas visibles, pero **no es un factor de autorización independiente**: los Server Actions y rutas API deben seguir comprobando permisos operativos de forma individual.
- No añade tablas, credenciales, usuarios ni migraciones.

## Pruebas necesarias antes de producción

- Login de cuenta dual con ambos roles activos, orden Administrativo/Conductor y cambio sin login.
- Conductor puro y administrativo puro ingresan directamente sin pantalla de elección.
- Revocar CONDUCTOR u otro rol durante una sesión: la opción deja de estar disponible.
- Acceso directo a URL de módulo administrativo en panel conductor: denegado por servidor.
- Comprobar permisos reales de formularios y Server Actions con cuentas de doble rol; no basta la navegación.
- Probar nueva sesión con cookie previa: no se hereda el panel.
- Comprobar BD ensayo, migraciones, `prisma generate`, `next build`, typecheck, navegador y Vercel.

**Estado:** código para pruebas de TI. No desplegado ni probado contra producción.
