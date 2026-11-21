# KCJ CONTROL — Revisión posterior de navegación y pendientes
**Fecha:** 21 de noviembre de 2026 · **Alcance:** copia local de código fuente, nunca datos reales.

## Resultado resumido

- **18/18 módulos** están declarados en el catálogo, disponen de entrada en el menú y tienen una rama de contenido en `ContenidoModulo.tsx`. Esto comprueba **estructura y enlaces internos del código**, no que cada formulario grabe o consulte correctamente en producción.
- Nuevo acceso **Línea de Mando → Pausas Activas** para **Operaciones, Jefatura de Operaciones, SSOMA, Salud Ocupacional, Gerencia y ADMIN**, tanto en escritorio como en el menú móvil. Conductor mantiene su registro propio en **KCJ CONNECT**.
- Vista consolidada por día, con **todos los conductores identificados**: conductor/documento, unidad, placa, servicio, guardia/descanso, fecha y hora, duración, estado, motivo si no la realizó, vínculo a fotografía verificada. Un trabajador con dos pausas figura dos veces dentro de **la misma ficha por fecha**. No se presenta descanso como incumplimiento.
- **Descarga PDF A4 vertical** con logo original `public/assets/kcj-logo-original.jpg`, inicio y término por registro, foto referenciada por ID, fecha del control, totales, generador y paginación automática. Se genera desde la información consultada; el ejemplo visual usa exclusivamente registros ficticios.
- El sistema registra inicio en el **servidor al enviar foto verificada**; 5 minutos programados por defecto; el conductor confirma la finalización tras ese intervalo. El simple transcurso del tiempo **no equivale a verificación del supervisor**.
- Al declarar una pausa no realizada se exige motivo entre 10 y 500 caracteres, con guardia vigente; queda evidencia del usuario y momento de declaración.
- `ActivePause` se agrega mediante migración incremental que **no borra registros existentes**. La evidencia fotográfica no se puede reutilizar para dos pausas.
- La ruta de PDF verifica permisos en servidor y registra acción `EXPORTAR_PDF`. Las fotografías solo se abren desde el ID de una pausa, con permisos separados.

## Comprobado efectivamente

| Verificación | Resultado | Alcance real |
|---|---|---|
| Rutas de los 18 módulos | 18/18 | Análisis estático de catálogo, navegación, iconos y contenido |
| Ruta nueva de Pausas Activas y API PDF | Ambas presentes | Revisión de archivos y restricciones de roles |
| Pruebas locales | 91/91 aprobadas | Reglas y comprobaciones de estructura; no son pruebas de navegación real |
| Archivos TS/TSX | 65 analizados, sin errores de **sintaxis** | No es una compilación ni un typecheck completo |
| PDF vertical | Generado y abierto con lector PDF; A4, logo, 3 páginas con 30 registros ficticios | No se probó dentro de Vercel |
| Integración con PostgreSQL, S3 y Vercel | **No comprobada** | Requiere infraestructura de ensayo y cuentas autorizadas |

## Qué falta antes de poder navegar y operar correctamente

### 1. Bloqueadores inmediatos para publicar esta versión

1. **Identificar el código exacto desplegado en Vercel y el commit de GitHub.** La auditoría anterior inspeccionó otro ZIP; sin identificar la versión, no hay equivalencia asegurada.
2. **Instalar dependencias en entorno de desarrollo y pasar `npm run typecheck` y `npm run build`.** En esta revisión solo se comprobaron sintaxis y reglas porque el entorno de análisis no tiene `node_modules` del proyecto.
3. **Probar la migración `20261121000300_pausas_activas_linea_mando` en una COPIA de PostgreSQL** (después de las anteriores, en orden). Si se abre la ruta sin la tabla, la consulta fallará.
4. **Configurar y probar el almacenamiento privado S3**: tomar foto, subir desde galería, confirmar subida, consultar solo con permisos, descargar PDF y recuperar la imagen. Sin S3 la pausa no se registra.
5. **Pruebas reales de navegación con roles:** Conductor, Operaciones, Jefatura, SSOMA, Salud Ocupacional, Gerencia, administrador y usuario sin autorización; comprobar menús desktop/móvil, formularios, estados vacíos, retorno y errores.
6. **Usar datos sintéticos**: trabajadores en guardia diurna/nocturna, descansando, sin programación, con cambio de unidad, varias pausas, motivo de omisión, foto fallida, fecha cruzando medianoche y cuentas sin permisos.

### 2. Funciones aún incompletas identificadas en la auditoría externa

| Proceso | Estado pendiente de comprobar o completar |
|---|---|
| KCJ CONNECT | Sincronización real **sin conexión** y deduplicación en reconexiones repetidas; inspecciones por ítem con checklist y evidencias |
| Fatiga y Somnolencia | Parametrizar frecuencia y duración oficial de **5 a 10 minutos** según procedimiento aprobado. Hoy el código usa 5 minutos predeterminados; no hay agenda de avisos automática. El motivo de no realización requiere revisión por supervisor |
| ROSTER y Tareo | Guardias nocturnas, superposición de intervalos, múltiples publicaciones y que la sustitución de vehículo no duplique HHT |
| Identidad y seguridad | Revocación de sesión desde una segunda sesión abierta, cuentas con varias funciones, baja y protección del último administrador |
| Homologación | Reglas por **mina aplicable** y vigencia durante todo el servicio, comprobadas con minas y credenciales ficticias |
| Custodia / Flota | Inventarios comparables, faltantes, documentación y liberación de vehículo después de devolución, con SSOMA y Mantenimiento |
| Aula Virtual | Material obligatorio, dos intentos fallidos, refuerzo, versiones, HHC, constancias y lectura de QR en flujo completo |
| Reportes generales | PDF/Excel con filtros y fecha de corte para todos los módulos; **esta entrega incorpora solo PDF del Control Maestro de Pausas Activas** |
| Usabilidad | Teléfono físico, accesibilidad/teclado, errores por guardado fallido, catálogos de cargos y áreas y selectores sin opciones |
| Continuidad | Respaldo y restauración de PostgreSQL, descargas privadas, logs de auditoría y supervisión del funcionamiento productivo |

### 3. Cobertura de los módulos (estructura comprobada; transacciones pendientes)

| N.º | Módulo | Menú y pantalla | Prueba funcional pendiente |
|---|---|---|---|
| 01 | Acceso y usuarios | Sí | Login por rol, contraseña, revocación |
| 02 | Personal | Sí | Altas, edición y duplicados |
| 03 | Operaciones | Sí | Servicio, reasignación, restricciones |
| 04 | ROSTER | Sí | Publicar y turnos que cruzan días |
| 05 | KCJ CONNECT | Sí | Teléfono, foto, evidencia y offline |
| 06 | Flota | Sí | Documentos, vigencias y bloqueo |
| 07 | Mantenimiento | Sí | Orden crítica y liberación |
| 08 | SSOMA | Sí | Verificación y cierre de casos |
| 09 | Homologación | Sí | Alcance y vigencia por mina |
| 10 | Tareo general | Sí | Horas, aprobación y no duplicación |
| 11 | Aula Virtual | Sí | Cuestionarios, materiales y constancias |
| 12 | Recursos Humanos | Sí | Contratos, versiones y evidencias |
| 13 | Salud Ocupacional | Sí | Aptitud y confidencialidad |
| 14 | Propietarios | Sí | Acceso solo a unidades propias |
| 15 | Comunicaciones | Sí | Versiones, destinatarios y acuses |
| 16 | Reportes | Sí | Exportaciones y filtros |
| 17 | Entrega y recepción | Sí | Actas, inventario y retorno |
| 18 | Almacén y herramientas | Sí | Movimientos y permisos por área |
| — | Línea de Mando → Pausas Activas | **Ruta nueva incorporada en código** | Probar ROSTER, fotos, PDF, lectura por roles y S3 |

## Instrucciones seguras para TI

No aplicar migraciones en la base real ni desplegar el ZIP sin pruebas. En una rama/entorno aislado:

```bash
npm install
npm run db:generate
npm run test
node scripts/auditar-navegacion.mjs
npm run typecheck
npm run build
# Solo con DATABASE_URL apuntando a una base DE ENSAYO:
npm run db:migrate
npm run db:integration
```

Finalmente, probar el flujo completo de Pausas Activas desde un conductor con foto real de ensayo (sin datos de trabajadores reales), comprobar el Control Maestro con Operaciones/SSOMA/Salud, la descarga PDF y que un usuario ajeno reciba **403**. Registrar pruebas por fecha, rol, resultado y captura. Solo después decidir el despliegue.

**No se tocó la plataforma publicada, ninguna cuenta real ni el PostgreSQL de producción.**
