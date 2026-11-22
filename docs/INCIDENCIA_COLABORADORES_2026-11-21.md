# KCJ CONTROL — Incidencia de carga del módulo Colaboradores

**Fecha:** 21/11/2026 | **Ámbito:** diagnóstico de código (sin acceso a la base real ni despliegue en Vercel)

## Evidencia y límite

En la captura se ve `/dashboard/personal` (Colaboradores), con el límite de errores: **«No fue posible cargar los registros de este módulo»** y el digest **`1575244433`**. Esta pantalla no demuestra que se hayan borrado registros. Tampoco permite conocer por sí sola el error SQL o la versión desplegada.

En el código revisado, `components/dominio/ContenidoModulo.tsx`, caso `personal`, ejecuta dos consultas en paralelo:

- `prisma.worker.findMany({orderBy:{name:'asc'},take:300})`, que requiere la columna `Worker.secondaryArea` porque lee los campos escalares del modelo.
- `prisma.workArea.findMany(...)`, que requiere la tabla `WorkArea`.

Ambos elementos se incorporaron en la migración `20261121000700_areas_principal_segunda`. Si la base de datos que utiliza Vercel no recibió esa migración, es posible que las consultas fallen con `P2022` (columna ausente) o `P2021` (tabla ausente). **Es una hipótesis comprobable, no un diagnóstico confirmado de producción.** También cabe una caída de conexión, falta de permisos, inconsistencia entre despliegue y base de datos, etc.

## Qué cambió en este paquete

- `app/api/health/route.ts` ahora revisa la tabla `WorkArea` y la columna `Worker.secondaryArea`, para no informar «schema ready» incorrectamente cuando faltan.
- `app/api/diagnostico/componentes/route.ts`: la sonda «Personal» ya no se limita a `count()`; prueba la columna y la tabla que realmente necesita la pantalla.
- Nuevo `app/api/diagnostico/colaboradores/route.ts`: diagnóstico **solo para ADMIN** que lee metadatos de tablas y columnas, verifica el historial de migraciones y ejecuta consultas mínimas con Prisma. Devuelve códigos de error sin nombres, DNI, fotografías ni contraseñas. **No modifica datos.**
- `app/dashboard/[modulo]/error.tsx`: ofrece un enlace al diagnóstico del módulo cuando el fallo es en `/dashboard/personal`.
- Nuevas pruebas estáticas de esas protecciones.

## Verificación de la incidencia en Vercel — sin alterar registros

1. **Comprobar el despliegue activo:** Vercel → proyecto KCJ → Deployments → Production. Confirmar que el commit del proyecto contiene la misma migración 007 y las consultas actualizadas; descargar un ZIP no actualiza una web.
2. En Vercel → Runtime Logs/Functions Logs del despliegue de producción, buscar el momento en que se abrió Colaboradores y el digest `1575244433`. Identificar el **código** de Prisma, por ejemplo `P2021`, `P2022` o `P1001`. No compartir credenciales ni cadenas de conexión.
3. Desde sesión de ADMIN, **después de publicar este código en un entorno de ensayo**, abrir `/api/diagnostico/colaboradores` para comprobar `missingTables`, `missingColumns`, `migrationStatus` y `probes`. El endpoint responde `503` si encuentra una estructura incompleta y no muestra datos de empleados.
4. La ruta `/api/health` debe devolver `status:"ok"` solo si puede conectar y encuentra las tablas principales, incluyendo `WorkArea`, y `Worker.secondaryArea`.
5. Si faltan tabla o columna, TI debe identificar **cuál es la base de datos que realmente utiliza el despliegue de Vercel** y comparar el estado de migraciones. Hacer respaldo probado antes de cualquier cambio, y ensayar en una copia.

## Consulta SQL de solo lectura para TI (en la base de destino correcta)

```sql
SELECT current_database(), current_schema();
SELECT table_name FROM information_schema.tables
 WHERE table_schema = current_schema()
 AND table_name IN ('Worker', 'WorkArea', '_prisma_migrations');
SELECT column_name FROM information_schema.columns
 WHERE table_schema = current_schema() AND table_name = 'Worker'
 AND column_name IN ('area', 'secondaryArea', 'name', 'document', 'active');
-- Ejecutar la siguiente SELECT SOLO si existe _prisma_migrations:
SELECT migration_name, finished_at, rolled_back_at
 FROM "_prisma_migrations"
 WHERE migration_name = '20261121000700_areas_principal_segunda';
```

## Reparación controlada si se confirma migración pendiente

- Detener cambios de estructura en producción hasta contar con respaldo validado, procedimiento de reversión y aprobación de TI/Operaciones.
- En la misma versión que se desplegará, probar en base de ensayo: `npm install` (crear `package-lock.json`), `npx prisma validate`, `npx prisma generate`, `npx prisma migrate status`, `npx prisma migrate deploy`, `npm run typecheck`, `npm run build` y pruebas de lectura con usuario ficticio.
- Si el ensayo funciona, TI puede aplicar migraciones **pendientes** en producción mediante el workflow controlado `.github/workflows/produccion-migraciones.yml`; no ejecutar `prisma migrate reset` ni `prisma db push` contra producción, ni ejecutar el seed inicial sin autorización.
- Verificar `/dashboard/personal` y la creación/edición en entorno de ensayo; contrastar permisos y logs. Solo después aprobar despliegue.
- **No actualizar producción a partir de este ZIP sin completar la compilación y pruebas de integración.**

## Estado de pruebas en esta entrega

- `npm test`: **230/230 aprobado**, sin base de datos de producción.
- Parser de TypeScript: **110 archivos TS/TSX sin errores de sintaxis**.
- Diagnóstico estático de estructura: **40 modelos, 12 migraciones, 40 tablas definidas**.
- `npm run typecheck`, `npm run build`, migraciones en PostgreSQL y pruebas de Vercel: **no ejecutadas en este entorno** por ausencia de dependencias del proyecto y conexión a infraestructura.
