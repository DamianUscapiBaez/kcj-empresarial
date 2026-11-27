-- Normalización de campos autorizados. No modifica credenciales, áreas ni evidencias históricas.
BEGIN;
CREATE FUNCTION kcj_identificacion_uniforme(valor text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT AS $$
 SELECT upper(translate(btrim(regexp_replace(normalize(valor, NFC), '[[:space:]]+', ' ', 'g')), 'áéíóúüñ', 'ÁÉÍÓÚÜÑ'));
$$;
-- Evitar escrituras concurrentes durante la comprobación y actualización.
LOCK TABLE "Worker", "User", "Owner", "Vehicle", "Service", "InventoryItem" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "Vehicle" GROUP BY kcj_identificacion_uniforme("code") HAVING count(*) > 1) THEN
  RAISE EXCEPTION 'Normalización bloqueada: códigos coincidentes en Vehicle.code. Revisar manualmente; no se fusionan registros.';
 END IF;
 IF EXISTS (SELECT 1 FROM "Vehicle" GROUP BY kcj_identificacion_uniforme("plate") HAVING count(*) > 1) THEN
  RAISE EXCEPTION 'Normalización bloqueada: códigos coincidentes en Vehicle.plate. Revisar manualmente; no se fusionan registros.';
 END IF;
 IF EXISTS (SELECT 1 FROM "Service" GROUP BY kcj_identificacion_uniforme("code") HAVING count(*) > 1) THEN
  RAISE EXCEPTION 'Normalización bloqueada: códigos coincidentes en Service.code. Revisar manualmente; no se fusionan registros.';
 END IF;
 IF EXISTS (SELECT 1 FROM "InventoryItem" GROUP BY kcj_identificacion_uniforme("sku") HAVING count(*) > 1) THEN
  RAISE EXCEPTION 'Normalización bloqueada: códigos coincidentes en InventoryItem.sku. Revisar manualmente; no se fusionan registros.';
 END IF;
END $$;
INSERT INTO "AuditLog" ("id","entity","entityId","action","payload")
 SELECT 'norm20261127-Worker-'||"id", 'Worker', "id", 'NORMALIZACION_IDENTIFICACION', jsonb_build_object('origen','migracion_20261127','anterior',jsonb_build_object('name', "name"),'posterior',jsonb_build_object('name', kcj_identificacion_uniforme("name")))
 FROM "Worker" WHERE "name" IS DISTINCT FROM kcj_identificacion_uniforme("name");
UPDATE "Worker" SET "name"=kcj_identificacion_uniforme("name") WHERE "name" IS DISTINCT FROM kcj_identificacion_uniforme("name");
CREATE FUNCTION kcj_normalizar_worker() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 NEW."name" := kcj_identificacion_uniforme(NEW."name");
 RETURN NEW;
END $$;
CREATE TRIGGER kcj_normalizar_identificacion BEFORE INSERT OR UPDATE OF "name" ON "Worker" FOR EACH ROW EXECUTE FUNCTION kcj_normalizar_worker();
INSERT INTO "AuditLog" ("id","entity","entityId","action","payload")
 SELECT 'norm20261127-User-'||"id", 'User', "id", 'NORMALIZACION_IDENTIFICACION', jsonb_build_object('origen','migracion_20261127','anterior',jsonb_build_object('displayName', "displayName"),'posterior',jsonb_build_object('displayName', kcj_identificacion_uniforme("displayName")))
 FROM "User" WHERE "displayName" IS DISTINCT FROM kcj_identificacion_uniforme("displayName");
UPDATE "User" SET "displayName"=kcj_identificacion_uniforme("displayName") WHERE "displayName" IS DISTINCT FROM kcj_identificacion_uniforme("displayName");
CREATE FUNCTION kcj_normalizar_user() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 NEW."displayName" := kcj_identificacion_uniforme(NEW."displayName");
 RETURN NEW;
END $$;
CREATE TRIGGER kcj_normalizar_identificacion BEFORE INSERT OR UPDATE OF "displayName" ON "User" FOR EACH ROW EXECUTE FUNCTION kcj_normalizar_user();
INSERT INTO "AuditLog" ("id","entity","entityId","action","payload")
 SELECT 'norm20261127-Owner-'||"id", 'Owner', "id", 'NORMALIZACION_IDENTIFICACION', jsonb_build_object('origen','migracion_20261127','anterior',jsonb_build_object('name', "name"),'posterior',jsonb_build_object('name', kcj_identificacion_uniforme("name")))
 FROM "Owner" WHERE "name" IS DISTINCT FROM kcj_identificacion_uniforme("name");
UPDATE "Owner" SET "name"=kcj_identificacion_uniforme("name") WHERE "name" IS DISTINCT FROM kcj_identificacion_uniforme("name");
CREATE FUNCTION kcj_normalizar_owner() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 NEW."name" := kcj_identificacion_uniforme(NEW."name");
 RETURN NEW;
END $$;
CREATE TRIGGER kcj_normalizar_identificacion BEFORE INSERT OR UPDATE OF "name" ON "Owner" FOR EACH ROW EXECUTE FUNCTION kcj_normalizar_owner();
INSERT INTO "AuditLog" ("id","entity","entityId","action","payload")
 SELECT 'norm20261127-Vehicle-'||"id", 'Vehicle', "id", 'NORMALIZACION_IDENTIFICACION', jsonb_build_object('origen','migracion_20261127','anterior',jsonb_build_object('code', "code", 'plate', "plate", 'make', "make", 'model', "model", 'color', "color"),'posterior',jsonb_build_object('code', kcj_identificacion_uniforme("code"), 'plate', kcj_identificacion_uniforme("plate"), 'make', kcj_identificacion_uniforme("make"), 'model', kcj_identificacion_uniforme("model"), 'color', kcj_identificacion_uniforme("color")))
 FROM "Vehicle" WHERE "code" IS DISTINCT FROM kcj_identificacion_uniforme("code") OR "plate" IS DISTINCT FROM kcj_identificacion_uniforme("plate") OR "make" IS DISTINCT FROM kcj_identificacion_uniforme("make") OR "model" IS DISTINCT FROM kcj_identificacion_uniforme("model") OR "color" IS DISTINCT FROM kcj_identificacion_uniforme("color");
UPDATE "Vehicle" SET "code"=kcj_identificacion_uniforme("code"), "plate"=kcj_identificacion_uniforme("plate"), "make"=kcj_identificacion_uniforme("make"), "model"=kcj_identificacion_uniforme("model"), "color"=kcj_identificacion_uniforme("color") WHERE "code" IS DISTINCT FROM kcj_identificacion_uniforme("code") OR "plate" IS DISTINCT FROM kcj_identificacion_uniforme("plate") OR "make" IS DISTINCT FROM kcj_identificacion_uniforme("make") OR "model" IS DISTINCT FROM kcj_identificacion_uniforme("model") OR "color" IS DISTINCT FROM kcj_identificacion_uniforme("color");
CREATE FUNCTION kcj_normalizar_vehicle() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 NEW."code" := kcj_identificacion_uniforme(NEW."code");
 NEW."plate" := kcj_identificacion_uniforme(NEW."plate");
 NEW."make" := kcj_identificacion_uniforme(NEW."make");
 NEW."model" := kcj_identificacion_uniforme(NEW."model");
 NEW."color" := kcj_identificacion_uniforme(NEW."color");
 RETURN NEW;
END $$;
CREATE TRIGGER kcj_normalizar_identificacion BEFORE INSERT OR UPDATE OF "code", "plate", "make", "model", "color" ON "Vehicle" FOR EACH ROW EXECUTE FUNCTION kcj_normalizar_vehicle();
INSERT INTO "AuditLog" ("id","entity","entityId","action","payload")
 SELECT 'norm20261127-Service-'||"id", 'Service', "id", 'NORMALIZACION_IDENTIFICACION', jsonb_build_object('origen','migracion_20261127','anterior',jsonb_build_object('code', "code", 'customer', "customer"),'posterior',jsonb_build_object('code', kcj_identificacion_uniforme("code"), 'customer', kcj_identificacion_uniforme("customer")))
 FROM "Service" WHERE "code" IS DISTINCT FROM kcj_identificacion_uniforme("code") OR "customer" IS DISTINCT FROM kcj_identificacion_uniforme("customer");
UPDATE "Service" SET "code"=kcj_identificacion_uniforme("code"), "customer"=kcj_identificacion_uniforme("customer") WHERE "code" IS DISTINCT FROM kcj_identificacion_uniforme("code") OR "customer" IS DISTINCT FROM kcj_identificacion_uniforme("customer");
CREATE FUNCTION kcj_normalizar_service() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 NEW."code" := kcj_identificacion_uniforme(NEW."code");
 NEW."customer" := kcj_identificacion_uniforme(NEW."customer");
 RETURN NEW;
END $$;
CREATE TRIGGER kcj_normalizar_identificacion BEFORE INSERT OR UPDATE OF "code", "customer" ON "Service" FOR EACH ROW EXECUTE FUNCTION kcj_normalizar_service();
INSERT INTO "AuditLog" ("id","entity","entityId","action","payload")
 SELECT 'norm20261127-InventoryItem-'||"id", 'InventoryItem', "id", 'NORMALIZACION_IDENTIFICACION', jsonb_build_object('origen','migracion_20261127','anterior',jsonb_build_object('sku', "sku", 'name', "name"),'posterior',jsonb_build_object('sku', kcj_identificacion_uniforme("sku"), 'name', kcj_identificacion_uniforme("name")))
 FROM "InventoryItem" WHERE "sku" IS DISTINCT FROM kcj_identificacion_uniforme("sku") OR "name" IS DISTINCT FROM kcj_identificacion_uniforme("name");
UPDATE "InventoryItem" SET "sku"=kcj_identificacion_uniforme("sku"), "name"=kcj_identificacion_uniforme("name") WHERE "sku" IS DISTINCT FROM kcj_identificacion_uniforme("sku") OR "name" IS DISTINCT FROM kcj_identificacion_uniforme("name");
CREATE FUNCTION kcj_normalizar_inventoryitem() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 NEW."sku" := kcj_identificacion_uniforme(NEW."sku");
 NEW."name" := kcj_identificacion_uniforme(NEW."name");
 RETURN NEW;
END $$;
CREATE TRIGGER kcj_normalizar_identificacion BEFORE INSERT OR UPDATE OF "sku", "name" ON "InventoryItem" FOR EACH ROW EXECUTE FUNCTION kcj_normalizar_inventoryitem();
COMMIT;
