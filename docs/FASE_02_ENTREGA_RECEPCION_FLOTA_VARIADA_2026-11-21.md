# KCJ CONTROL — Fase 02: entrega y recepción de una flota diversa

**Estado:** código de desarrollo para entorno de ensayo, 21/11/2026. **No publicado, no compilado con dependencias, no probado con PostgreSQL real.** Esta entrega contiene cambios aditivos y una migración que TI deberá probar primero en una copia de la base.

## Decisión funcional

La flota KCJ contempla **camioneta, microbús, minibús y ómnibus**, pero **ninguna unidad hereda ciegamente un inventario genérico**. Cada ficha de Flota contiene su equipo real y sus cantidades. Las plantillas por tipo solo ayudan a configurar e inspeccionar; los requisitos aplicables pueden cambiar por contrato, tipo de unidad, configuración de ejes y mina.

### Circuito de la unidad (una identidad)

1. **Flota:** registrar la unidad e inventariar sus accesorios, equipos, cantidad, condición y, cuando aplica, serie y evidencia.
2. **Entrega y recepción:** abrir `/dashboard/custodia` y seleccionar el vehículo. El formulario de entrega recoge tercero, responsables, lugar, odómetro, combustible, observaciones y evidencia privada. El servidor crea un **acta inmutable** con instantánea del equipamiento real de esa unidad. Si no tiene inventario, bloquea la entrega y dirige a Flota.
3. **Devolución:** la interfaz muestra exactamente los componentes entregados, uno por uno, y exige cantidad recibida, cantidad dañada, condición y motivo si existe diferencia. Se compara con **el acta histórica**, no con la lista de Flota que pudiera haber cambiado.
4. **Diferencias:** Operaciones o Centro de Control documentan su resolución con motivo y evidencia, sin borrar la discrepancia original. Registrar la resolución no libera el vehículo.
5. **Liberación:** las conformidades de **Mantenimiento** y **SSOMA** son independientes. No pueden otorgarse si quedan faltantes o daños sin resolución. Una devolución sigue bloqueando disponibilidad hasta contar con ambas y con los demás requisitos aplicables.

## Archivos creados/cambiados

- `prisma/schema.prisma`: amplía `CustodyEvent` e incorpora `CustodyInventoryLine`.
- `prisma/migrations/20261121000900_custodia_comparativa_con_inventario/migration.sql`: columnas opcionales aditivas e instantáneas por línea. No elimina datos.
- `lib/custodia-kcj.ts`: validación de cantidades, kilometraje, combustible y comparación de inventarios.
- `app/actions-custodia.ts`: actos autenticados de entrega, recepción y resolución de diferencias, evidencia privada y auditoría.
- `app/actions-operativas.ts`: deshabilita el registro antiguo sin inventario y obliga a resolver discrepancias antes de conformidades especializadas.
- `app/dashboard/custodia/[vehicleId]/page.tsx`: formulario por vehículo, salida y devolución, comparación e historial.
- `components/dominio/ContenidoModulo.tsx` y `app/dashboard/ficha-vehicular/[id]/page.tsx`: enlaces desde ambos módulos al mismo vehículo.
- `lib/vehiculos-integrados.ts`: mantiene tipos y agrega equipamiento complementario específico de unidades de pasajeros sin considerarlo obligatorio universal.
- `tests/custodia-flota-variada.test.ts`: comparación por componente y pruebas sobre flota diversa.

## Limitaciones pendientes (no afirmar como terminado)

- **No se verificó Prisma ni `next build`.** Las dependencias completas no están instaladas en este entorno.
- Se requiere integración de PostgreSQL de ensayo y prueba de migración/restauración, además de casos concurrentes reales.
- Falta registrar **firmas electrónicas verificadas de ambas partes**, fotos múltiples por accesorio/daño y generar PDF corporativo de cada acta con logo original.
- Los inventarios de **actas legadas** que se hicieron sin líneas de equipamiento no pueden reconstruirse automáticamente: se debe documentar una regularización controlada.
- Requisitos contractuales/mineros por unidad y configuración real de ejes aún requieren validación operativa; no usar catálogos de ejemplo como estándares de Las Bambas.
- Verificación final del contenido de SOAT, mantenimiento, Tarjeta Amarilla y otras restricciones antes de entrega está pendiente de reforzar, aparte de bloqueos de caso SSOMA u órdenes abiertas.
- Antes de producción, probar permisos ADMIN, Operaciones, Mantenimiento, SSOMA y usuarios sin acceso; ida y vuelta de fotografías privadas; acta duplicada; devolución cruzando turnos; fallas de carga y recuperación.

## Pruebas sugeridas en entorno de ensayo

| Caso | Condición de aceptación |
| --- | --- |
| Camioneta con 1 extintor y un gato | Acta usa esos elementos y no incluye equipamiento de ómnibus |
| Ómnibus con 2 extintores y martillos | Se exige el inventario real de ese ómnibus, no el de la camioneta |
| Segunda camioneta con accesorios diferentes | Permanece independiente del inventario de la primera |
| Actualizar Flota después de entregar | La devolución se compara con la fotografía histórica de la entrega |
| Devolución con un accesorio faltante | Se conserva observación, cantidad, evidencia y diferencia abierta |
| Reintento del mismo formulario | No crea dos actas por un `clientEventId` idéntico |
| Mantenimiento intenta validar con diferencia abierta | Acción rechazada |
| SSOMA intenta validar con diferencia abierta | Acción rechazada |
| Ambas conformidades después de documentar diferencias | Se registra revisión, pero disponibilidad sigue respetando los demás bloqueos |

**Política de despliegue:** copia cifrada → migración de prueba → `prisma validate` → `prisma generate` → `npm test` → `npm run typecheck` → `npm run build` → integración con evidencias y usuarios ficticios → aprobación de Operaciones/SSOMA/Mantenimiento → despliegue controlado y plan de reversión. No ejecutar reset de producción.
