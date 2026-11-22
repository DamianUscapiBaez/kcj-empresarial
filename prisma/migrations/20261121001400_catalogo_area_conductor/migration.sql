-- Requisito de KCJ: Conductor es un área laboral independiente; CONNECT es el panel.
-- Migración no destructiva; no cambia trabajadores ni credenciales existentes.
INSERT INTO "WorkArea" ("name","active") VALUES ('Conductor',true)
ON CONFLICT ("name") DO UPDATE SET "active"=true;
