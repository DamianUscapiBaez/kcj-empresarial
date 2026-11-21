# Estado de validación y límites — KCJ CONTROL Empresarial

**No confundir código implementado con sistema corporativo certificado.**

## Verificado en este entorno

- Paquete de código fuente nativo, sin HTML independiente, Python, BAT o PS1.
- 31 modelos definidos en Prisma, 10 enumeraciones, migración SQL inicial y seed idempotente.
- 54 pruebas unitarias/estructurales ejecutadas con éxito.
- Archivos TS/TSX analizados sintácticamente con TypeScript global, sin errores de análisis.
- Catálogo de 17 módulos del Documento Maestro + Almacén y Herramientas.
- Curso ficticio de inspección preoperacional V17 extraído y separado de datos de producción.

## No verificado en este entorno

- `npm install` / `npm run build` / `npm run typecheck`: registro npm inaccesible desde este contenedor, no hay dependencias instaladas.
- `prisma validate`, `prisma migrate deploy`, `prisma generate`, prueba de base y seed PostgreSQL: no hay servidor PostgreSQL ni CLI Prisma instalado aquí.
- GitHub Actions, funcionamiento online Vercel y S3: requieren la infraestructura y credenciales de TI.
- Pantallas en navegador y usabilidad de conductores en teléfonos reales; capturas visuales no verificadas.

**La migración SQL se generó a partir de los modelos, pero no se ha aplicado sobre PostgreSQL.** Su ejecución real y concordancia con Prisma son un bloqueo previo para habilitar información real.

## Requisitos aún pendientes para declarar a KCJ como sistema único de operación

1. Validación de procesos end-to-end y permisos por cada perfil en un entorno aislado.
2. Respaldos cifrados automáticos de PostgreSQL, retención, responsable y restauración ensayada.
3. Almacenamiento S3 privado con CORS configurado, permisos, límites, registro y verificación de evidencias.
4. Pruebas de concurrencia, duplicados y bloqueo transaccional en asignaciones ROSTER/vehículos/servicios y evaluaciones.
5. Cola offline segura, recuperación, idempotencia y sincronización de KCJ CONNECT en dispositivos reales: **no implementada en esta entrega**.
6. Revisión por responsables legales/SSOMA de formularios, listas de verificación, procedimientos vigentes y retención de documentos.
7. Configuración y autorización específica de cursos externos Las Bambas, Tarjeta Amarilla y homologaciones reales.
8. Mantenimiento de estados de la flota, inventario EPP, custodias, notificaciones y vencimientos automáticos por calendario: parte de las reglas se encuentran definidas pero falta completar su operación automatizada.
9. Prueba integral de todos los flujos contra un ambiente publicado en Vercel y aceptación firmada por cada área.
10. Exportaciones PDF/Excel corporativas finales, reportes contractuales y firma/QR/documentos firmados según política de la empresa.

**Uso recomendado:** ambiente de ensayo/marcha blanca controlada con datos ficticios o anonimizados hasta superar los bloqueos. No cargar información médica sensible en los campos generales; la aptitud operativa sí está modelada.
