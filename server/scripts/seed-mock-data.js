/**
 * Script de Inicialización y Población de Datos de Prueba Realistas
 * RDL Intelligence Hub
 * 
 * Cumple con la especificación completa:
 * - 1 perfil RH / Admin (Lic. Andrés Cosmes)
 * - 2 perfiles Abogada Sr (Lic. Valeria Mendoza, Lic. Sofía Ramírez)
 * - 2 perfiles Abogada Jr (Lic. Ana Martínez, Lic. Mariana Torres)
 * - Metas asignadas con KPIs cuantificables y ponderaciones balanceadas al 100%
 * - 2 publicaciones oficiales en el feed con comentarios de ejemplo
 * - 2 solicitudes de vacaciones registradas con saldos calculados
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', 'rdl_intelligence_hub.db');

const db = new sqlite3.Database(dbPath);

console.log('🌱 Inicializando datos de prueba corporativos en rdl_intelligence_hub.db...');

db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON;');
    db.run('PRAGMA journal_mode = WAL;');

    // 1. Limpiar datos existentes para garantizar un set limpio y coherente
    db.run('DELETE FROM auth_tokens;');
    db.run('DELETE FROM feed_likes;');
    db.run('DELETE FROM feed_comentarios;');
    db.run('DELETE FROM feed_publicaciones;');
    db.run('DELETE FROM metas_empleado;');
    db.run('DELETE FROM incidencias_vacaciones;');
    db.run('DELETE FROM usuarios;');

    // Reset autoincrements
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('usuarios', 'metas_empleado', 'incidencias_vacaciones', 'feed_publicaciones', 'feed_comentarios', 'auth_tokens');");

    // 2. Insertar Usuarios
    console.log('👤 Insertando perfiles corporativos (1 RH/Admin, 2 Abogadas Sr, 2 Abogadas Jr)...');

    const insertUser = db.prepare(`
        INSERT INTO usuarios (
            id, email, nombre, rol, puesto, departamento, avatar, 
            telefono, fecha_ingreso, tipo_contrato, numero_empleado, salario_base, 
            estatus_laboral, dias_vacaciones_totales, dias_vacaciones_tomados
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // ID 1: RH / Admin
    insertUser.run(
        1,
        'rh@rdl.com.mx',
        'Lic. Andrés Cosmes',
        'RH',
        'Director de Recursos Humanos & Talento',
        'Recursos Humanos',
        'AC',
        '+52 (55) 5482-9000',
        '2023-01-01',
        'Tiempo Indeterminado',
        'RDL-RH01',
        '$65,000 MXN',
        'ACTIVO',
        25,
        5
    );

    // ID 2: Abogada Sr 1
    insertUser.run(
        2,
        'valeria.mendoza@rdl.com.mx',
        'Lic. Valeria Mendoza',
        'ABOGADA_SR',
        'Abogada Senior Corporativo & M&A',
        'Legal Corporativo',
        'VM',
        '+52 (55) 5482-9002',
        '2024-06-15',
        'Tiempo Indeterminado',
        'RDL-014',
        '$48,000 MXN',
        'ACTIVO',
        18,
        4
    );

    // ID 3: Abogada Sr 2 (Directora Legal / Admin)
    insertUser.run(
        3,
        'sofia.ramirez@rdl.com.mx',
        'Lic. Sofía Ramírez',
        'ADMIN',
        'Directora Legal & Cumplimiento Normativo',
        'Dirección Legal',
        'SR',
        '+52 (55) 5482-9001',
        '2023-03-01',
        'Tiempo Indeterminado',
        'RDL-001',
        '$55,000 MXN',
        'ACTIVO',
        20,
        6
    );

    // ID 4: Abogada Jr 1
    insertUser.run(
        4,
        'ana.martinez@rdl.com.mx',
        'Lic. Ana Martínez',
        'ABOGADA_JR',
        'Abogada Junior de Litigio Laboral',
        'Litigio y Conciliación',
        'AM',
        '+52 (55) 5482-9003',
        '2025-01-10',
        'Tiempo Indeterminado',
        'RDL-028',
        '$26,000 MXN',
        'ACTIVO',
        12,
        3
    );

    // ID 5: Abogada Jr 2
    insertUser.run(
        5,
        'mariana.torres@rdl.com.mx',
        'Lic. Mariana Torres',
        'ABOGADA_JR',
        'Abogada Junior de Contratos & Auditoría',
        'Legal & Talent',
        'MT',
        '+52 (55) 5482-9004',
        '2025-05-02',
        'Tiempo Indeterminado',
        'RDL-035',
        '$24,000 MXN',
        'ACTIVO',
        12,
        2
    );

    insertUser.finalize();

    // 3. Insertar Metas Cuantificables Ponderadas al 100%
    console.log('🎯 Asignando metas ponderadas (100%) con indicadores y KPIs...');

    const insertMeta = db.prepare(`
        INSERT INTO metas_empleado (
            usuario_id, titulo, descripcion, indicador, peso, porcentaje_avance, categoria, fecha_limite, estatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Metas para Lic. Ana Martínez (ID 4 - Abogada Jr 1): 40% + 35% + 25% = 100%
    insertMeta.run(
        4,
        'Dictaminación de Expedientes Laborales',
        'Revisión exhaustiva y dictaminación jurídica de expedientes laborales de nuevo ingreso.',
        '≥ 15 expedientes dictaminados por semana con 95% efectividad',
        40.0,
        85.0,
        'Caso Legal',
        '2026-09-30',
        'EN_PROGRESO'
    );
    insertMeta.run(
        4,
        'Desahogo de Audiencias Conciliatorias',
        'Representación patronal en audiencias de conciliación ante el Centro Federal.',
        '100% de audiencias atendidas puntualmente sin diferimientos',
        35.0,
        70.0,
        'Desempeño',
        '2026-10-15',
        'EN_PROGRESO'
    );
    insertMeta.run(
        4,
        'Certificación en Compliance NOM-035 y LFT',
        'Acreditación de módulos avanzados de la Ley Federal del Trabajo y NOM-035.',
        'Calificación mínima de 9.0 en la evaluación final institucional',
        25.0,
        90.0,
        'Capacitación',
        '2026-09-15',
        'EN_PROGRESO'
    );

    // Metas para Lic. Mariana Torres (ID 5 - Abogada Jr 2): 50% + 30% + 20% = 100%
    insertMeta.run(
        5,
        'Revisión y Validación de Contratos Mercantiles',
        'Auditoría y formalización de contratos de prestación de servicios y convenios.',
        'Auditoría de 30 contratos mensuales con cero observaciones críticas',
        50.0,
        65.0,
        'Caso Legal',
        '2026-10-31',
        'EN_PROGRESO'
    );
    insertMeta.run(
        5,
        'Digitalización y Control Documental de Archivo',
        'Carga y validación de expedientes en el repositorio corporativo seguro.',
        '100% de expedientes digitalizados y clasificados correctamente',
        30.0,
        80.0,
        'OKR',
        '2026-11-15',
        'EN_PROGRESO'
    );
    insertMeta.run(
        5,
        'Actualización Normativa en Protección de Datos',
        'Revisión y adecuación de avisos de privacidad conforme a directrices INAI.',
        'Entrega y aprobación del manual de privacidad interno',
        20.0,
        50.0,
        'Capacitación',
        '2026-10-15',
        'EN_PROGRESO'
    );

    // Metas para Lic. Valeria Mendoza (ID 2 - Abogada Sr 1): 50% + 50% = 100%
    insertMeta.run(
        2,
        'Cierre de Acuerdos Corporativos y M&A',
        'Validación y estructuración jurídica en negociaciones corporativas clave.',
        'Cierre de 20 dictámenes corporativos al mes con satisfacción 100%',
        50.0,
        80.0,
        'Caso Legal',
        '2026-10-31',
        'EN_PROGRESO'
    );
    insertMeta.run(
        2,
        'Mentoría Técnica a Abogadas Junior',
        'Sesiones quincenales de litigio práctico y redacción de contratos.',
        '4 sesiones completadas con evaluación de satisfacción ≥ 9.5',
        50.0,
        75.0,
        'Desempeño',
        '2026-11-30',
        'EN_PROGRESO'
    );

    // Metas para Lic. Sofía Ramírez (ID 3 - Abogada Sr 2 / Admin): 60% + 40% = 100%
    insertMeta.run(
        3,
        'Estrategia de Litigio y Prevención de Riesgos',
        'Dirección estratégica de contingencias laborales y mercantiles del despacho.',
        'Reducción del 25% en contingencias legales patronales en Q3',
        60.0,
        90.0,
        'Caso Legal',
        '2026-11-30',
        'EN_PROGRESO'
    );
    insertMeta.run(
        3,
        'Supervisión de Cumplimiento y Gobierno Corporativo',
        'Revisión trimestral de actas de asamblea, poderes y normatividad vigente.',
        '100% de actas dictaminadas y reportes entregados a Dirección General',
        40.0,
        85.0,
        'OKR',
        '2026-12-15',
        'EN_PROGRESO'
    );

    insertMeta.finalize();

    // 4. Insertar Publicaciones Oficiales en el Feed
    console.log('📢 Publicando comunicados oficiales en el muro y agregando comentarios...');

    const insertPost = db.prepare(`
        INSERT INTO feed_publicaciones (
            id, autor_id, autor_nombre, autor_rol, autor_avatar, titulo, contenido, categoria, likes_count, fecha_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    insertPost.run(
        1,
        3,
        'Lic. Sofía Ramírez',
        'ADMIN',
        'SR',
        'Actualización de Criterios y Lineamientos Laborales Q3 2026',
        'Estimado equipo legal: Se han actualizado las directrices para la elaboración de contratos de confidencialidad y cláusulas de no competencia en apego a la jurisprudencia reciente de la SCJN. Favor de consultar los nuevos modelos en la biblioteca documental corporativa.',
        'Aviso Legal',
        8,
        '-2 hours'
    );

    insertPost.run(
        2,
        1,
        'Lic. Andrés Cosmes',
        'RH',
        'AC',
        'Inicio Oficial de Operaciones en RDL Intelligence Hub',
        '¡Bienvenidas a la plataforma RDL Intelligence Hub! A partir de hoy gestionamos aquí en tiempo real nuestras metas ponderadas al 100%, directorio con fichas Buk, seguimiento de vacaciones e incidencias laborales. El equipo de Dirección de Talento está disponible para cualquier duda.',
        'Corporativo',
        12,
        '-1 day'
    );

    insertPost.finalize();

    // 5. Insertar Comentarios de Ejemplo
    const insertComentario = db.prepare(`
        INSERT INTO feed_comentarios (
            publicacion_id, autor_id, autor_nombre, autor_avatar, comentario, fecha
        ) VALUES (?, ?, ?, ?, ?, datetime('now', ?))
    `);

    insertComentario.run(
        1,
        2,
        'Lic. Valeria Mendoza',
        'VM',
        'Enterada Lic. Sofía, procedo con la revisión de contratos vigentes para adecuarlos a los nuevos criterios.',
        '-1 hour'
    );
    insertComentario.run(
        1,
        4,
        'Lic. Ana Martínez',
        'AM',
        'Descargada la nueva plantilla para el expediente de clientes nuevos. ¡Muchas gracias!',
        '-30 minutes'
    );
    insertComentario.run(
        2,
        5,
        'Lic. Mariana Torres',
        'MT',
        'Excelente plataforma, muy ágil y clara la visualización de metas y saldo de vacaciones.',
        '-20 hours'
    );
    insertComentario.run(
        2,
        3,
        'Lic. Sofía Ramírez',
        'SR',
        'Gran avance en la digitalización de nuestros procesos jurídicos y de talento. Enhorabuena al equipo.',
        '-18 hours'
    );

    insertComentario.finalize();

    // 6. Insertar Solicitudes de Vacaciones e Incidencias con Saldo Calculado
    console.log('✈️ Registrando solicitudes de vacaciones de ejemplo...');

    const insertIncidencia = db.prepare(`
        INSERT INTO incidencias_vacaciones (
            usuario_id, usuario_nombre, usuario_rol, tipo, fecha_inicio, fecha_fin, dias_solicitados, motivo, estatus, aprobado_por, fecha_solicitud
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    // Solicitud 1: Aprobada (Ana Martínez - 3 días)
    insertIncidencia.run(
        4,
        'Lic. Ana Martínez',
        'ABOGADA_JR',
        'Vacaciones',
        '2026-09-18',
        '2026-09-21',
        3,
        'Periodo vacacional correspondiente al ejercicio 2025-2026 para trámites personales y descanso.',
        'APROBADO',
        'Lic. Andrés Cosmes (RH)',
        '-3 days'
    );

    // Solicitud 2: Pendiente (Mariana Torres - 2 días)
    insertIncidencia.run(
        5,
        'Lic. Mariana Torres',
        'ABOGADA_JR',
        'Vacaciones',
        '2026-10-05',
        '2026-10-06',
        2,
        'Solicitud de 2 días de vacaciones programadas con anticipación para atención de asuntos familiares.',
        'PENDIENTE',
        null,
        '-1 day'
    );

    insertIncidencia.finalize(() => {
        console.log('\n========================================================================');
        console.log('✅ ¡BASE DE DATOS POBLADA EXITOSAMENTE CON MOCK DATA REALISTA!');
        console.log('   - 5 Usuarios Corporativos creados (1 RH/Admin, 2 Abogadas Sr, 2 Abogadas Jr)');
        console.log('   - 10 Metas Ponderadas (sumas exactas al 100% por colaboradora)');
        console.log('   - 2 Publicaciones Oficiales en el Feed');
        console.log('   - 4 Comentarios en publicaciones');
        console.log('   - 2 Solicitudes de Vacaciones (1 Aprobada, 1 Pendiente con saldo)');
        console.log('========================================================================\n');
        process.exit(0);
    });
});
