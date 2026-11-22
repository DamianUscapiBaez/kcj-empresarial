-- Diagnóstico para TI: ejecutar SOLO con usuario de lectura en PostgreSQL de ensayo.
SELECT current_database() AS base, current_schema() AS esquema;
SELECT to_regclass('public."User"') AS usuarios,
       to_regclass('public."Session"') AS sesiones,
       to_regclass('public."UserRoleGrant"') AS funciones,
       to_regclass('public."AuditLog"') AS auditoria,
       to_regclass('public."Worker"') AS personal;
SELECT "role", "active", count(*) AS cantidad
FROM "User" GROUP BY "role", "active" ORDER BY "role", "active";
-- No exponer login, contraseñas, hashes ni datos personales.
