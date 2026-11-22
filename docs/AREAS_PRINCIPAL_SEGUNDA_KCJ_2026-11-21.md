# KCJ CONTROL — Áreas de trabajo principal y secundaria (21/11/2026)

## Decisión aprobada
- En la interfaz se utiliza **Colaboradores** en lugar de Personal, y **área de trabajo principal** y **segunda área de trabajo (opcional)** en lugar de exigir un campo libre de Cargo.
- Se conservan los datos existentes en `Worker.area` como área principal. Se añade `Worker.secondaryArea` opcional sin eliminar columnas, usuarios, Tareo ni historia laboral.
- `Worker.job` se conserva por compatibilidad con datos anteriores, pero las nuevas fichas lo registran como `Sin especificar`. No es un área, no concede permisos ni se modifica al cambiar áreas.
- Centro de Control puede dar de alta áreas en el catálogo `WorkArea`. La migración agrega áreas de referencia y registra los nombres de áreas ya existentes para mantener la edición de fichas históricas.
- Una persona puede tener una segunda área laboral sin recibir automáticamente acceso a sistemas de esa área; la asignación RBAC continúa separada.
- La actualización de la ficha muestra los valores actuales, permite conservarlos y exige motivo; anota cambios antes/después en auditoría.
- Tareo permite registrar el área de trabajo efectiva: principal por defecto o segunda área autorizada cuando corresponda. Las instantáneas históricas de Tareo se conservan y no se recalculan al cambiar de área.

## Instalación para TI (solo en base de pruebas)
1. Copiar el proyecto en una rama de integración. Ejecutar `npm ci` si existe lockfile o `npm install` si no existe.
2. Compilar con `npm run build` y validar tipos con `npm run typecheck`.
3. Hacer copia de seguridad cifrada de PostgreSQL y preparar base aislada.
4. Aplicar `npx prisma migrate deploy` y luego `npx prisma generate` solo en entorno de pruebas. Revisar `20261121000700_areas_principal_segunda`.
5. Probar registrar colaborador con una sola área, con dos distintas, con dos iguales (rechazo), actualizar únicamente estado, agregar área nueva como ADMIN y comprobar permisos negativos.
6. Confirmar que Tareo, Aula, ROSTER, Servicios y los reportes siguen funcionando con los colaboradores históricos.
7. Comparar migraciones e identidad del despliegue actual antes de tocar producción. No usar `migrate reset`.

## Límites y pendientes
- La cuenta de acceso automática con DNI y código inicial de 8 caracteres es un requisito previamente aprobado **todavía pendiente de integrar**; esta corrección no debe crear credenciales automáticamente sin asegurar una entrega privada del código de acceso. Las cuentas existentes no cambian.
- El catálogo se crea como nombres validados; crear, renombrar y archivar áreas con protección de referencias y flujos de autorización completos es una siguiente tarea.
- La categoría laboral no sustituye la función operativa (ej. conductor), que sigue siendo necesaria para los permisos y controles específicos.
- No se ejecutó una migración real en PostgreSQL, prueba en Vercel ni compilación completa salvo verificación posterior de TI.
