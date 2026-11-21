# Corrección de «Unidad de medida» — Almacén y herramientas

**Fecha:** 21/11/2026. **Base:** `KCJ_CONTROL_CORRECCION_4_TIPOS_UNIDAD_2026-11-21.zip`.

## Cambio aplicado

- El formulario **Registrar material o herramienta** utiliza una lista desplegable obligatoria, con las opciones: Unidad (UND), Par (PAR), Juego (JGO), Litro (L), Kilogramo (KG), Metro (M), Caja (CJA), Paquete (PQT), Rollo (ROL).
- Una sola definición `lib/unidades-medida.ts` alimenta el formulario y la validación en la acción de servidor `crearInventario`.
- Se rechazan valores no autorizados incluso si alguien altera el formulario o envía la petición manualmente.
- No se modifica `InventoryItem.unit`, no hay migración Prisma, no se elimina ni modifica inventario existente. Los artículos históricos con nombres distintos de unidad se conservan; su eventual estandarización exige revisión con Operaciones y aprobación documentada.
- Almacen sigue siendo un inventario compartido; no se crea un departamento adicional.
- El catálogo queda definido en código en esta entrega. Un mantenimiento dinámico por administrador autorizado requeriría un flujo adicional de permisos y auditoría: **no está implementado**.

## Pruebas de aceptación en entorno aislado

1. Ingresar con usuario de Operaciones/Almacén autorizado.
2. Abrir `Almacén y herramientas → Registrar material o herramienta`.
3. Confirmar que «Unidad de medida» es una lista y exige selección.
4. Registrar un artículo ficticio con `PAR`, confirmar que se muestra en Existencias.
5. Intentar enviar una unidad arbitraria manipulando la petición: el servidor la debe rechazar.
6. Confirmar que artículos históricos conservan su campo `unit` sin cambios.
7. Comprobar que existen y funcionan los movimientos de inventario, sin efectuar modificaciones en producción.

**Estado:** Cambio de código probado por tests locales. No se ha validado compilación e integración PostgreSQL/Vercel; no despliegue automático ni alteración de datos reales.
