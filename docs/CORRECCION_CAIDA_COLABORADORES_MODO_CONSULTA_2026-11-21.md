# KCJ CONTROL — Corrección de la caída de Colaboradores (02.6)

**Alcance verificado:** código local de la última Fase 02.5; ninguna cuenta, base real ni publicación fueron modificadas.

## Incidencia
La página `/dashboard/personal` consultaba en paralelo `Worker` **sin `select`** y `WorkArea` antes de renderizar el padrón. Las consultas requieren la migración `20261121000700_areas_principal_segunda`, que añade `Worker.secondaryArea` y `WorkArea`. Si falta alguno, Prisma puede lanzar `P2022` o `P2021` y activar el error general de la captura. La existencia real de esta situación en producción debe confirmarse con logs/detector ADMIN.

## Cambio implementado
- `lib/colaboradores-compat.ts`: lectura compatible con degradación **solo para errores de esquema `P2021`/`P2022`**. Para `Worker` intenta una selección explícita con segunda área; ante error estructural, consulta solo columnas históricas (sin escribir), conservando el padrón. Si falla el catálogo `WorkArea` por esquema, no inventa áreas.
- `components/dominio/ContenidoModulo.tsx`: evita el `findMany` sin selección; cuando el esquema está incompleto presenta un aviso de **modo consulta**, mantiene la tabla de colaboradores (si `Worker` es legible) y **no representa formularios de alta, actualización o creación de áreas**. No muestra una segunda área ficticia; indica que el dato no está disponible hasta migrar.
- Si falta la tabla principal `Worker`, falla la conexión, hay credenciales incorrectas o problemas de permisos, **no** simula una pantalla vacía: conserva el error para TI.
- Se mantiene el diagnóstico ADMIN `/api/diagnostico/colaboradores`, que no muestra datos personales.

## Pruebas locales
- `npm test`: **238/238 aprobadas**, con 8 pruebas adicionales que cubren esquema completo, falta de columna, falta de catálogo, ambos faltantes, cortes de conexión, tabla Worker ausente, clasificación de errores y bloqueo de formularios.
- Parser TypeScript: **112 TS/TSX sin errores sintácticos**. Estas verificaciones **no sustituyen** `tsc` ni `next build`.
- Sin `node_modules` ni acceso verificado a PostgreSQL/Vercel: **no se realizó compilación completa ni migración real**.

## Para corregir la web de producción
1. **No asumir que el ZIP actualiza Vercel**. Integrar este código en el repositorio de la web y probarlo en una rama/URL de ensayo.
2. En Vercel, verificar la referencia del error original `1575244433` en Runtime Logs; identificar si la causa es `P2021`, `P2022`, conexión (`P1001`) u otra.
3. Con una copia de PostgreSQL de ensayo, instalar dependencias, generar Prisma, migrar de forma controlada y completar `npm test`, `npm run typecheck`, `npm run build`, pruebas de roles y consultas. La migración relevante es `20261121000700_areas_principal_segunda`.
4. Antes de migrar producción: respaldo recuperable, revisión de historial de migraciones y aprobación TI. Usar el procedimiento controlado de GitHub Actions; **nunca** `prisma migrate reset` ni `prisma db push` en producción.
5. Desplegar el código verificado y comprobar que `/dashboard/personal` lista los colaboradores. Si la estructura sigue atrasada, la pantalla será **de solo lectura** hasta completar la migración; cuando se complete correctamente, volverán los formularios de mantenimiento.
6. Validar con RR. HH. y ADMIN que el padrón, las áreas y los permisos son correctos. Si siguen apareciendo errores, revisar los logs exactos; no ocultarlos ni borrar registros.

**Alcance del arreglo:** evita la caída total por falta de los elementos nuevos cuando la tabla histórica Worker es consultable. **No repara por sí solo** la base de datos ni despliega cambios a Vercel. Para recuperar escritura y segunda área se debe terminar la migración validada en la base correcta.
