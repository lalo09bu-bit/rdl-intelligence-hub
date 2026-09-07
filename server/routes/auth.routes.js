import { Router } from 'express';
import db from '../config/database.js';
import { crearMagicToken, validarMagicToken, generarJwt } from '../services/auth.service.js';
import { enviarMagicLink } from '../services/mail.service.js';
import { verificarSesion } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * POST /api/auth/magic-link
 * Solicita el envío de un Magic Link para inicio de sesión seguro.
 * Implementa protección contra enumeración de usuarios (retorna siempre 200).
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

    // Mensaje estándar anti-enumeración
    const responseMsg = 'Si el correo electrónico está registrado, recibirás un enlace de acceso en breve.';

    try {
        db.get('SELECT id, email, nombre, rol, estatus_laboral FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1', [email], async (err, usuario) => {
            if (err) {
                console.error('❌ Error al buscar usuario para magic link:', err.message);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }

            // Si el usuario existe y su cuenta está activa, generamos el enlace
            if (usuario && usuario.estatus_laboral === 'ACTIVO') {
                try {
                    const token = await crearMagicToken(usuario.id);
                    await enviarMagicLink({
                        email: usuario.email,
                        nombre: usuario.nombre,
                        token
                    });
                } catch (serviceErr) {
                    console.error('❌ Error al generar/enviar enlace mágico:', serviceErr.message);
                }
            } else if (usuario && usuario.estatus_laboral !== 'ACTIVO') {
                console.warn(`⚠️ Intento de acceso para usuario inactivo: ${email}`);
            }

            // Siempre responder con éxito y mensaje estándar (Anti-Enumeration Protection)
            return res.json({
                success: true,
                message: responseMsg
            });
        });
    } catch (err) {
        console.error('❌ Excepción en endpoint magic-link:', err);
        return res.status(500).json({ success: false, error: 'Error al procesar la solicitud.' });
    }
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
 * Acceso Rápido en Modo Desarrollo:
 * Permite iniciar sesión instantáneamente con los perfiles corporativos de prueba
 * emitiendo la cookie rdl_session y redirigiendo a la plataforma.
 */
router.get('/dev-login', (req, res) => {
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
