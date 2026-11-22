![Logotipo original KCJ PERÚ S.A.C.](../public/assets/kcj-logo-original.jpg)

# KCJ CONTROL — Aplicación de la Propuesta B de navegación
**KCJ PERÚ S.A.C. | 21 de noviembre de 2026 | Entrega para TI**

## Resultado de esta iteración
Se reorganizó la navegación del **sitio web** de KCJ CONTROL siguiendo la **Propuesta B** expresamente aprobada. El mismo orden se refleja en el menú lateral de escritorio, el menú móvil y las tarjetas agrupadas del Panel General. Las categorías son **nombres de navegación**, no áreas organizativas ni permisos.

### Menú final para ADMIN (orden)

1. **Panel general** — acceso inicial fijo.
2. **Servicios y jornadas** — Servicios y asignaciones (`operaciones`), ROSTER · Guardias y descansos (`roster`), Tareo · Horas trabajadas (`tareo`) y **Control de Pausas Activas** (ruta especial).
3. **Unidades y habilitaciones** — Flota, Mantenimiento, Homologaciones externas, Entrega y recepción, Propietarios.
4. **Trabajadores y formación** — Personal, Recursos Humanos, Salud Ocupacional, Aula Virtual.
5. **Seguridad y cumplimiento** — SSOMA.
6. **Recursos corporativos** — Almacén y herramientas, Comunicaciones.
7. **Análisis y reportes** — Reportes y estadísticas.
8. **Accesos y configuración** — KCJ CONNECT, Acceso y usuarios.

Los **18 módulos originales** aparecen una sola vez. El Control Maestro de Pausas Activas es una vista adicional, no el módulo número 19 ni un departamento nuevo.

## Archivos modificados

- `lib/navegacion-kcj.ts`: nueva organización, etiquetas de presentación, y permisos específicos existentes para ver la ficha de Pausas Activas.
- `components/ui/NavigationGroup.tsx`: grupo expandible, accesible con teclado y `aria-expanded`; se abre al navegar a una ruta activa.
- `app/dashboard/layout.tsx`: reutiliza los mismos grupos en navegación de escritorio y menú móvil, sin el grupo separado «Línea de Mando».
- `components/ui/MobileNavigation.tsx`: menú móvil accesible que se cierra al cambiar de ruta.
- `app/dashboard/page.tsx`: tarjetas organizadas según la Propuesta B y etiquetas coherentes en accesos directos.
- `components/ui/PausasNavigationLink.tsx`: etiqueta de lectura más clara.
- `app/dashboard/pausas-activas/page.tsx`: migas de pan y encabezado situados dentro de Servicios y jornadas.
- `tests/organizacion-kcj.test.ts`, `tests/pausas-activas.test.ts`, `scripts/auditar-navegacion.mjs`: actualizaciones de pruebas para la navegación aprobada.
- `tests/navegacion-propuesta-b.test.ts`: cinco pruebas nuevas para menú completo, permisos, agrupación, accesibilidad y etiquetas.

## Compatibilidad y seguridad

- **Sin migraciones nuevas**. No se cambió `prisma/schema.prisma`, ni se alteraron las acciones de servidor, tablas, roles o contraseñas.
- Los identificadores `slug` y las direcciones `/dashboard/[modulo]` siguen intactos; no deben modificarse enlaces antiguos.
- Las etiquetas nuevas no implican poderes nuevos: Operaciones sigue siendo responsable de Flota, Homologación y programación operativa. SSOMA, Mantenimiento, Salud Ocupacional y RR. HH. mantienen la competencia especializada.
- El acceso a la ficha de Pausas Activas mantiene los permisos existentes de ADMIN, Gerencia, Operaciones, Jefatura de Operaciones, SSOMA y Salud Ocupacional; **no** se concede automáticamente a conductores ni otros roles.
- Las categorías desplegables afectan solo visibilidad de menú; un usuario sin permiso sigue sin poder acceder al recurso protegido.

## Verificaciones ejecutadas en copia local

- `npm test`: **160 aprobadas, 0 fallidas** (155 anteriores + 5 específicas).
- `node scripts/auditar-navegacion.mjs`: **18/18** módulos con menú, contenido e íconos; ruta y PDF de Pausas Activas presentes.
- TypeScript `createSourceFile`: **81 archivos TS/TSX sin errores sintácticos**.
- Integridad del archivo ZIP: comprobación con `unzip -t` y manifiesto SHA-256.

**No se pudo ejecutar una compilación real de Next.js, la verificación de tipos con dependencias instaladas ni pruebas de PostgreSQL**, porque este entorno no dispone de los paquetes necesarios y no pudo acceder al registro npm. Ninguna prueba alcanzó los datos de producción.

## Procedimiento para TI

1. Respaldar configuración y base de datos antes de cambios productivos; identificar el **commit exacto** actualmente desplegado en Vercel.
2. Trabajar en una rama de GitHub de prueba y comparar con el último código publicado, sin sobrescribir modificaciones posteriores no incluidas aquí.
3. Ejecutar `npm install` o preferentemente `npm ci` si se genera un `package-lock.json` reproducible; luego `npx prisma generate`, `npm run typecheck`, `npm run test`, `npm run build`.
4. Desplegar primero un entorno Preview/ensayo enlazado a una base de pruebas. No ejecutar seed o migraciones de producción por accidente.
5. Entrar como ADMIN desde Chrome y revisar los **siete grupos desplegables**, cada ruta, los accesos directos y el Panel General; repetir en pantalla móvil.
6. Probar roles de lectura/denegación. Verificar que Pausas Activas aparezca solo para los perfiles autorizados.
7. Resolver por separado el **error de carga de «Acceso y usuarios» observado en producción** usando logs de Vercel; esta reorganización no pretende haberlo solucionado.
8. Verificar y aprobar con responsables de área antes del despliegue final. PWA/KCJ CONNECT instalable queda para la siguiente fase.

## Estado
**Implementado en el código entregado; no publicado ni validado en Vercel/PostgreSQL.** Los informes anteriores describen contextos históricos y no reemplazan la presente decisión de navegación.
