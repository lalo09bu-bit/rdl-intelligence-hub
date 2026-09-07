import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const isLiveKey = resendApiKey && resendApiKey !== 're_your_api_key' && resendApiKey.startsWith('re_');
const resend = isLiveKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'RDL Intelligence Hub <notificaciones@rdl-abogados.com>';

/**
 * Envía un correo electrónico con el Enlace Mágico de acceso a la plataforma RDL Intelligence Hub.
 * Incorpora la paleta visual oficial corporativa: Azul Marino (#0f2d4a) y Verde Pino (#136a60).
 * 
 * @param {object} params
 * @param {string} params.email Correo electrónico del destinatario
 * @param {string} params.nombre Nombre del colaborador
 * @param {string} params.token Token de acceso en texto plano
 * @returns {Promise<object>} Resultado del envío o registro en consola
 */
export async function enviarMagicLink({ email, nombre, token }) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:9060';
    const magicLinkUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

    // Plantilla HTML corporativa RDL con Azul Marino (#0f2d4a) y Verde Pino (#136a60)
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso Seguro - RDL Intelligence Hub</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: #f1f5f9;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
            }
            .container {
                max-width: 580px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(15, 45, 74, 0.08);
                border: 1px solid #e2e8f0;
            }
            .header {
                background: linear-gradient(135deg, #0f2d4a 0%, #136a60 100%);
                padding: 32px 24px;
                text-align: center;
                color: #ffffff;
            }
            .header-title {
                font-size: 22px;
                font-weight: 700;
                letter-spacing: 0.5px;
                margin: 0 0 6px 0;
            }
            .header-subtitle {
                font-size: 13px;
                opacity: 0.85;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0;
            }
            .content {
                padding: 36px 32px;
            }
            .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #0f2d4a;
                margin-top: 0;
                margin-bottom: 16px;
            }
            .text {
                font-size: 15px;
                line-height: 1.6;
                color: #334155;
                margin-bottom: 24px;
            }
            .button-wrapper {
                text-align: center;
                margin: 32px 0;
            }
            .btn-magic {
                background-color: #0f2d4a;
                color: #ffffff !important;
                padding: 14px 32px;
                font-size: 15px;
                font-weight: 600;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                box-shadow: 0 4px 12px rgba(15, 45, 74, 0.25);
                transition: background-color 0.2s;
            }
            .notice-box {
                background-color: #f0fdf4;
                border-left: 4px solid #136a60;
                padding: 14px 16px;
                border-radius: 4px;
                margin: 24px 0;
                font-size: 13px;
                color: #166534;
            }
            .fallback-link {
                word-break: break-all;
                font-size: 12px;
                color: #136a60;
            }
            .footer {
                padding: 24px 32px;
                background-color: #f8fafc;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                font-size: 12px;
                color: #64748b;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="header-title">RDL INTELLIGENCE HUB</h1>
                <p class="header-subtitle">Plataforma Corporativa & Dirección de Talento</p>
            </div>
            <div class="content">
                <p class="greeting">Estimada/o ${nombre},</p>
                <p class="text">
                    Hemos recibido una solicitud para iniciar sesión en tu cuenta de <strong>RDL Intelligence Hub</strong>.
                    Para acceder de manera segura sin necesidad de contraseñas, haz clic en el siguiente botón:
                </p>
                
                <div class="button-wrapper">
                    <a href="${magicLinkUrl}" class="btn-magic" target="_blank">
                        Ingresar a RDL Intelligence Hub →
                    </a>
                </div>

                <div class="notice-box">
                    ⏱️ <strong>Aviso de Seguridad:</strong> Este enlace es personal, de un solo uso y expirará automáticamente en <strong>15 minutos</strong>.
                </div>

                <p class="text" style="font-size: 13px; color: #64748b;">
                    Si tienes dificultades con el botón, copia y pega este enlace en tu navegador web:<br>
                    <a href="${magicLinkUrl}" class="fallback-link">${magicLinkUrl}</a>
                </p>

                <p class="text" style="font-size: 12px; color: #94a3b8; margin-top: 24px; margin-bottom: 0;">
                    Si no solicitaste este acceso, puedes ignorar este mensaje. Nadie podrá ingresar a tu cuenta sin acceder a este correo.
                </p>
            </div>
            <div class="footer">
                <strong>RDL Abogados & Consultoría</strong> • Reclutamiento e Integración de Talento<br>
                Este es un correo automático de seguridad corporativa. Por favor, no respondas a este mensaje.
            </div>
        </div>
    </body>
    </html>
    `;

    // Resaltar Magic Link en la consola para desarrollo local y pruebas inmediatas
    console.log(`
\x1b[36m╔══════════════════════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[36m║  📧 MAGIC LINK GENERADO (RDL INTELLIGENCE HUB - DEV MODE)                        ║\x1b[0m
\x1b[36m╠══════════════════════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[36m║  👤 Para:     \x1b[1m\x1b[37m${nombre} <${email}>\x1b[0m
\x1b[36m║  ⏱️ Expira:   15 minutos (un solo uso)                                          ║\x1b[0m
\x1b[36m╚══════════════════════════════════════════════════════════════════════════════════╝\x1b[0m
\x1b[32m\x1b[1m🔗 [DEV LINK] Clic aquí para iniciar sesión: ${magicLinkUrl}\x1b[0m
    `);

    // Si Resend está configurado con una clave real, enviamos el correo
    if (resend) {
        try {
            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: '🔐 Tu Enlace Mágico de Acceso - RDL Intelligence Hub',
                html: htmlContent
            });

            if (error) {
                console.warn('⚠️ Resend API devolvió un aviso:', error.message);
                return { success: true, mode: 'fallback_console', url: magicLinkUrl, error: error.message };
            }

            console.log(`✅ Correo de Magic Link enviado vía Resend a ${email} (ID: ${data?.id})`);
            return { success: true, mode: 'resend', id: data?.id, url: magicLinkUrl };
        } catch (sendErr) {
            console.warn('⚠️ Error al conectar con servicio Resend, enlace disponible en consola:', sendErr.message);
            return { success: true, mode: 'fallback_console', url: magicLinkUrl, error: sendErr.message };
        }
    }

    return { success: true, mode: 'console', url: magicLinkUrl };
}

export default {
    enviarMagicLink
};
