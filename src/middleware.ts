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

    // Verificar presencia de cookie rdl_session
    const sessionCookie = context.cookies.get('rdl_session');
    if (!sessionCookie || !sessionCookie.value) {
        return context.redirect('/login');
    }

    return next();
});
