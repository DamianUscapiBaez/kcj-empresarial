# KCJ CONTROL — Auditoría técnica ejecutada antes de marcha blanca
**Fecha:** 22/11/2026 | **Alcance:** copia de Fase 03.0, actualizada a Fase 03.1 de ensayo. **Producción sin cambios.**

## Resultado medido

| Prueba | Resultado | Límite de evidencia |
|---|---|---|
| Pruebas locales automatizadas (Node) | **286 aprobadas / 0 fallidas** | Incluye reglas puras y comprobaciones estructurales de fuente; no son 286 pruebas visuales ni E2E |
| Auditoría de parseo TypeScript/TSX/JS | **143 archivos / 0 errores** | Verifica sintaxis, no compilación completa de Next ni resolución de paquetes de terceros |
| Dependencias internas (alias y relativas) | **266 importaciones / 0 faltantes** | No comprueba dependencias npm externas |
| Navegación (menús, contenido e íconos) | **20/20 módulos, 0 faltantes** | Presencia y correspondencia estática; no clics en navegador autenticado |
| APIs | **12 rutas examinadas** | Comprobación estática de métodos, protección declarada; sin ejecución HTTP autenticada |
| Migraciones | **13 SQL; 44 modelos/44 CREATE TABLE** | Coherencia estática; migraciones no aplicadas desde esta auditoría |
| Encabezados de CargaMasivaHH.xlsx | **34 columnas idénticas a la referencia de agosto** | Comparación exacta de primera fila y tipos, no descarga XLSX desde el sistema |
| Compilación Next.js, Prisma generate, typecheck completo | **No superadas / no ejecutables en entorno local** | Sin node_modules; npm inaccesible (EAI_AGAIN). No afirmar compilación correcta |
| PostgreSQL real y pruebas E2E usuarios | **No ejecutadas** | No existe PostgreSQL de ensayo con el esquema y datos accesibles desde la ejecución |
| Navegación visual de web publicada | **No verificada** | Intento HTTP/navegador sin acceso utilizable |

## Defectos reales corregidos en la copia de ensayo

1. **Panel general**: `highlights:Record<ModuleSlug,string>` ignoraba simulacros TECSUP y MMG. Ahora contiene los 20 módulos. Era una incompatibilidad de tipado.
2. **Auditoría de navegación**: esperaba 18, no 20, y fallaba al analizar claves entrecomilladas de íconos. Actualizada y comprobada sin faltantes.
3. **Acciones de servicios**: el botón «Finalizar servicio» se ofrecía visualmente a perfiles no operativos. Ahora aparece solo a Operaciones/Jefatura autorizada; el control del servidor se conserva.
4. **Fechas y guardias**: el parseo antiguo podía normalizar fechas inexistentes. Añadida validación estricta con 5 pruebas (febrero, bisiesto, fechas erróneas, cruces de medianoche, vencimientos y horario Perú).
5. **Evidencias privadas**: descarga temporal añade cabeceras `Cache-Control: private,no-store` y `X-Content-Type-Options: nosniff`.
6. **Seguridad de dependencias**: `package.json` ahora **declara**, para instalación y prueba posterior, Next.js 15.5.29 y React/React DOM 19.2.9. La Fase 03.0 declaraba Next.js 15.5.7 y React 19.2.0, anteriores a parches conocidos. **No significa que los paquetes estén instalados ni que la nueva versión haya compilado.**
7. **Contrato de datos HH/Carga Masiva**: creada `lib/horas-hombre-kcj.ts` con generación de encabezados exactos, paso `12`/`12N` a `12` numérico, DNI de 8 dígitos, detección de duplicados, días completos y bloqueo de periodos sin aprobación. Se añadieron 7 pruebas basadas en los encabezados reales proporcionados. **No hay todavía pantalla HH, tablas HH ni generador `.xlsx`.**
8. **Herramientas de auditoría reproducibles**: añadidos `npm run check:offline`, `npm run audit:static`, `npm run audit:navegacion`, `npm run audit:migraciones`.

### Alcance de las pantallas

Acceso y usuarios, Colaboradores, Operaciones, ROSTER, KCJ CONNECT, Flota, Mantenimiento, SSOMA, Homologaciones, Tareo general, Aula Virtual, Simulacros TECSUP, Simulacro MMG, RR. HH., Salud Ocupacional, Propietarios, Comunicaciones, Reportes, Entrega y Recepción y Almacén: **todos tienen ruta, contenido e ícono en código**. Esto no valida sus CRUD, permisos por acción, estados vacíos o excepciones con PostgreSQL.

### Incidencias importantes que siguen pendientes

- **Bloqueo de Colaboradores en producción**: evidencia previa de Prisma P2021 (tabla `WorkArea`) y P2022 (columna `Worker.secondaryArea`). La migración `20261121000700_areas_principal_segunda` está incluida, pero **no se ejecutó en la base de producción**. Verificar `GET /api/diagnostico/prepiloto` con ADMIN.
- **ROSTER → Horas Hombre → Carga Masiva Las Bambas**: diseño aprobado; lógica de conversión testeada como componente independiente; implementación de formularios, persistencia, revisión de Operaciones, aprobación y Excel real `.xlsx` falta. **No dar por terminado**.
- **Tareo Vehicular interno**: todavía no se adjuntó su Excel específico; no se ha verificado ni implementado su formato.
- **Cierre/aprobación de cada área**: requiere pruebas de rol, bloqueo de datos ajenos, autorizaciones y cierre de acciones en PostgreSQL.
- **Pruebas móviles y sin conexión**: KCJ CONNECT necesita prueba real en dispositivo, reintentos, fotografía, red caída, S3 y guardias nocturnas.
- **Paquetería npm**: no hay `package-lock.json` en el ZIP. TI debe generarlo tras resolver dependencias y conservarlo en el repositorio; después `npm ci` debe ser reproducible.
- **Seguridad**: comprobar árbol efectivo de `react-server-dom-webpack`, `sharp` y otras dependencias transitivas mediante `npm audit`, después de instalar; el cambio de `package.json` solo es preparatorio.

## Instrucciones verificables para TI

Trabajar en una **copia separada del entorno productivo**. Sin ejecutar resets ni modificaciones de datos reales:

```bash
node -v # >=22
npm run check:offline
npm install --no-audit --no-fund  # requiere conexión; genera package-lock.json
npm ci
npx prisma generate
npm run typecheck
npm run build
npm audit --audit-level=high
```

En una base PostgreSQL **de ensayo** con respaldo verificado:

```bash
npm run db:diagnose
npm run db:integration
npm run db:integration:cuentas
```

Luego probar en navegador real con perfiles ficticios: ADMIN, Jefe de Operaciones, Operaciones, Conductor, RR. HH., SSOMA, Mantenimiento, Salud, Instructor y Gerencia; validar alta, cuenta, login, doble panel, formularios hasta el final, creación/edición, seguridad de evidencias, autorizaciones, cierres y reportes. Tomar capturas de errores, registrar responsable y fecha de solución.

**Condición para declarar el sistema apto:** compilación real + migraciones verificadas en ensayo + pruebas funcionales/roles y navegación completas + casos críticos resueltos, **no solo 286 pruebas locales**.

**Referencias de parches:**
- Next.js 15.5.29: https://github.com/vercel/next.js/security/advisories/GHSA-f3mh-rxg3-f5g2
- Next.js 15.5.29: https://github.com/vercel/next.js/security/advisories/GHSA-pc58-hwjq-p385
- React RSC (parches 19.2.9): https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3
