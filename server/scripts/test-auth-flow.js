/**
 * Script de Pruebas Automatizadas de Autenticación Magic Links
 * RDL Intelligence Hub
 * 
 * Verifica de punta a punta:
 * 1. PRAGMAs SQLite (WAL y Foreign Keys)
 * 2. Estructura de tabla auth_tokens e índices
 * 3. Creación criptográfica de Magic Token (SHA-256 + 15 min)
 * 4. Validación y consumo transaccional de Magic Token
 * 5. Rechazo estricto de segundo uso (Token de un solo uso)
 * 6. Rechazo de token expirado
 * 7. Firma y verificación de JWT
 * 8. Servicio de correo y generación de enlace mágico
 */

import 'dotenv/config';
import crypto from 'crypto';
import db from '../config/database.js';
import { crearMagicToken, validarMagicToken, generarJwt, verificarJwt } from '../services/auth.service.js';
import { enviarMagicLink } from '../services/mail.service.js';

let totalTests = 0;
let passedTests = 0;

function pass(name, detail = '') {
    totalTests++;
    passedTests++;
    console.log(`  [PASS] ${name}${detail ? ' -> ' + detail : ''}`);
}

function fail(name, error) {
    totalTests++;
    console.error(`  [FAIL] ${name} -> ${error}`);
}

async function runTests() {
    console.log('\n========================================================================');
    console.log('🧪 INICIANDO BATERÍA DE PRUEBAS: FLUJO DE AUTENTICACIÓN RDL');
    console.log('========================================================================\n');

    // Esperar a que la base de datos termine migraciones iniciales
    await new Promise(r => setTimeout(r, 600));

    try {
        // -------------------------------------------------------------
        // TEST 1: PRAGMAs de Base de Datos
        // -------------------------------------------------------------
        console.log('📦 1. Verificando Configuración SQLite & PRAGMAs...');
        const walResult = await new Promise((resolve) => {
            db.get('PRAGMA journal_mode;', (err, row) => resolve(row ? row.journal_mode : 'err'));
        });
        if (walResult.toLowerCase() === 'wal') {
            pass('PRAGMA journal_mode = WAL', `Modo actual: ${walResult}`);
        } else {
            fail('PRAGMA journal_mode = WAL', `Se esperaba WAL, se obtuvo: ${walResult}`);
        }

        const fkResult = await new Promise((resolve) => {
            db.get('PRAGMA foreign_keys;', (err, row) => resolve(row ? row.foreign_keys : 0));
        });
        if (fkResult === 1) {
            pass('PRAGMA foreign_keys = ON', `Valor: ${fkResult}`);
        } else {
            fail('PRAGMA foreign_keys = ON', `Se esperaba 1, se obtuvo: ${fkResult}`);
        }

        // -------------------------------------------------------------
        // TEST 2: Esquema de auth_tokens e índices
        // -------------------------------------------------------------
        console.log('\n📋 2. Verificando Tabla auth_tokens e Índices...');
        const tableColumns = await new Promise((resolve) => {
            db.all('PRAGMA table_info(auth_tokens);', (err, rows) => resolve(rows || []));
        });
        const colNames = tableColumns.map(c => c.name);
        const requiredCols = ['id', 'usuario_id', 'token_hash', 'expira_en', 'usado', 'creado_en'];
        const hasAllCols = requiredCols.every(c => colNames.includes(c));

        if (hasAllCols) {
            pass('Columnas requeridas en auth_tokens', colNames.join(', '));
        } else {
            fail('Columnas requeridas en auth_tokens', `Faltan columnas. Encontradas: ${colNames.join(', ')}`);
        }

        const indices = await new Promise((resolve) => {
            db.all("PRAGMA index_list(auth_tokens);", (err, rows) => resolve(rows || []));
        });
        const indexNames = indices.map(i => i.name);
        const hasHashIndex = indexNames.some(i => i.includes('hash'));
        const hasUserIndex = indexNames.some(i => i.includes('usuario'));

        if (hasHashIndex && hasUserIndex) {
            pass('Índices de rendimiento en auth_tokens', indexNames.join(', '));
        } else {
            fail('Índices de rendimiento en auth_tokens', `Índices encontrados: ${indexNames.join(', ')}`);
        }

        // -------------------------------------------------------------
        // TEST 3: Obtener o crear usuario de prueba
        // -------------------------------------------------------------
        const testUser = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuarios WHERE email = 'rh@rdl.com.mx' OR id = 1 LIMIT 1", (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!testUser) {
            throw new Error('No se encontró usuario de prueba en la base de datos.');
        }
        pass('Usuario de prueba activo', `${testUser.nombre} (${testUser.email})`);

        // -------------------------------------------------------------
        // TEST 4: Generación de Magic Token Criptográfico
        // -------------------------------------------------------------
        console.log('\n🔑 3. Probando crearMagicToken(usuarioId)...');
        const tokenPlano = await crearMagicToken(testUser.id);

        if (tokenPlano && typeof tokenPlano === 'string' && tokenPlano.length === 64) {
            pass('Longitud y formato del token plano', `64 caracteres hex (32 bytes crypto)`);
        } else {
            fail('Longitud del token plano', `Token inválido: ${tokenPlano}`);
        }

        const expectedHash = crypto.createHash('sha256').update(tokenPlano).digest('hex');
        const tokenRow = await new Promise((resolve) => {
            db.get('SELECT * FROM auth_tokens WHERE token_hash = ?', [expectedHash], (err, row) => resolve(row));
        });

        if (tokenRow && tokenRow.usado === 0) {
            pass('Persistencia en SQLite del hash SHA-256', `ID: ${tokenRow.id}, Usado: 0, Expira: ${tokenRow.expira_en}`);
        } else {
            fail('Persistencia en SQLite del hash SHA-256', 'No se encontró registro con el hash calculado.');
        }

        // -------------------------------------------------------------
        // TEST 5: Consumo y Validación de Magic Token
        // -------------------------------------------------------------
        console.log('\n✅ 4. Probando validarMagicToken(tokenPlano) - Primer uso...');
        const validatedUser = await validarMagicToken(tokenPlano);

        if (validatedUser && validatedUser.email === testUser.email) {
            pass('Validación exitosa del token', `Usuario retornado: ${validatedUser.nombre} (${validatedUser.rol})`);
        } else {
            fail('Validación exitosa del token', 'No se retornó el usuario esperado.');
        }

        const tokenRowAfter = await new Promise((resolve) => {
            db.get('SELECT * FROM auth_tokens WHERE id = ?', [tokenRow.id], (err, row) => resolve(row));
        });

        if (tokenRowAfter && tokenRowAfter.usado === 1) {
            pass('Token marcado atómicamente como usado = 1', `usado: ${tokenRowAfter.usado}`);
        } else {
            fail('Token marcado atómicamente como usado = 1', `usado: ${tokenRowAfter?.usado}`);
        }

        // -------------------------------------------------------------
        // TEST 6: Garantía de Un Solo Uso (Replay Attack Prevention)
        // -------------------------------------------------------------
        console.log('\n🛡️ 5. Probando rechazo de segundo uso (Token ya consumido)...');
        const secondAttempt = await validarMagicToken(tokenPlano);

        if (secondAttempt === null) {
            pass('Rechazo estricto de token ya utilizado', 'Retornó null como se especificaba');
        } else {
            fail('Rechazo estricto de token ya utilizado', 'Permitió reutilización de token (FALLA DE SEGURIDAD)');
        }

        // -------------------------------------------------------------
        // TEST 7: Rechazo de Token Expirado
        // -------------------------------------------------------------
        console.log('\n⏱️ 6. Probando rechazo de token expirado...');
        const expiredToken = crypto.randomBytes(32).toString('hex');
        const expiredHash = crypto.createHash('sha256').update(expiredToken).digest('hex');

        await new Promise((resolve) => {
            db.run(
                "INSERT INTO auth_tokens (usuario_id, token_hash, expira_en, usado) VALUES (?, ?, datetime('now', '-5 minutes'), 0)",
                [testUser.id, expiredHash],
                resolve
            );
        });

        const expiredAttempt = await validarMagicToken(expiredToken);
        if (expiredAttempt === null) {
            pass('Rechazo exitoso de token con fecha vencida', 'Retornó null');
        } else {
            fail('Rechazo exitoso de token con fecha vencida', 'Validó un token expirado');
        }

        // -------------------------------------------------------------
        // TEST 8: Firma y Verificación de JWT
        // -------------------------------------------------------------
        console.log('\n🔏 7. Probando generación y verificación de JWT...');
        const jwtToken = generarJwt(testUser);
        const decoded = verificarJwt(jwtToken);

        if (decoded && decoded.email === testUser.email && decoded.rol === testUser.rol) {
            pass('JWT firmado y verificado correctamente', `Subject: ${decoded.email}, Rol: ${decoded.rol}`);
        } else {
            fail('JWT firmado y verificado correctamente', 'El payload decodificado no coincide');
        }

        const badJwt = verificarJwt('token_totalmente_invalido_y_manipulado');
        if (badJwt === null) {
            pass('JWT corrupto rechazado correctamente', 'Retornó null');
        } else {
            fail('JWT corrupto rechazado correctamente', 'Aceptó token corrupto');
        }

        // -------------------------------------------------------------
        // TEST 9: Servicio de Envío de Enlace Mágico (mail.service.js)
        // -------------------------------------------------------------
        console.log('\n📧 8. Probando enviarMagicLink({ email, nombre, token })...');
        const mailResult = await enviarMagicLink({
            email: testUser.email,
            nombre: testUser.nombre,
            token: 'test_token_1234567890abcdef'
        });

        if (mailResult && mailResult.success && mailResult.url.includes('/api/auth/verify?token=')) {
            pass('Construcción de URL de Magic Link y entrega', `Modo: ${mailResult.mode}, URL: ${mailResult.url}`);
        } else {
            fail('Construcción de URL de Magic Link y entrega', JSON.stringify(mailResult));
        }

        // -------------------------------------------------------------
        // RESUMEN FINAL
        // -------------------------------------------------------------
        console.log('\n========================================================================');
        console.log(`📊 RESUMEN: ${passedTests}/${totalTests} PRUEBAS COMPLETADAS CON ÉXITO [PASS]`);
        console.log('========================================================================\n');

        if (passedTests === totalTests) {
            console.log('🎉 ¡TODOS LOS COMPONENTES DE AUTENTICACIÓN FUNCIONAN AL 100%!');
            process.exit(0);
        } else {
            console.error('❌ Hubo pruebas fallidas.');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Error fatal durante la ejecución de pruebas:', err);
        process.exit(1);
    }
}

runTests();
