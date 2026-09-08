import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
    const { pathname } = context.url;

    // Rutas y recursos públicos permitidos sin autenticación previa
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_astro') ||
        pathname.startsWith('/favicon') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.jpeg') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js')
    ) {
        return next();
    }

    // La verificación de sesión en producción la realiza Express en server/server.js
    return next();
});
