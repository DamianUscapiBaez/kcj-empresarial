# Política de contraseñas KCJ CONTROL — Fase 03.7

Aplicable a cuentas de colaboradores, conductores, administradores y propietarios. La validación principal vive en `lib/politica-contrasenas.ts`; también se aplica a los formularios activos y al alta de administración inicial.

- Usuarios que eligen una clave: mínimo 8 y máximo 256 caracteres, incluidas altas, cambio personal, restablecimiento autorizado y seed inicial de ADMIN.
- DNI de trabajador: clave inicial de ocho dígitos, no se cambia automáticamente ni se vuelve a compartir si el usuario la modifica. Se recomienda modificarla por una contraseña privada.
- Propietarios: alta/restablecimiento genera token de 32 caracteres en base64url; obliga reemplazarlo en el primer acceso; el reemplazo puede tener 8 o más caracteres.
- Hash scrypt con sal por contraseña. El administrador puede **restablecer**, nunca consultar claves antiguas. Restablecer revoca las sesiones del destinatario.
- Cuentas especiales requieren un código de acceso único. Las protecciones de Administrador Principal no se alteraron.
- 8 es un mínimo permitido por solicitud del responsable; se recomienda una contraseña más larga y única especialmente para cuentas ADMIN.
- Cambio exclusivo de código: no toca registros PostgreSQL, no requiere migración nueva ni cambia contraseñas previamente asignadas.

Comprobación: `npm test`, `npm run audit:static`, `npm run audit:navegacion`, `npm run audit:migraciones`.
