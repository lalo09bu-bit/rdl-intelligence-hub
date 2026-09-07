import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'rdl_intelligence_hub.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening db:", err);
        process.exit(1);
    }
    migrate();
});

function migrate() {
    db.serialize(() => {
        db.run("PRAGMA foreign_keys = OFF");

        // 1. Crear tabla temporal con el nuevo CHECK constraint que incluye 'RH'
        db.run(`
            CREATE TABLE IF NOT EXISTS usuarios_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                rol TEXT CHECK(rol IN ('RH', 'ADMIN_RH', 'ADMIN', 'ABOGADA_SR', 'ABOGADA_JR')) NOT NULL DEFAULT 'ABOGADA_JR',
                puesto TEXT NOT NULL,
                departamento TEXT NOT NULL DEFAULT 'Legal & Talent',
                avatar TEXT NOT NULL DEFAULT 'avatar-default.png',
                foto_perfil TEXT DEFAULT NULL,
                telefono TEXT DEFAULT '+52 (55) 0000-0000',
                fecha_ingreso DATE DEFAULT '2026-01-15',
                tipo_contrato TEXT DEFAULT 'Tiempo Indeterminado',
                numero_empleado TEXT DEFAULT 'RDL-001',
                salario_base TEXT DEFAULT 'Confidencial',
                estatus_laboral TEXT DEFAULT 'ACTIVO',
                dias_vacaciones_totales INTEGER NOT NULL DEFAULT 15,
                dias_vacaciones_tomados INTEGER NOT NULL DEFAULT 0,
                dias_vacaciones_restantes INTEGER GENERATED ALWAYS AS (dias_vacaciones_totales - dias_vacaciones_tomados) STORED
            )
        `);

        // 2. Copiar los usuarios existentes
        db.run(`
            INSERT OR IGNORE INTO usuarios_new (id, email, nombre, rol, puesto, departamento, avatar, foto_perfil, telefono, fecha_ingreso, tipo_contrato, numero_empleado, salario_base, estatus_laboral, dias_vacaciones_totales, dias_vacaciones_tomados)
            SELECT id, email, nombre, rol, puesto, departamento, avatar, foto_perfil, telefono, fecha_ingreso, tipo_contrato, numero_empleado, salario_base, estatus_laboral, dias_vacaciones_totales, dias_vacaciones_tomados
            FROM usuarios
        `);

        // 3. Eliminar tabla vieja y renombrar
        db.run("DROP TABLE usuarios");
        db.run("ALTER TABLE usuarios_new RENAME TO usuarios");

        // 4. Actualizar a Andrés Cosmes como RH
        db.run(`
            UPDATE usuarios 
            SET rol = 'RH', puesto = 'Dirección de Recursos Humanos & Talento', departamento = 'Recursos Humanos' 
            WHERE email = 'analista.rh04@icloud.com' OR nombre LIKE '%Andres%'
        `);

        // 5. Insertar también perfil de rh@rdl.com.mx si no existe
        db.run(`
            INSERT OR IGNORE INTO usuarios (email, nombre, rol, puesto, departamento, avatar, telefono, fecha_ingreso, tipo_contrato, numero_empleado, dias_vacaciones_totales, dias_vacaciones_tomados)
            VALUES ('rh@rdl.com.mx', 'Lic. Andrés Cosmes', 'RH', 'Dirección de Recursos Humanos & Talento', 'Recursos Humanos', 'AC', '+52 (55) 5482-9000', '2023-01-01', 'Tiempo Indeterminado', 'RDL-RH01', 25, 0)
        `);

        db.run("PRAGMA foreign_keys = ON");

        db.all("SELECT id, nombre, email, rol, puesto FROM usuarios", [], (err, rows) => {
            console.log("✅ Migración SQLite completada con éxito. Usuarios registrados:");
            console.table(rows);
            process.exit(0);
        });
    });
}
