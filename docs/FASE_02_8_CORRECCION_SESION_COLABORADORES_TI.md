# KCJ CONTROL — Corrección Fase 02.8: Colaboradores

**Fecha:** 21 de noviembre de 2026. **Base:** Fase 02.7 (panel Administrativo primero, Conductor segundo). **Entrega:** código local corregido, no desplegado.

## Problema identificado

En `lib/auth.ts`, la validación de cada sesión incluía `worker: true`. Si la base de datos todavía no tiene la columna `Worker.secondaryArea`, Prisma puede lanzar `P2022` **antes de mostrar Colaboradores**; esto impedía alcanzar el modo compatible de la Fase 02.6 e incluso el diagnóstico para ADMIN. Es una causa plausible encontrada en el código; se requiere el log del despliegue para confirmar la causa real del mensaje capturado.

## Correcciones realizadas

- `lib/auth.ts` y `lib/auth-select.ts`: seleccionar solo `id`, `name` y `active` del trabajador al validar sesión. Esto conserva el nombre para pausas activas y no consulta automáticamente todas las columnas de `Worker`.
- `components/dominio/ContenidoModulo.tsx` y `lib/colaboradores-errores.ts`: controlar fallas en la carga de Colaboradores con un aviso específico. Nunca mostrar cero registros si la base falló ni habilitar altas cuando el esquema está incompleto. No revelar SQL ni datos personales.
- Conservar el modo de solo lectura de la Fase 02.6 cuando faltan `secondaryArea` o `WorkArea`. La corrección de código no suple las migraciones para registrar/editar trabajadores.
- Pruebas adicionales en `tests/colaboradores-sesion-segura.test.ts` que detectan consultas de sesión a Worker completo y distinguen errores de esquema, conexión y permisos.
- Sin cambios en las migraciones, sin borrados, sin inserciones automáticas y sin modificaciones de registros reales.

## Pruebas ejecutadas localmente

- `npm test`: **249/249 aprobadas**.
- Parser de TypeScript: **120 archivos TS/TSX sin errores sintácticos**.
- `npm run typecheck`: **no pasó** porque faltan paquetes y declaraciones de Next.js/React/Prisma.
- `npm run build`: **no se completó** (`prisma: not found`).
- PostgreSQL, Vercel y creación de usuarios reales: **no verificados**.

## Pasos para TI (en orden, sin tocar producción hasta validar)

1. Respaldar la base de datos y comprobar que puede restaurarse. Probar primero en entorno de ensayo.
2. Integrar este ZIP en la rama o proyecto correcto de KCJ CONTROL. Verificar que no se esté desplegando un commit o ZIP anterior.
3. Con Node.js 22+ y acceso a npm, ejecutar `npm install`, `npm run db:generate`, `npm run typecheck`, `npm test` y `npm run build` dentro de `KCJ_CONTROL_EMPRESARIAL_UNIFICADO`.
4. Verificar el esquema en base de ensayo: `npx prisma migrate status`. Revisar la migración `20261121000700_areas_principal_segunda`. Si falta, aprobar y ejecutar `npx prisma migrate deploy` **solo en ensayo**, bajo control TI. No usar `migrate reset` ni `db push` en producción.
5. Comprobar escenarios: cuenta ADMIN asociada a trabajador anterior, apertura de Colaboradores con esquema atrasado (modo consulta), diagnóstico ADMIN, y luego esquema completo con registro de un trabajador ficticio, cuenta asociada, ingreso, cambio de panel, edición y permisos. Comprobar que no se duplicó ninguna ficha.
6. Revisar los **Runtime Logs de Vercel** para el error `1575244433` y determinar si aparece `P2022` o una causa distinta.
7. Después de todas las pruebas, publicar con aprobación de TI y verificar la página real. Si el error persiste, recopilar código de error de Vercel sin copiar contraseñas ni datos privados.

**No se puede afirmar que el error de producción esté resuelto sin publicar y probar la versión con la base correcta.**
