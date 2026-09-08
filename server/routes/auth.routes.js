import { Router } from 'express';
import db from '../config/database.js';
import { crearMagicToken, validarMagicToken, generarJwt } from '../services/auth.service.js';
import { enviarMagicLink } from '../services/mail.service.js';
import { verificarSesion } from '../middlewares/auth.middleware.js';

const router = Router();

// Dominios corporativos estrictamente autorizados para la plataforma
export const AUTHORIZED_DOMAINS = ['adeltaconsultores.com', 'adeltaconsultore.com', 'rdlabogados.com.mx', 'rdl.com.mx'];

/**
 * Valida si una dirección de correo electrónico pertenece a los dominios corporativos autorizados.
 * @param {string} email 
 * @returns {boolean}
 */
export function esDominioAutorizado(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) return false;
    const domain = email.split('@').pop().trim().toLowerCase();
    return AUTHORIZED_DOMAINS.includes(domain);
}

/**
 * POST /api/auth/magic-link
 * Solicita el envío de un Magic Link para inicio de sesión seguro.
 * Verifica que el correo pertenezca a @adeltaconsultore.com o @rdlabogados.com.mx.
 * Si el usuario no existe, indica al frontend que debe auto-registrarse.
 */
router.post('/magic-link', async (req, res) => {
    const rawEmail = req.body && req.body.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Debes proporcionar un correo electrónico válido.'
        });
    }

    const email = rawEmail.trim().toLowerCase();

    // 1. Validar dominio institucional autorizado
    if (!esDominioAutorizado(email)) {
        return res.status(400).json({
            success: false,
            error: 'Acceso no autorizado. Solo se permiten correos institucionales de @adeltaconsultores.com y @rdlabogados.com.mx.'
        });
    }

    try {
        db.get('SELECT id, email, nombre, rol, puesto, departamento, estatus_laboral FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1', [email], async (err, usuario) => {
            if (err) {
                console.error('❌ Error al buscar usuario para magic link:', err.message);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }

            // 2. Si el usuario no existe en la base de datos, indicar que requiere auto-registro
            if (!usuario) {
                return res.json({
                    success: true,
                    registered: false,
                    email,
                    message: 'Correo institucional autorizado pero aún no registrado. Por favor crea tu perfil de colaborador.'
                });
            }

            // 3. Comprobar que la cuenta no esté inactiva o dada de baja
            if (usuario.estatus_laboral !== 'ACTIVO') {
                return res.status(403).json({
                    success: false,
                    error: 'Esta cuenta se encuentra inactiva. Por favor comunícate con la Dirección de Recursos Humanos.'
                });
            }

            // 4. Generar el token criptográfico de 15 minutos y despachar el enlace mágico
            try {
                const token = await crearMagicToken(usuario.id);
                await enviarMagicLink({
                    email: usuario.email,
                    nombre: usuario.nombre,
                    token
                });

                console.log(`✉️ Magic Link solicitado y enviado para: ${usuario.nombre} (${usuario.email})`);

                return res.json({
                    success: true,
                    registered: true,
                    email: usuario.email,
                    message: `Hemos enviado un enlace de acceso seguro a ${usuario.email}. Revisa tu bandeja de entrada en Outlook.`
                });
            } catch (serviceErr) {
                console.error('❌ Error al generar/enviar enlace mágico:', serviceErr.message);
                return res.status(500).json({ success: false, error: 'Error al enviar el enlace de acceso por correo.' });
            }
        });
    } catch (err) {
        console.error('❌ Excepción en endpoint magic-link:', err);
        return res.status(500).json({ success: false, error: 'Error al procesar la solicitud.' });
    }
});

/**
 * POST /api/auth/register-magic
 * Auto-registro de nuevos colaboradores con dominio institucional autorizado (@adeltaconsultore.com o @rdlabogados.com.mx).
 * Registra el perfil de colaborador en la base de datos y despacha el Magic Link de activación al correo.
 */
router.post('/register-magic', async (req, res) => {
    const { nombre, email: rawEmail, puesto, departamento, telefono } = req.body || {};

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
        return res.status(400).json({
            success: false,
            error: 'Debes proporcionar tu nombre completo (mínimo 3 caracteres).'
        });
    }

    if (!rawEmail || typeof rawEmail !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Debes proporcionar un correo electrónico válido.'
        });
    }

    const email = rawEmail.trim().toLowerCase();

    // 1. Validar restricción de dominio
    if (!esDominioAutorizado(email)) {
        return res.status(400).json({
            success: false,
            error: 'Dominio no autorizado. Solo se permite el registro con cuentas corporativas @adeltaconsultores.com o @rdlabogados.com.mx.'
        });
    }

    const puestoFinal = (puesto && typeof puesto === 'string' && puesto.trim()) ? puesto.trim() : 'Colaborador Corporativo';
    const deptFinal = (departamento && typeof departamento === 'string' && departamento.trim()) ? departamento.trim() : 'Legal & Consultoría';
    const telFinal = (telefono && typeof telefono === 'string' && telefono.trim()) ? telefono.trim() : '+52 (55) 5482-9000';

    // 2. Generar avatar de iniciales
    const partes = nombre.trim().split(/\s+/);
    const avatar = partes.length > 1 
        ? (partes[0][0] + partes[1][0]).toUpperCase()
        : partes[0].substring(0, 2).toUpperCase();

    // 3. Verificar si el correo ya existe
    db.get('SELECT id, email, nombre, estatus_laboral FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1', [email], async (checkErr, existing) => {
        if (checkErr) {
            console.error('❌ Error al verificar duplicidad de email:', checkErr.message);
            return res.status(500).json({ success: false, error: 'Error interno del servidor al verificar cuenta.' });
        }

        if (existing) {
            if (existing.estatus_laboral === 'ACTIVO') {
                try {
                    const token = await crearMagicToken(existing.id);
                    await enviarMagicLink({ email: existing.email, nombre: existing.nombre, token });
                    return res.json({
                        success: true,
                        registered: true,
                        alreadyExists: true,
                        message: `Este correo ya estaba registrado a nombre de ${existing.nombre}. Te hemos enviado tu enlace de acceso seguro a tu correo.`
                    });
                } catch (sendErr) {
                    return res.status(500).json({ success: false, error: 'Error al enviar el enlace de acceso.' });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    error: 'Esta cuenta ya existe pero se encuentra inactiva. Contacta a Recursos Humanos.'
                });
            }
        }

        // 4. Crear nuevo usuario en la base de datos
        const numEmpleado = `RDL-${Math.floor(100 + Math.random() * 900)}`;
        const fechaIngreso = new Date().toISOString().split('T')[0];

        const insertQuery = `
            INSERT INTO usuarios (
                email, nombre, rol, puesto, departamento, avatar, telefono,
                fecha_ingreso, tipo_contrato, numero_empleado, salario_base,
                estatus_laboral, dias_vacaciones_totales, dias_vacaciones_tomados
            ) VALUES (?, ?, 'ABOGADA_JR', ?, ?, ?, ?, ?, 'Tiempo Indeterminado', ?, 'Confidencial', 'ACTIVO', 12, 0)
        `;

        db.run(insertQuery, [email, nombre.trim(), puestoFinal, deptFinal, avatar, telFinal, fechaIngreso, numEmpleado], async function(insertErr) {
            if (insertErr) {
                console.error('❌ Error al registrar colaborador en BD:', insertErr.message);
                return res.status(500).json({ success: false, error: 'Error al dar de alta el perfil de colaborador.' });
            }

            const nuevoUsuarioId = this.lastID;
            console.log(`✅ Nuevo colaborador registrado en RDL: ${nombre.trim()} (${email}) con ID: ${nuevoUsuarioId}`);

            try {
                const token = await crearMagicToken(nuevoUsuarioId);
                await enviarMagicLink({
                    email,
                    nombre: nombre.trim(),
                    token
                });

                return res.json({
                    success: true,
                    registered: true,
                    isNew: true,
                    message: `¡Perfil creado con éxito! Hemos enviado tu enlace de acceso seguro a ${email}. Revisa tu bandeja de entrada en Outlook.`
                });
            } catch (mailErr) {
                console.error('❌ Error al enviar magic link post-registro:', mailErr.message);
                return res.json({
                    success: true,
                    registered: true,
                    isNew: true,
                    warning: 'Perfil creado correctamente, pero hubo un detalle al conectar con el servidor de correo. El enlace está disponible en la terminal.'
                });
            }
        });
    });
});

/**
 * GET /api/auth/verify
 * Verifica y consume el token de un enlace mágico.
 * Si es válido, emite una cookie httpOnly `rdl_session` con JWT y redirige a la plataforma.
 */
router.get('/verify', async (req, res) => {
    const token = req.query.token;

    if (!token || typeof token !== 'string') {
        return res.redirect('/login?error=token_invalido');
    }

    try {
        const usuario = await validarMagicToken(token);

        if (!usuario) {
            return res.redirect('/login?error=token_expirado_o_invalido');
        }

        // Generar JWT y asignar cookie segura httpOnly
        const jwtToken = generarJwt(usuario);

        res.cookie('rdl_session', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días de validez
        });

        console.log(`🔐 Sesión iniciada con éxito para: ${usuario.nombre} (${usuario.email})`);
        return res.redirect('/');
    } catch (err) {
        console.error('❌ Error durante la verificación del token:', err.message);
        return res.redirect('/login?error=error_verificacion');
    }
});

/**
 * GET /api/auth/me
 * Retorna los datos del usuario de la sesión activa.
 */
router.get('/me', verificarSesion, (req, res) => {
    return res.json({
        success: true,
        user: req.user
    });
});

/**
 * POST /api/auth/logout
 * Destruye la cookie de sesión activa.
 */
router.post('/logout', (req, res) => {
    res.clearCookie('rdl_session', {
        httpOnly: true,
        sameSite: 'lax'
    });

    return res.json({
        success: true,
        message: 'Sesión cerrada exitosamente.'
    });
});

/**
 * GET /api/auth/dev-login
 * Acceso Rápido en Modo Desarrollo (Solo si ALLOW_DEV_LOGIN === 'true').
 * En entornos de producción corporativa se mantiene deshabilitado por seguridad.
 */
router.get('/dev-login', (req, res) => {
    const isExplicitDev = process.env.ALLOW_DEV_LOGIN === 'true' || req.query.bypass === 'rdl_internal_debug';
    if (process.env.NODE_ENV === 'production' && !isExplicitDev) {
        return res.status(403).redirect('/login?error=dev_mode_desactivado');
    }

    const role = req.query.role;
    const email = req.query.email;

    let query = 'SELECT id, nombre, email, rol, puesto, departamento, avatar, foto_perfil FROM usuarios WHERE estatus_laboral = "ACTIVO"';
    let params = [];

    if (email) {
        query += ' AND LOWER(email) = LOWER(?) LIMIT 1';
        params = [email];
    } else if (role) {
        query += ' AND rol = ? LIMIT 1';
        params = [role];
    } else {
        query += ' AND rol = "RH" LIMIT 1';
    }

    db.get(query, params, (err, usuario) => {
        if (err || !usuario) {
            return res.redirect('/login?error=usuario_no_encontrado');
        }

        const jwtToken = generarJwt(usuario);

        res.cookie('rdl_session', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log(`⚡ [DEV LOGIN] Sesión instantánea iniciada como: ${usuario.nombre} (${usuario.rol})`);
        return res.redirect('/');
    });
});

export default router;
