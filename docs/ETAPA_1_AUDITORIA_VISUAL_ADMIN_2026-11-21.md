# KCJ CONTROL — Etapa 1: correcciones de auditoría visual con cuenta ADMIN
**Fecha:** 21/11/2026  
**Base:** `KCJ_CONTROL_CORRECCION_TAREO_AREA_ORIGEN_VERIFICABLE_2026-11-21.zip`  
**Fuente:** `KCJ_Revision_Visual_18_Modulos(1).pdf` (5 páginas, acceso ADMIN).  
**Rama de trabajo:** copia local, **sin cambios en producción**.

## Alcance y regla
En esta etapa solo se atendieron observaciones visibles desde **ADMIN**, sin modificar permisos para que el administrador pueda aprobar procesos que legal u operativamente corresponden a otros responsables. Se mantuvieron los 18 módulos y la pantalla de Línea de Mando → Pausas Activas. No se crearon, actualizaron ni borraron registros reales.

## Corregido en el código de esta copia

1. **Formularios dependientes:** cuando un `select` obligatorio no contiene opciones, se explica qué registro previo falta y se deshabilita exclusivamente el botón de ese formulario. Los formularios independientes permanecen utilizables.
2. **Listas vacías:** los mensajes genéricos se reemplazaron por instrucciones específicas para Operaciones, ROSTER, RR. HH., Salud, Flota, Personal, Inventario, Custodia y otros. Los mensajes de Operaciones y ROSTER se adaptan al rol.
3. **Botones:** acciones de alta, actualización y publicación usan etiquetas explícitas (Registrar unidad, Publicar comunicado, etc.). No se cambió el servidor por renombrar botones.
4. **Cuenta ADMIN propia:** se conserva el impedimento de autodesactivación que ya existía y ahora se muestra «Tu cuenta · protegida» en la tabla.
5. **Personal:** la tabla del padrón ocupa el ancho completo debajo de los formularios, evitando una columna estrecha.
6. **Comunicaciones:** se explica que dejar los destinatarios sin restringir publica un comunicado general, y se identifica el botón de publicación y el de nueva versión.
7. **Homologación:** se presenta primero el tipo de habilitación y se explica cuándo vincular unidad o trabajador, sin convertir Homologación en un departamento.
8. **Aula Virtual:** se informa la secuencia para crear curso, agregar contenido, publicar, convocar, registrar asistencia y evaluar. Los formularios dependientes bloquean Guardar mientras falte su registro previo.
9. **Adjuntos:** controles legibles en español «Seleccionar PDF o imagen», «Tomar foto», «Subir foto desde galería» y estado de carga. Se quitó de la interfaz el mensaje técnico crudo sobre S3; S3 sigue siendo requisito técnico del backend.
10. **Fechas:** etiquetas de ayuda con referencia peruana y aclaración de que el formato nativo de `date` depende del navegador, sin prometer que el OS mostrará siempre dd/mm/aaaa.
11. **Inicio de sesión:** se aclaró el contraste del pie institucional en fondo oscuro. El menú usa la paleta ya corregida de la versión base.
12. **Integridad del paquete:** el verificador de hashes ahora acepta correctamente la cabecera comentada de `MANIFIESTO_SHA256.txt`.
13. **Diagnóstico de migraciones:** el verificador estático ahora suma las cinco migraciones, no solo la inicial; informa expresamente que NO acredita migración ejecutada en PostgreSQL.

## Pruebas locales realizadas
- `npm test`: **131 aprobadas**, 0 fallidas (contiene pruebas puras y verificaciones estructurales, no E2E).
- `node scripts/auditar-navegacion.mjs`: **18/18 rutas de módulos**, Pausas Activas y ruta PDF presentes en la copia.
- `node scripts/diagnostico-estructura.mjs`: **34 modelos y 34 CREATE TABLE** a través de **5 scripts**; solo comprueba archivos locales.
- Análisis sintáctico con parser TypeScript: **71 archivos `.ts`/`.tsx`**, 0 errores de sintaxis.

## Pendientes para pruebas con cuentas reales de ensayo / TI
- No se instaló `node_modules`; **no** se certificó `next build`, `npm run typecheck` ni `prisma generate` con dependencias completas.
- No se ejecutó ninguna migración en PostgreSQL ni se verificaron guardados, archivos S3, cookies, exportaciones o concurrencia.
- No se publicaron archivos en Vercel ni se verificó el commit de producción; la web actual puede continuar mostrando los formularios anteriores.
- Falta comprobar catálogo de cargos/áreas, gestión de destinatarios por funciones reales, selector dinámico de entidad de homologación, PDF/Excel institucionales y la lógica de negocio pendiente documentada en las auditorías anteriores.
- No se han probado formularios exclusivos de Operaciones, Jefatura de Operaciones, SSOMA, Salud Ocupacional, RR. HH. o Conductor. No se debe forzar su visibilidad para ADMIN.

## Procedimiento seguro para TI
1. Comparar `package.json` y la rama/commit de Vercel con este proyecto, hacer backup y trabajar en rama aislada.
2. Instalar dependencias y generar el `package-lock.json` reproducible. Ejecutar `npm test`, `npm run db:generate`, `npm run typecheck`, `npm run build`.
3. Validar migraciones **únicamente contra PostgreSQL de ensayo**. No migrar producción en esta etapa.
4. Ingresar con cuenta ADMIN de ensayo y revisar todos los formularios, los casos con catálogos vacíos, mensajes, comunicaciones, evidencia y contraste con navegador en español.
5. Registrar resultados y observaciones. Después pasar a Etapa 2: pruebas específicas con Operaciones y Jefatura, sin eliminar datos reales.

## Estado
**Correcciones preparadas en código, NO desplegadas y NO certificadas para producción.**
