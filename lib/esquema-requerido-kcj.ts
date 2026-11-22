/** Todas las tablas del esquema Prisma que deben existir antes de abrir la marcha blanca. */
export const TABLAS_KCJ = ["Worker","User","UserRoleGrant","Session","AuditLog","Owner","Vehicle","VehicleEquipment","VehicleChecklist","VehicleDocument","OdometerReading","WorkOrder","Clearance","MedicalFitness","Roster","Service","ServiceEvent","Inspection","Timesheet","SafetyCase","SafetyAction","Contract","Course","CourseMaterial","Question","Choice","Enrollment","QuizAttempt","Announcement","AnnouncementRevision","Receipt","InventoryItem","StockMovement","CustodyEvent","CustodyInventoryLine","CustodyItemPhoto","CustodySignature","EvidenceAsset","ActivePause","WorkArea","PracticeTopicState","PracticeQuestion","PracticeMaterial","PracticeAttempt"] as const;
export const COLUMNAS_CRITICAS_KCJ = [
 {table:"Worker",column:"secondaryArea"},
 {table:"User",column:"workerId"},
 {table:"User",column:"passwordHash"},
 {table:"Session",column:"revokedAt"},
 {table:"Service",column:"workerId"},
 {table:"PracticeQuestion",column:"correctOption"},
 {table:"PracticeAttempt",column:"clientEventId"},
] as const;
export const MIGRACIONES_KCJ = ["20261121000100_initial","20261121000200_auditoria_segura","20261121000300_pausas_activas_linea_mando","20261121000400_asistencia_aula_verificable","20261121000500_tareo_area_origen_controlado","20261121000600_claves_administradas_sin_cambio_obligatorio","20261121000700_areas_principal_segunda","20261121000800_ficha_vehicular_equipamiento_checklist","20261121000900_custodia_comparativa_con_inventario","20261121001000_firma_manuscrita_custodia","20261121001100_fotos_por_componente_custodia","20261121001200_custodia_firma_v3_y_evidencias_tamano","20261121001300_simulacros_internos_banco_preguntas"] as const;
