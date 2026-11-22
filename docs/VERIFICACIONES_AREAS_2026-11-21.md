# Verificaciones locales — KCJ CONTROL, áreas de trabajo

**Fecha:** 21/11/2026

- 167 pruebas locales en `npm test`: 167 aprobadas; ninguna fallida.
- Análisis sintáctico mediante TypeScript `createSourceFile`: 85 archivos TS/TSX, cero errores de parseo.
- `node scripts/diagnostico-estructura.mjs`: OK local (35 modelos, 7 migraciones, 35 tablas creadas en scripts).
- Se revisó la migración nueva: solo agrega `Worker.secondaryArea` y el catálogo `WorkArea`; no elimina columnas ni modifica trabajadores existentes.
- **No se ha validado:** compilación completa de Next.js, generación de Prisma Client, migración real en PostgreSQL, integración de formularios en Vercel, permisos por cargo en producción, ni entrega automática de credenciales.

## Pruebas pendientes de TI
1. Ejecutar `npm install`, `npx prisma generate`, `npm run typecheck` y `npm run build`.
2. Restaurar copia aislada de PostgreSQL; ejecutar `npx prisma migrate deploy` y revisar integridad.
3. Crear un colaborador solo con área principal; confirmar persistencia tras recargar.
4. Crear con segunda área distinta; confirmar que ambas aparecen en la ficha y CSV.
5. Intentar dos áreas iguales, o un área inexistente mediante POST; el servidor debe rechazar.
6. Actualizar únicamente estado sin modificar áreas; comprobar revocación de sesión en caso de baja.
7. Cambiar áreas, revisar auditoría y conservar los tareos históricos.
8. En Tareo, elegir la segunda área y comprobar `Timesheet.areaAtEntry` y validación posterior de RR. HH.
9. Verificar que asignar un área no concede permisos de SSOMA/Salud/Operaciones automáticamente.
10. Identificar y solucionar el error de carga anterior de Acceso y usuarios antes de desplegar.

**No ejecutar migraciones sobre producción antes de respaldo y prueba de aceptación.**
