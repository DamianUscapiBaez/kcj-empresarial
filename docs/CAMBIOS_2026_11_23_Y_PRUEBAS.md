# Validación funcional del 23/11/2026

Se incorporan las correcciones reclamadas durante las pruebas de navegación: ficha de colaboradores que antes causaba error 404; selección independiente entre Gerencia y RRHH; visibilidad de funciones según permisos; licencia con categoría y celular de consulta (sin marcación), incluso para colaboradores no conductores; ROSTER por Operaciones con aprobación de Jefatura, avisos para perfiles de consulta y mensaje «cruce de horarios»; menú por prioridades del panel.

La incorporación del teléfono y campos de licencia requiere migración aditiva `20261123001900_datos_contacto_licencia`. La página del padrón pasa temporalmente a solo lectura cuando faltan estas columnas, evitando altas con un esquema incompleto.

Las pruebas automáticas y estáticas comprueban estructura y lógica aislada. No sustituyen un ensayo real de login, permisos, migraciones, guardado y publicación en PostgreSQL/Vercel.

Riesgos todavía pendientes: validación legal exacta del tipo/categoría de licencia requerida por vehículo, pruebas end-to-end de guardias y servicios con datos ficticios, pruebas reales de conexión y reconexión de KCJ CONNECT, exportación CargaMasivaHH y Tareo Vehicular definitivo.
