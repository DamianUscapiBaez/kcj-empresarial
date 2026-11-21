-- SOLO LECTURA: ejecutar en pgAdmin con la misma base que usa Vercel.
SELECT current_database() AS base, current_user AS usuario, current_schema() AS esquema;
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
SELECT count(*) AS numero_tablas FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Worker','User','Vehicle','Service','Roster','SafetyCase','Course','EvidenceAsset','_prisma_migrations') ORDER BY table_name;
-- SOLO ejecutar conteos siguientes si todas las tablas ya existen:
-- SELECT count(*) AS administradores FROM "User" WHERE role='ADMIN';
-- SELECT count(*) AS trabajadores FROM "Worker";
-- SELECT count(*) AS unidades FROM "Vehicle";
-- SELECT count(*) AS cursos FROM "Course";
-- SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at;
