# KCJ CONTROL — Corrección de carga de componentes y guía de diagnóstico

**Base:** KCJ_CONTROL_INTERFAZ_CORPORATIVA_RED1_ENTREGA_TI.zip. Se conservan el logo original, pantallas, Server Actions, modelos y migraciones Prisma.

## Qué se encontró en el código

1. `components/dominio/ContenidoModulo.tsx` ejecutaba consultas globales de trabajadores y vehículos **antes** de comprobar cuál de los 18 módulos se abría. Un fallo en cualquiera de esas consultas podía impedir renderizar un módulo sin relación con Personal o Flota.
2. `app/dashboard/page.tsx` usaba `Promise.all` para cinco indicadores. Si fallaba una sola consulta, caía el panel entero y parecía que no cargaban las tarjetas ni sus enlaces.
3. Los `<select>` sin datos mostraban únicamente «Seleccionar opción», sin explicar que aún no existen registros en su catálogo.
4. La pantalla de error no distinguía correctamente entre registros vacíos y fallo de carga.
5. `/api/health` comprobaba solo `SELECT 1`; se podía recibir `ok` incluso si las tablas obligatorias no habían sido creadas.

## Qué se corrigió

- Nuevas dependencias por módulo `lib/carga-componentes.ts`: solo se consultan catálogos de trabajadores/vehículos donde realmente se usan.
- Indicadores por `Promise.allSettled`: la navegación y demás indicadores siguen apareciendo cuando una consulta secundaria falla; datos fallidos muestran «—», **nunca cero inventado**.
- Límites de error `app/dashboard/[modulo]/error.tsx`, y mensajes para el usuario con referencia de error.
- Selecciones con catálogos vacíos muestran la causa y se deshabilitan hasta tener los registros correspondientes.
- `/api/health` verifica conexión y seis tablas base; `/api/diagnostico/componentes` (solo ADMIN) comprueba ocho grupos de datos sin exponer filas ni contraseñas.

## Comprobaciones necesarias en el ambiente real

1. Instalar dependencias con `npm install`. No incorporar contraseñas en Git ni subir `.env`.
2. Ejecutar `npx prisma validate`, `npx prisma generate`, `npm run typecheck` y `npm run build`. Si falla alguno, **no desplegar como aprobado**.
3. Verificar `DATABASE_URL` del despliegue y que sea **la misma base** donde se aplicaron `npx prisma migrate deploy` y `npm run db:seed` (solo si corresponde, sin reiniciar una base activa).
4. Visitar `/api/health`: `status:ok` y `schema:ready` indican que las seis tablas principales se encuentran en el esquema actual (no certifica todas las tablas).
5. Ingresar como ADMIN. Visitar `/api/diagnostico/componentes`: cada módulo debe devolver `status:ok`. **Un conteo de 0 es correcto si aún no hay registros.** Un status `error` indica fallo de consulta.
6. Probar al menos `/dashboard/personal`, `/dashboard/operaciones`, `/dashboard/ssoma`, `/dashboard/aula` y `/dashboard/almacen`. Registrar un dato ficticio en PostgreSQL de prueba, recargar y comprobar que persiste.
7. Revisar logs del despliegue Vercel y consola del navegador si persiste el error; guardar la referencia (`digest`) mostrada por la pantalla de error. No enviar URL privadas con contraseñas ni tokens.

### Síntomas para distinguir

| Lo que observa TI | Posible origen |
|---|---|
| Error `KCJ_DATABASE_ERROR` en health | Conexión, credenciales, red, esquema inexistente o Prisma |
| `KCJ_SCHEMA_PENDING` | Base accesible, pero faltan tablas principales (migraciones no aplicadas o base incorrecta) |
| Health ok, diagnóstico error en un módulo | Faltan tablas/columnas o consulta incompatible con esquema desplegado |
| Diagnóstico ok, componente vacío | Puede ser que aún no existan registros o no haya opciones para ese usuario |
| Error visible con referencia | Revisar digest y logs de Vercel de esa solicitud |

**Alcance real de la corrección:** evita bloqueos de renderizado causados por dependencias innecesarias y facilita localizar fallos. No crea tablas en PostgreSQL ni sustituye las pruebas reales de compilación y navegación con cuentas de TI.
