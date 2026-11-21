# Corrección del selector Tipo de unidad — KCJ CONTROL

**Alcance:** Flota → Nueva ficha de unidad. Se basa en la última copia del proyecto con Línea de Mando y Pausas Activas (21/11/2026).

## Cambio aplicado

- **Antes:** `Tipo` era una entrada de texto libre.
- **Ahora:** `Tipo de unidad *` es un selector obligatorio con exactamente **Camioneta, Microbús, Minibús y Ómnibus**.
- El catálogo compartido está en `lib/tipos-unidad.ts`; la vista lo muestra y la Server Action `crearVehiculo` valida su valor antes de insertar en PostgreSQL.
- El servidor rechaza valores que no están en el catálogo, incluso si se envían alterando el formulario.
- **No se modifica la base de datos ni el historial**. `Vehicle.type` sigue siendo `String`; las fichas antiguas mantienen exactamente el tipo con el que fueron registradas. No se alteran los datos reales.

## Verificación y pasos de implementación

1. Ejecutar `npm test` y `npm run typecheck` después de instalar dependencias.
2. Desplegar primero en entorno de pruebas y abrir **Flota → Nueva ficha de unidad** con un perfil de Operaciones autorizado.
3. Comprobar el selector, selección obligatoria, creación de cuatro unidades ficticias y rechazo de un valor fuera del catálogo enviado directamente al servidor.
4. Comprobar unicidad de código y placa, listado de flota y exportación.
5. **Antes de desplegar en producción**, identificar la versión/commit actual de Vercel y comparar las diferencias para no sobrescribir cambios posteriores. No ejecutar `migrate reset` ni sustituir datos reales.

**Limitaciones:** no se ha publicado en Vercel, no se ha ejecutado la app contra PostgreSQL y no se han modificado fichas históricas. Si existieran nombres antiguos en la base, la normalización deberá decidirse después de obtener un inventario y autorización de TI.
