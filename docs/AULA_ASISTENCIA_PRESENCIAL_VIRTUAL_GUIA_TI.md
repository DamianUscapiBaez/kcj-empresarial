# KCJ CONTROL · Registro de asistencia del Aula Virtual

## Cambios implementados
- Crear curso ahora especifica **Presencial** o **Virtual** y participación virtual mínima (predeterminado: 5 minutos; ajustable al crear).
- **Presencial:** un responsable autorizado elige la convocatoria y **Asistió / No asistió / Ausencia justificada**. La ausencia exige motivo; fecha, hora y responsable se registran en el servidor. Un acta/foto privada de clase es opcional en el formulario.
- **Virtual:** solo el trabajador de la convocatoria inicia su participación; confirma el material y finaliza cuando se cumple el mínimo desde la hora de inicio del servidor. El servidor registra la asistencia al finalizar; abrir el curso no registra asistencia. Esta trazabilidad no equivale a monitorear atención continua ni sustituye una evaluación.
- **Evaluación y HHC:** asistencia no equivale a aprobado. Para cursos con examen sigue aplicando la nota y los dos intentos. Para cursos sin examen, únicamente se acredita tras asistencia y confirmación del material.
- **Auditoría:** estados, fechas, actor, motivo, evidencia y eventos quedan conservados. Los datos legados con asistencia previa pasan a ASISTIO sin atribuir un responsable ficticio.

## Instalación segura
1. Crear respaldo, identificar commit de Vercel y comparar con código que se desplegará.
2. En un PostgreSQL de ensayo, ejecutar `npm ci`/`npm install`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run typecheck`, `npm run build`, `npm test`.
3. Configurar y verificar S3 privado antes de ensayar la carga del acta; la evidencia es opcional.
4. Probar con cuentas ficticias: instructor presencial y conductor virtual; comprobar ausencia sin motivo, asistencia duplicada, curso no publicado, 5 minutos no cumplidos, dos intentos, refuerzo y constancia.
5. Validar la capacitación real con SSOMA/Operaciones antes de usar el sistema oficialmente.

## Límites conocidos
- La participación virtual se acredita a partir de eventos de inicio, material confirmado y tiempo mínimo; no demuestra por sí sola que el alumno estuvo atendiendo o vio la totalidad del material.
- No se ejecutó la migración en PostgreSQL real ni se modificaron datos de producción.
- La conexión S3 depende de las credenciales del entorno.
- La integración con Vercel/Prisma y permisos de usuario deben probarse en entorno aislado.
