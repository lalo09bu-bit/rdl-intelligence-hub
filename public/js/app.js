/**
 * RDL Intelligence Hub - Main Application Entry Point & Login Controller
 * Splash Screen flotante con destellos verdes, control de roles y Metas Ponderadas (100%)
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando RDL Intelligence Hub...');
    
    // Iniciar Animación de Carga Splash Screen y verificar sesión segura
    runSplashScreenAnimation(async () => {
        if (window.loginMod) {
            await window.loginMod.verificarSesionActiva();
        }
    });
});

/**
 * Animación Splash Screen con GSAP (Logo flotante RDL + Barra de progreso)
 */
function runSplashScreenAnimation(onCompleteCallback) {
    const splash = document.getElementById('splash-screen');
    const progressBar = document.getElementById('splash-progress');
    const statusText = document.getElementById('splash-status-text');

    const steps = [
        { pct: 25, text: 'Inicializando motor RDL Intelligence Hub...' },
        { pct: 55, text: 'Estableciendo WebSocket en puerto 9060...' },
        { pct: 85, text: 'Cargando esquema SQLite, metas ponderadas (100%) y vacaciones...' },
        { pct: 100, text: '¡Plataforma RDL lista!' }
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            if (progressBar) progressBar.style.width = `${step.pct}%`;
            if (statusText) statusText.textContent = step.text;
            currentStep++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(splash, {
                        opacity: 0,
                        duration: 0.6,
                        onComplete: () => {
                            splash.style.display = 'none';
                            if (onCompleteCallback) onCompleteCallback();
                        }
                    });
                } else {
                    splash.style.display = 'none';
                    if (onCompleteCallback) onCompleteCallback();
                }
            }, 400);
        }
    }, 450);
}

/**
 * Controlador de Inicio de Sesión y Verificación de Sesión Activa
 */
class LoginModule {
    constructor() {
        this.users = [];
        this.init();
    }

    init() {
        // Escuchar nuevo usuario remoto vía Socket.io
        window.addEventListener('rdl_usuario_creado', () => {
            this.loadUsers();
        });
    }

    /**
     * Verifica que el usuario tenga una sesión HTTP-Only activa válida con JWT.
     * Si no la tiene, lo redirige inmediatamente a /login.
     */
    async verificarSesionActiva() {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Accept': 'application/json' }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user) {
                    window.currentUser = data.user;
                    this.onLoginSuccess(data.user);
                    return;
                }
            }

            // Si no hay sesión válida, redirigir a /login
            console.warn('⚠️ Sesión no detectada o expirada. Redirigiendo a pantalla de acceso institucional...');
            window.location.href = '/login';
        } catch (err) {
            console.error('Error al verificar sesión activa:', err);
            window.location.href = '/login';
        }
    }

    async loadUsers() {
        try {
            const res = await fetch('/api/usuarios');
            const data = await res.json();
            if (data.success && data.data) {
                this.users = data.data;
            }
        } catch (err) {
            console.error('Error cargando usuarios:', err);
        }
    }

    onLoginSuccess(user) {
        // Ocultar modal de login
        document.getElementById('login-modal').classList.remove('active');

        // Mostrar Plataforma Principal con animación GSAP
        const mainApp = document.getElementById('main-app-layout');
        mainApp.classList.remove('hidden');

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(mainApp,
                { opacity: 0, scale: 0.98 },
                { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
            );
        }

        // Actualizar Header
        document.getElementById('current-user-name').textContent = user.nombre;
        const roleBadge = document.getElementById('current-user-role-badge');
        roleBadge.textContent = user.puesto;

        // Renderizar Ficha del Empleado & Metas (Panel Izquierdo)
        if (window.empleadoMod) {
            window.empleadoMod.renderProfile(user);
        }

        // Cargar Metas Ponderadas (100%)
        if (window.metasMod) {
            window.metasMod.loadUserMetas(user.id);
        }

        // Cargar Muro Estilo Facebook (Panel Central)
        if (window.feedMod) {
            window.feedMod.loadFeed();
        }

        // Habilitar botón de administración de metas para Admin, Abogada SR y Recursos Humanos (RH)
        const isManager = user.rol === 'ADMIN' || user.rol === 'ABOGADA_SR' || user.rol === 'RH' || user.rol === 'ADMIN_RH';
        const btnAdminMetas = document.getElementById('btn-admin-manage-metas');
        if (btnAdminMetas) {
            if (isManager) {
                btnAdminMetas.classList.remove('hidden');
            } else {
                btnAdminMetas.classList.add('hidden');
            }
        }

        // Ajustar Permisos de Publicación según el Rol
        const composerCard = document.getElementById('post-composer-card');
        const jrNotice = document.getElementById('jr-notice-card');
        const avatarSm = document.getElementById('composer-user-avatar');

        const initials = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);
        if (avatarSm) avatarSm.textContent = initials;

        if (isManager) {
            if (composerCard) composerCard.classList.remove('hidden');
            if (jrNotice) jrNotice.classList.add('hidden');
        } else {
            if (composerCard) composerCard.classList.add('hidden');
            if (jrNotice) jrNotice.classList.remove('hidden');
        }

        // Registrar usuario en Socket.io
        if (window.clientSocket && window.clientSocket.socket) {
            window.clientSocket.socket.emit('join_room', user);
            window.clientSocket.showToast(`Bienvenida, ${user.nombre} (${user.rol})`, 'success');
        }
    }

    async logout() {
        window.currentUser = null;
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.warn('Aviso al cerrar sesión:', e);
        }
        window.location.href = '/login';
    }
}

window.loginMod = new LoginModule();

// Escuchar actualización remota de vacaciones
window.addEventListener('rdl_vacaciones_actualizadas', (e) => {
    const updatedUser = e.detail;
    if (window.currentUser && window.currentUser.id === updatedUser.id) {
        window.currentUser = updatedUser;
        if (window.empleadoMod) {
            window.empleadoMod.renderProfile(updatedUser);
        }
    }
});

// Evento para abrir modal de configuración de red IP
document.getElementById('btn-network-config')?.addEventListener('click', () => {
    document.getElementById('modal-network').classList.add('active');
    fetch('/api/health')
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById('local-ips-list');
            if (list && data.localIPs) {
                list.innerHTML = data.localIPs.map(ip => `<li><code>http://${ip}:9060</code></li>`).join('');
            }
        });
});
