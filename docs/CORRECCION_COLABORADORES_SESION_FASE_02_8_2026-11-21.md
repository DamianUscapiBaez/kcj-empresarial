# KCJ CONTROL — Fase 02.8: carga de sesión y Colaboradores

**Estado:** corrección de código local, no desplegada. No se modificaron trabajadores ni vehículos reales.

## Hallazgo concreto

`lib/auth.ts` consultaba `prisma.session.findUnique({include:{user:{include:{worker:true,...}}}})` al validar cada sesión. Prisma selecciona **todas** las columnas de `Worker`, incluida `secondaryArea` incorporada en la migración `20261121000700_areas_principal_segunda`. En bases anteriores, esto puede producir `P2022` **antes** de llegar al modo compatible de `components/dominio/ContenidoModulo.tsx`. También puede impedir abrir el diagnóstico ADMIN, porque ese diagnóstico usa `currentUser`.

## Corrección del código

1. La consulta de sesión solo selecciona `Worker.id`, `Worker.name` y `Worker.active` mediante `lib/auth-select.ts`; las pausas activas conservan el nombre necesario. Se mantiene la verificación de sesión, roles y permisos; no se crea otra identidad.
2. Colaboradores conserva la compatibilidad de la fase 02.6: si falta `secondaryArea` o `WorkArea`, lista **solo los datos existentes** en modo consulta y bloquea escrituras hasta migrar.
3. Si la base no responde, hay permisos incorrectos, falta la tabla base `Worker` o sucede otro error, ahora muestra un panel de fallo **específico** sin tabla ficticiamente vacía ni formularios. Se registra solo clase y código de error en el servidor. El diagnóstico `/api/diagnostico/colaboradores` continúa restringido a ADMIN.
4. No se agregó migración ni `db push` ni borrados automáticos. Esta corrección NO repara por sí sola PostgreSQL.

## Pruebas exigidas a TI

1. Usar copia cifrada y restaurable de la base real, o datos ficticios. Verificar la migración `20261121000700_areas_principal_segunda` con `prisma migrate status` y el diagnóstico ADMIN.
2. Ejecutar `npm install`, `npm run db:generate`, `npm run typecheck`, `npm test` y `npm run build` en equipo con acceso a npm. No publicar si hay fallos.
3. En ambiente de ensayo, probar con **base atrasada** que la sesión no cae por `Worker.secondaryArea` y que Colaboradores muestra el padrón en solo lectura. Probar también caída de PostgreSQL: se debe ver el aviso técnico sin inventar una lista vacía.
4. Después de aplicar la migración a la base de ensayo, registrar un **trabajador ficticio**, crear una cuenta vinculada y verificar login, lectura, edición, permisos ADMIN/RRHH y roles combinados; eliminar solo datos de prueba del entorno aislado.
5. Respaldar y restaurar con éxito antes de cualquier cambio de producción. Verificar deployment ID y logs de Vercel asociados al error original `1575244433` para confirmar si efectivamente era `P2022` u otra causa. Publicar solo después de aprobación TI.

**Límite:** no se pudo validar compilación completa, PostgreSQL de Vercel ni flujo de usuario final en este entorno. No se garantiza desaparición de otros errores de producción sin sus logs.
